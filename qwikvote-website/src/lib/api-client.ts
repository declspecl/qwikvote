import type { ZodType } from "zod/v4";
import {
  pollResponseSchema,
  voteResponseSchema,
  apiErrorSchema,
  type PollResponse,
  type VoteResponse,
  type CreatePollForm,
  type VoteRequest,
  type CloseRequest,
} from "./schemas";

const API_BASE_URL = "https://9zx14x4ipk.execute-api.us-east-1.amazonaws.com/v1/";

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

async function apiFetch<T>(path: string, schema: ZodType<T>, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    let detail = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      const parsed = apiErrorSchema.safeParse(body);
      if (parsed.success) {
        detail = parsed.data.detail;
      }
    } catch {
      // use default detail
    }
    throw new ApiError(res.status, detail);
  }

  const data = await res.json();
  return schema.parse(data);
}

export function createPoll(body: CreatePollForm): Promise<PollResponse> {
  return apiFetch("/polls", pollResponseSchema, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getPoll(pollId: string): Promise<PollResponse> {
  return apiFetch(`/polls/${pollId}`, pollResponseSchema);
}

export function submitVote(pollId: string, body: VoteRequest): Promise<VoteResponse> {
  return apiFetch(`/polls/${pollId}/vote`, voteResponseSchema, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function closePoll(pollId: string, body: CloseRequest): Promise<PollResponse> {
  return apiFetch(`/polls/${pollId}/close`, pollResponseSchema, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
