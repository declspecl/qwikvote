from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from typing import Any

import boto3
from boto3.dynamodb.conditions import Key
from botocore.config import Config
from returns.result import Failure, Result, Success

from poll.errors import PollError
from poll.models import PollConfig, PollOption, PollResponse, PollResults, Vote

_TABLE_NAME: str = os.environ.get("DYNAMODB_TABLE_NAME", "qwikvote-polls")
_DDB_ENDPOINT_URL: str | None = os.environ.get("DYNAMODB_ENDPOINT_URL")
_AWS_REGION: str = os.environ.get("AWS_REGION", "us-east-1")

_BOTOCORE_CONFIG = Config(
    # Make local-dev failures obvious instead of “hanging” for a long time.
    connect_timeout=float(os.environ.get("AWS_CONNECT_TIMEOUT_SECONDS", "2")),
    read_timeout=float(os.environ.get("AWS_READ_TIMEOUT_SECONDS", "5")),
    retries={"max_attempts": int(os.environ.get("AWS_MAX_ATTEMPTS", "2")), "mode": "standard"},
)


def _table() -> Any:
    if _DDB_ENDPOINT_URL:
        # DynamoDB Local does not require real AWS credentials, but boto3 still expects them.
        ddb = boto3.resource(
            "dynamodb",
            endpoint_url=_DDB_ENDPOINT_URL,
            region_name=_AWS_REGION,
            aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID", "local"),
            aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY", "local"),
            config=_BOTOCORE_CONFIG,
        )
    else:
        ddb = boto3.resource("dynamodb", region_name=_AWS_REGION, config=_BOTOCORE_CONFIG)

    return ddb.Table(_TABLE_NAME)


def _poll_pk(poll_id: str) -> dict[str, str]:
    return {"PK": f"POLL#{poll_id}", "SK": "METADATA"}


def _vote_pk(poll_id: str, vote_id: str) -> dict[str, str]:
    return {"PK": f"POLL#{poll_id}", "SK": f"VOTE#{vote_id}"}


def _parse_poll(item: dict[str, Any]) -> PollResponse:
    config = PollConfig(**json.loads(item.get("config", "{}")))
    options = [PollOption(**o) for o in json.loads(item.get("options", "[]"))]
    results: PollResults | None = None

    if item.get("results"):
        results = PollResults(**json.loads(item["results"]))

    return PollResponse(
        poll_id=item["poll_id"],
        title=item["title"],
        description=item.get("description", ""),
        options=options,
        status=item.get("status", "open"),
        config=config,
        results=results,
    )


def create_poll(
    poll_id: str,
    title: str,
    description: str,
    options: list[PollOption],
    config: PollConfig,
    password: str | None,
) -> Result[PollResponse, PollError]:
    item: dict[str, Any] = {
        **_poll_pk(poll_id),
        "poll_id": poll_id,
        "title": title,
        "description": description,
        "options": json.dumps([o.model_dump() for o in options]),
        "config": json.dumps(config.model_dump()),
        "status": "open",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    if password is not None:
        item["password"] = password
    try:
        _table().put_item(Item=item)
        return Success(_parse_poll(item))
    except Exception as exc:
        return Failure(PollError.internal(str(exc)))


def get_poll(poll_id: str) -> Result[PollResponse, PollError]:
    try:
        resp = _table().get_item(Key=_poll_pk(poll_id))
    except Exception as exc:
        return Failure(PollError.internal(str(exc)))

    if "Item" not in resp:
        return Failure(PollError.not_found(poll_id))

    return Success(_parse_poll(resp["Item"]))


def get_poll_with_password(poll_id: str) -> Result[tuple[PollResponse, str | None], PollError]:
    """Returns (poll, stored_password) so the service layer can validate it."""
    try:
        resp = _table().get_item(Key=_poll_pk(poll_id))
    except Exception as exc:
        return Failure(PollError.internal(str(exc)))

    if "Item" not in resp:
        return Failure(PollError.not_found(poll_id))

    item = resp["Item"]

    return Success((_parse_poll(item), item.get("password")))


def get_votes(poll_id: str) -> Result[list[Vote], PollError]:
    try:
        resp = _table().query(
            KeyConditionExpression=(
                Key("PK").eq(f"POLL#{poll_id}") & Key("SK").begins_with("VOTE#")
            )
        )
    except Exception as exc:
        return Failure(PollError.internal(str(exc)))

    votes = [
        Vote(
            vote_id=item["vote_id"],
            option_id=item["option_id"],
            weight=int(item.get("weight", 1)),
            is_veto=bool(item.get("is_veto", False)),
        )
        for item in resp.get("Items", [])
    ]

    return Success(votes)


def add_vote(
    poll_id: str,
    vote_id: str,
    option_id: str,
    weight: int,
    is_veto: bool,
) -> Result[str, PollError]:
    try:
        _table().put_item(
            Item={
                **_vote_pk(poll_id, vote_id),
                "vote_id": vote_id,
                "poll_id": poll_id,
                "option_id": option_id,
                "weight": weight,
                "is_veto": is_veto,
                "submitted_at": datetime.now(timezone.utc).isoformat(),
            }
        )

        return Success(vote_id)
    except Exception as exc:
        return Failure(PollError.internal(str(exc)))


def save_poll_results(
    poll_id: str,
    winner: str | None,
    winner_text: str | None,
    result_justification: str,
    scores: dict[str, float],
    veto_disqualified: list[str],
) -> Result[PollResponse, PollError]:
    results = PollResults(
        scores=scores,
        winner=winner,
        winner_text=winner_text,
        result_justification=result_justification,
        veto_disqualified=veto_disqualified,
    )

    try:
        _table().update_item(
            Key=_poll_pk(poll_id),
            UpdateExpression="SET #s = :closed, results = :results",
            ExpressionAttributeNames={"#s": "status"},
            ExpressionAttributeValues={
                ":closed": "closed",
                ":results": json.dumps(results.model_dump()),
            },
        )
        return get_poll(poll_id)
    
    except Exception as exc:
        return Failure(PollError.internal(str(exc)))
