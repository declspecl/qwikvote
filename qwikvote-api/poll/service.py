from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from returns.result import Failure, Result, Success
from toolz import groupby, valmap

import poll.repository as repo
from poll.errors import PollError
from poll.models import (
    CloseRequest,
    PollConfig,
    PollCreateRequest,
    PollOption,
    PollResponse,
    VoteRequest,
    VoteResponse,
    Vote,
)
from randomness.service import pick_random_option
from suggestion.service import generate_suggestions

if TYPE_CHECKING:
    pass


def _compute_scores(
    votes: list[Vote],
    options: list[PollOption],
    config: PollConfig,
) -> dict[str, float]:
    regular_votes = [v for v in votes if not v.is_veto]
    grouped: dict[str, list[Vote]] = groupby(lambda v: v.option_id, regular_votes)
    scored: dict[str, float] = valmap(
        lambda grp: float(sum(v.weight for v in grp))
        if config.weighted_voting
        else float(len(grp)),
        grouped,
    )

    return {opt.option_id: scored.get(opt.option_id, 0.0) for opt in options}


def _veto_disqualified(votes: list[Vote], config: PollConfig) -> frozenset[str]:
    if not config.veto_enabled:
        return frozenset()

    return frozenset(v.option_id for v in votes if v.is_veto)


def _determine_winner(
    scores: dict[str, float],
    veto_disqualified: frozenset[str],
    options: list[PollOption],
) -> Result[tuple[str, str], PollError]:
    eligible = {k: v for k, v in scores.items() if k not in veto_disqualified}

    if not eligible:
        return Failure(PollError.all_options_vetoed())

    max_score = max(eligible.values())
    tied_ids = [k for k, v in eligible.items() if v == max_score]

    def _text(option_id: str) -> str:
        return next((o.text for o in options if o.option_id == option_id), option_id)

    if len(tied_ids) == 1:
        winner_id = tied_ids[0]
        return Success((winner_id, f"'{_text(winner_id)}' won with a score of {max_score:.1f}."))

    tied_texts = [_text(t) for t in tied_ids]
    tie_prefix = f"Options {tied_texts} were tied with score {max_score:.1f}. "

    random_result = pick_random_option(tied_ids)
    match random_result:
        case Success(winner_id):
            return Success((
                winner_id,
                tie_prefix + f"'{_text(winner_id)}' was selected by Random.org tie-breaking.",
            ))
        case Failure(_):
            winner_id = tied_ids[0]

            return Success((
                winner_id,
                tie_prefix + f"'{_text(winner_id)}' was selected (Random.org unavailable; fallback used).",
            ))


def _assert_poll_open(poll: PollResponse) -> Result[PollResponse, PollError]:
    if poll.status != "open":
        return Failure(PollError.poll_not_open(poll.poll_id))

    return Success(poll)


def _assert_option_valid(poll: PollResponse, option_id: str) -> Result[PollResponse, PollError]:
    if not any(o.option_id == option_id for o in poll.options):
        return Failure(PollError.invalid_option(option_id))

    return Success(poll)


def _assert_password(
    poll_and_stored: tuple[PollResponse, str | None],
    provided: str | None,
) -> Result[PollResponse, PollError]:
    poll, stored = poll_and_stored
    if stored is not None and provided != stored:
        return Failure(PollError.wrong_password())

    return Success(poll)


def create_poll(request: PollCreateRequest) -> Result[PollResponse, PollError]:
    options = [PollOption(text=text) for text in request.options]

    if request.config.llm_suggestions_enabled:
        suggestion_result = generate_suggestions(request.title, request.description, request.options)
        match suggestion_result:
            case Success(suggested_texts):
                suggested = [PollOption(text=t) for t in suggested_texts]
                options = options + suggested
            case Failure(_):
                pass

    poll_id = str(uuid.uuid4())
    return repo.create_poll(
        poll_id=poll_id,
        title=request.title,
        description=request.description,
        options=options,
        config=request.config,
        password=request.password,
    )


def get_poll(poll_id: str, password: str | None = None) -> Result[PollResponse, PollError]:
    poll_and_pw = repo.get_poll_with_password(poll_id)
    match poll_and_pw:
        case Failure(_):
            return poll_and_pw  # type: ignore[return-value]
        case Success(pair):
            pass

    password_check = _assert_password(pair, password)
    match password_check:
        case Failure(_):
            return password_check  # type: ignore[return-value]
        case Success(poll):
            return Success(poll)


def submit_vote(poll_id: str, request: VoteRequest) -> Result[VoteResponse, PollError]:
    poll_and_pw = repo.get_poll_with_password(poll_id)
    match poll_and_pw:
        case Failure(_):
            return poll_and_pw  # type: ignore[return-value]
        case Success(pair):
            pass

    password_check = _assert_password(pair, request.password)
    match password_check:
        case Failure(_):
            return password_check  # type: ignore[return-value]
        case Success(poll):
            pass

    open_check = _assert_poll_open(poll)
    match open_check:
        case Failure(_):
            return open_check  # type: ignore[return-value]
        case Success(_):
            pass

    option_check = _assert_option_valid(poll, request.option_id)
    match option_check:
        case Failure(_):
            return option_check  # type: ignore[return-value]
        case Success(_):
            pass

    vote_id = str(uuid.uuid4())
    vote_stored = repo.add_vote(
        poll_id=poll_id,
        vote_id=vote_id,
        option_id=request.option_id,
        weight=request.weight,
        is_veto=request.is_veto,
    )
    match vote_stored:
        case Failure(_):
            return vote_stored  # type: ignore[return-value]
        case Success(_):
            pass

    votes_result = repo.get_votes(poll_id)
    match votes_result:
        case Failure(_):
            return votes_result  # type: ignore[return-value]
        case Success(all_votes):
            pass

    scores = _compute_scores(all_votes, poll.options, poll.config)

    return Success(VoteResponse(
        vote_id=vote_id,
        option_id=request.option_id,
        current_scores=scores,
    ))


def close_poll(poll_id: str, request: CloseRequest) -> Result[PollResponse, PollError]:
    poll_and_pw = repo.get_poll_with_password(poll_id)
    match poll_and_pw:
        case Failure(_):
            return poll_and_pw  # type: ignore[return-value]
        case Success(pair):
            pass

    password_check = _assert_password(pair, request.password)
    match password_check:
        case Failure(_):
            return password_check  # type: ignore[return-value]
        case Success(poll):
            pass

    if poll.status == "closed":
        return Failure(PollError.already_closed(poll_id))

    votes_result = repo.get_votes(poll_id)
    match votes_result:
        case Failure(_):
            return votes_result  # type: ignore[return-value]
        case Success(all_votes):
            pass

    scores = _compute_scores(all_votes, poll.options, poll.config)
    veto_bad = _veto_disqualified(all_votes, poll.config)

    winner_result = _determine_winner(scores, veto_bad, poll.options)
    match winner_result:
        case Failure(_):
            return winner_result  # type: ignore[return-value]
        case Success((winner_id, justification)):
            pass

    winner_text = next(
        (o.text for o in poll.options if o.option_id == winner_id), None
    )

    # Generate AI explanation — best-effort, don't fail the close if it errors
    ai_explanation: str | None = None
    try:
        from suggestion.service import explain_results
        option_texts = [o.text for o in poll.options]
        ai_explanation = explain_results(poll.title, option_texts, scores)
    except Exception:
        pass

    return repo.save_poll_results(
        poll_id=poll_id,
        winner=winner_id,
        winner_text=winner_text,
        result_justification=justification,
        scores=scores,
        veto_disqualified=list(veto_bad),
        ai_explanation=ai_explanation,
    )
