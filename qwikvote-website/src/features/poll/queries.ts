import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import * as api from "@/lib/api-client";
import type { CreatePollForm, VoteRequest, CloseRequest } from "@/lib/schemas";

export const pollKeys = {
  all: ["polls"] as const,
  detail: (id: string) => ["polls", id] as const,
};

export function pollQueryOptions(pollId: string) {
  return queryOptions({
    queryKey: pollKeys.detail(pollId),
    queryFn: () => api.getPoll(pollId),
  });
}

export function useCreatePoll() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (body: CreatePollForm) => api.createPoll(body),
    onSuccess: (data) => {
      toast.success("Poll created! Share the link below");
      navigate({ to: "/poll/$pollId", params: { pollId: data.poll_id } });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useSubmitVote(pollId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: VoteRequest) => api.submitVote(pollId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pollKeys.detail(pollId) });
      toast.success("Vote submitted!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useClosePoll(pollId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CloseRequest) => api.closePoll(pollId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pollKeys.detail(pollId) });
      toast.success("Poll closed!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
