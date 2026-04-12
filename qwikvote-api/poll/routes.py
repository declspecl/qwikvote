from __future__ import annotations

from fastapi import APIRouter, HTTPException
from returns.result import Failure, Success

from poll.errors import PollError, PollErrorCode
from poll.models import (
    CloseRequest,
    PollCreateRequest,
    PollResponse,
    VoteRequest,
    VoteResponse,
)
import poll.service as service

router = APIRouter(prefix="/polls", tags=["polls"])


_HTTP_STATUS: dict[PollErrorCode, int] = {
    PollErrorCode.NOT_FOUND: 404,
    PollErrorCode.ALREADY_CLOSED: 409,
    PollErrorCode.POLL_NOT_OPEN: 409,
    PollErrorCode.INVALID_OPTION: 422,
    PollErrorCode.WRONG_PASSWORD: 403,
    PollErrorCode.ALL_OPTIONS_VETOED: 422,
    PollErrorCode.EXTERNAL_SERVICE_UNAVAILABLE: 502,
    PollErrorCode.INTERNAL_ERROR: 500,
}


def _to_http(error: PollError) -> HTTPException:
    status = _HTTP_STATUS.get(error.code, 500)
    return HTTPException(status_code=status, detail=error.detail or error.code.name)


@router.post("", status_code=201, response_model=PollResponse)
def create_poll(body: PollCreateRequest) -> PollResponse:
    match service.create_poll(body):
        case Success(poll):
            return poll
        case Failure(error):
            raise _to_http(error)


@router.get("/{poll_id}", response_model=PollResponse)
def get_poll(poll_id: str, password: str | None = None) -> PollResponse:
    match service.get_poll(poll_id, password):
        case Success(poll):
            return poll
        case Failure(error):
            raise _to_http(error)


@router.post("/{poll_id}/vote", response_model=VoteResponse)
def vote(poll_id: str, body: VoteRequest) -> VoteResponse:
    match service.submit_vote(poll_id, body):
        case Success(vote_response):
            return vote_response
        case Failure(error):
            raise _to_http(error)


@router.post("/{poll_id}/close", response_model=PollResponse)
def close_poll(poll_id: str, body: CloseRequest) -> PollResponse:
    match service.close_poll(poll_id, body):
        case Success(poll):
            return poll
        case Failure(error):
            raise _to_http(error)
            
