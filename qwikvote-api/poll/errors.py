from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum, auto


class PollErrorCode(Enum):
    NOT_FOUND = auto()
    ALREADY_CLOSED = auto()
    POLL_NOT_OPEN = auto()
    INVALID_OPTION = auto()
    WRONG_PASSWORD = auto()
    ALL_OPTIONS_VETOED = auto()
    EXTERNAL_SERVICE_UNAVAILABLE = auto()
    INTERNAL_ERROR = auto()


@dataclass(frozen=True)
class PollError:
    code: PollErrorCode
    detail: str = field(default="")

    @staticmethod
    def not_found(poll_id: str) -> PollError:
        return PollError(PollErrorCode.NOT_FOUND, f"Poll '{poll_id}' not found")

    @staticmethod
    def already_closed(poll_id: str) -> PollError:
        return PollError(PollErrorCode.ALREADY_CLOSED, f"Poll '{poll_id}' is already closed")

    @staticmethod
    def poll_not_open(poll_id: str) -> PollError:
        return PollError(PollErrorCode.POLL_NOT_OPEN, f"Poll '{poll_id}' is not open for voting")

    @staticmethod
    def invalid_option(option_id: str) -> PollError:
        return PollError(PollErrorCode.INVALID_OPTION, f"Option '{option_id}' does not exist in this poll")

    @staticmethod
    def wrong_password() -> PollError:
        return PollError(PollErrorCode.WRONG_PASSWORD, "Incorrect poll password")

    @staticmethod
    def all_options_vetoed() -> PollError:
        return PollError(PollErrorCode.ALL_OPTIONS_VETOED, "All options were vetoed; no winner can be determined")

    @staticmethod
    def external_unavailable(service: str) -> PollError:
        return PollError(PollErrorCode.EXTERNAL_SERVICE_UNAVAILABLE, f"External service '{service}' is unavailable")

    @staticmethod
    def internal(detail: str) -> PollError:
        return PollError(PollErrorCode.INTERNAL_ERROR, detail)
