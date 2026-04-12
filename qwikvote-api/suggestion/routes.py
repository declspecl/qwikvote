from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from returns.result import Success, Failure
import suggestion.service as service

router = APIRouter(prefix="/llm", tags=["llm"])


class ExplainRequest(BaseModel):
    poll_id: str
    title: str
    options: list[str]
    scores: dict[str, int]


class SuggestionRequest(BaseModel):
    title: str
    description: str
    existing_options: list[str] = []


@router.post("/explain")
def explain_poll(req: ExplainRequest):
    try:
        explanation_text = service.explain_results(req.title, req.options, req.scores)
        return {"explanation": explanation_text}
    except Exception as e:
        print("Error in explain_results:", e)
        raise HTTPException(status_code=500, detail="Failed to generate explanation")


@router.post("/suggestions")
def suggest_options(req: SuggestionRequest):
    result = service.generate_suggestions(req.title, req.description, req.existing_options)

    match result:
        case Success(suggestions):
            return {"suggestions": suggestions}
        case Failure(err):
            raise HTTPException(status_code=500, detail=err.detail)
