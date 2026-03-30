from __future__ import annotations

import os
from dataclasses import dataclass

from google import genai
from returns.result import Failure, Result, Success


@dataclass(frozen=True)
class SuggestionError:
    detail: str


_MODEL = "gemini-3-flash-preview"
_MAX_SUGGESTIONS = 5


def generate_suggestions(
    title: str, description: str
) -> Result[list[str], SuggestionError]:
    """
    Calls Gemini to produce up to _MAX_SUGGESTIONS additional option texts
    for a poll given its title and description.
    Returns Failure if the API key is missing or the call fails.
    """
    api_key = ""
    if not api_key:
        return Failure(SuggestionError("GEMINI_API_KEY is not configured"))

    prompt = (
        f"You are helping create options for an online poll.\n"
        f'Poll title: "{title}"\n'
        f'Poll description: "{description}"\n\n'
        f"Generate exactly {_MAX_SUGGESTIONS} concise, distinct poll options "
        f"that participants could vote on. Return only the options, one per line, "
        f"with no numbering, bullets, or extra commentary."
    )

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(model=_MODEL, contents=prompt)
        raw = response.text or ""
        suggestions = [line.strip() for line in raw.splitlines() if line.strip()]
        return Success(suggestions[:_MAX_SUGGESTIONS])
    except Exception as exc:
        return Failure(SuggestionError(str(exc)))


def explain_results(title: str, options: list[str], scores: dict) -> str:
    prompt = f"""
    Explain the results of this poll:

    Title: {title}

    Options and scores:
    {scores}

    Give a short, clear explanation of what the results mean and any insights.
    """

    client = genai.Client(api_key="")
    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=prompt,
    )

    return response.text
