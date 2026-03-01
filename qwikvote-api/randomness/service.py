from __future__ import annotations

import os
from dataclasses import dataclass

import httpx
from returns.result import Failure, Result, Success

_ENDPOINT = "https://api.random.org/json-rpc/4/invoke"


@dataclass(frozen=True)
class RandomnessError:
    detail: str


def pick_random_option(options: list[str]) -> Result[str, RandomnessError]:
    if not options:
        return Failure(RandomnessError("options list is empty"))

    if len(options) == 1:
        return Success(options[0])

    api_key = os.environ.get("RANDOM_ORG_API_KEY", "")
    if not api_key:
        return Failure(RandomnessError("RANDOM_ORG_API_KEY is not configured"))

    payload = {
        "jsonrpc": "2.0",
        "method": "generateIntegers",
        "params": {
            "apiKey": api_key,
            "n": 1,
            "min": 0,
            "max": len(options) - 1,
            "replacement": True,
        },
        "id": 1,
    }

    try:
        response = httpx.post(_ENDPOINT, json=payload, timeout=10.0)
        response.raise_for_status()
        data = response.json()
        index: int = data["result"]["random"]["data"][0]
        return Success(options[index])
    except Exception as exc:
        return Failure(RandomnessError(str(exc)))
