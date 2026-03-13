import { z } from "zod/v4";

// --- Response schemas (mirror Pydantic models) ---

export const pollOptionSchema = z.object({
  option_id: z.string(),
  text: z.string(),
});

export const pollConfigSchema = z.object({
  weighted_voting: z.boolean(),
  veto_enabled: z.boolean(),
  llm_suggestions_enabled: z.boolean(),
});

export const pollResultsSchema = z.object({
  scores: z.record(z.string(), z.number()),
  winner: z.string().nullable(),
  winner_text: z.string().nullable(),
  result_justification: z.string(),
  veto_disqualified: z.array(z.string()),
});

export const pollResponseSchema = z.object({
  poll_id: z.string(),
  title: z.string(),
  description: z.string(),
  options: z.array(pollOptionSchema),
  status: z.enum(["open", "closed"]),
  config: pollConfigSchema,
  results: pollResultsSchema.nullable(),
});

export const voteResponseSchema = z.object({
  vote_id: z.string(),
  option_id: z.string(),
  current_scores: z.record(z.string(), z.number()),
});

export const apiErrorSchema = z.object({
  detail: z.string(),
});

// --- Request schemas (for form validation) ---

export const createPollFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  options: z
    .array(z.string().min(1, "Option text is required"))
    .min(2, "At least 2 options are required"),
  password: z.string().nullable(),
  config: pollConfigSchema,
});

export const voteRequestSchema = z.object({
  option_id: z.string(),
  weight: z.number().int().min(1).max(5),
  is_veto: z.boolean(),
  password: z.string().nullable(),
});

export const closeRequestSchema = z.object({
  password: z.string().nullable(),
});

// --- Inferred types ---

export type PollOption = z.infer<typeof pollOptionSchema>;
export type PollConfig = z.infer<typeof pollConfigSchema>;
export type PollResults = z.infer<typeof pollResultsSchema>;
export type PollResponse = z.infer<typeof pollResponseSchema>;
export type VoteResponse = z.infer<typeof voteResponseSchema>;
export type CreatePollForm = z.infer<typeof createPollFormSchema>;
export type VoteRequest = z.infer<typeof voteRequestSchema>;
export type CloseRequest = z.infer<typeof closeRequestSchema>;
