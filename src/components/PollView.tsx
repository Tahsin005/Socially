'use client';

import { useMemo, useState } from "react";
import { PostWithDetails, votePoll } from "@/actions/post.action";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "./ui/button";
import { CheckCircle2Icon, ClockIcon, Loader2Icon } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

type PollData = NonNullable<PostWithDetails["poll"]>;

interface PollViewProps {
    poll: PollData;
    currentUserId: string | null;
}

export default function PollView({ poll, currentUserId }: PollViewProps) {
    const queryClient = useQueryClient();
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

    // Check if the current user already voted from server data
    const serverVotedOptionId = useMemo(() => {
        if (!currentUserId || !poll.votes) return null;
        const userVote = poll.votes.find((v) => v.userId === currentUserId);
        return userVote ? userVote.pollOptionId : null;
    }, [poll.votes, currentUserId]);

    // Active user vote (server vote or optimistic vote)
    const userVotedOptionId = selectedOptionId || serverVotedOptionId;
    const hasUserVoted = Boolean(userVotedOptionId);

    // Check expiration
    const isExpired = useMemo(() => {
        return new Date(poll.expiresAt).getTime() <= Date.now();
    }, [poll.expiresAt]);

    const showResults = hasUserVoted || isExpired;

    // Calculate votes per option and total votes (with optimistic adjustment if applicable)
    const { optionStats, totalVotes } = useMemo(() => {
        const isOptimisticNewVote = selectedOptionId && !serverVotedOptionId;

        let total = 0;
        const counts: Record<string, number> = {};

        for (const opt of poll.options) {
            let count = opt._count?.votes ?? 0;
            if (isOptimisticNewVote && opt.id === selectedOptionId) {
                count += 1;
            }
            counts[opt.id] = count;
            total += count;
        }

        const maxVotes = Math.max(0, ...Object.values(counts));

        const stats = poll.options.map((opt) => {
            const count = counts[opt.id] || 0;
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
            const isLeading = maxVotes > 0 && count === maxVotes;
            const isUserPick = opt.id === userVotedOptionId;

            return {
                id: opt.id,
                text: opt.text,
                votes: count,
                percentage,
                isLeading,
                isUserPick,
            };
        });

        return { optionStats: stats, totalVotes: total };
    }, [poll.options, selectedOptionId, serverVotedOptionId, userVotedOptionId]);

    const voteMutation = useMutation({
        mutationFn: async (optionId: string) => {
            return await votePoll(poll.id, optionId);
        },
        onMutate: (optionId) => {
            setSelectedOptionId(optionId);
        },
        onSuccess: (result) => {
            if (result?.success) {
                toast.success("Vote submitted!");
                queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
            } else {
                setSelectedOptionId(null);
                toast.error(result?.error || "Failed to submit vote");
            }
        },
        onError: (error) => {
            console.error("Poll vote error:", error);
            setSelectedOptionId(null);
            toast.error("Failed to submit vote");
        },
    });

    const handleVote = (optionId: string) => {
        if (!currentUserId || hasUserVoted || isExpired || voteMutation.isPending) return;
        voteMutation.mutate(optionId);
    };

    // Format remaining time or ended status
    const timeStatus = useMemo(() => {
        if (isExpired) return "Final results";
        try {
            return `${formatDistanceToNowStrict(new Date(poll.expiresAt))} left`;
        } catch {
            return "Active";
        }
    }, [isExpired, poll.expiresAt]);

    return (
        <div className="mt-3 rounded-xl border border-border/80 bg-card/60 backdrop-blur-xs p-4 shadow-2xs transition-all">
            <div className="space-y-2.5">
                {optionStats.map((option) => {
                    if (showResults) {
                        return (
                            <div
                                key={option.id}
                                className={`relative overflow-hidden rounded-xl border p-3.5 transition-all duration-300 ${
                                    option.isUserPick
                                        ? "border-primary/60 bg-primary/5 dark:bg-primary/10 font-medium ring-1 ring-primary/20"
                                        : "border-border/60 bg-muted/20"
                                }`}
                            >
                                <div
                                    className={`absolute inset-y-0 left-0 rounded-xl transition-all duration-700 ease-out ${
                                        option.isUserPick
                                            ? "bg-primary/25 dark:bg-primary/35"
                                            : option.isLeading && totalVotes > 0
                                            ? "bg-primary/15 dark:bg-primary/20"
                                            : "bg-muted/70 dark:bg-muted/40"
                                    }`}
                                    style={{ width: `${option.percentage}%` }}
                                />

                                <div className="relative z-10 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                        {option.isUserPick && (
                                            <CheckCircle2Icon className="size-4 shrink-0 text-primary animate-in fade-in zoom-in-75 duration-200" />
                                        )}
                                        <span className="text-sm font-medium text-foreground break-words">
                                            {option.text}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-xs text-muted-foreground font-normal">
                                            {option.votes} {option.votes === 1 ? "vote" : "votes"}
                                        </span>
                                        <span className="text-sm font-bold tabular-nums text-foreground">
                                            {option.percentage}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    // Interactive unvoted state
                    if (!currentUserId) {
                        return (
                            <SignInButton key={option.id} mode="modal">
                                <Button
                                    variant="outline"
                                    className="w-full justify-between h-auto py-3 px-4 rounded-xl border-border/80 hover:border-primary/70 hover:bg-primary/5 hover:text-primary transition-all text-left font-medium text-sm group"
                                >
                                    <span className="break-words">{option.text}</span>
                                    <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                                        Vote
                                    </span>
                                </Button>
                            </SignInButton>
                        );
                    }

                    return (
                        <Button
                            key={option.id}
                            type="button"
                            variant="outline"
                            onClick={() => handleVote(option.id)}
                            disabled={voteMutation.isPending}
                            className="w-full justify-between h-auto py-3 px-4 rounded-xl border-border/80 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all text-left font-medium text-sm group cursor-pointer"
                        >
                            <span className="break-words">{option.text}</span>
                            {voteMutation.isPending && selectedOptionId === option.id ? (
                                <Loader2Icon className="size-4 animate-spin text-primary shrink-0" />
                            ) : (
                                <span className="text-xs font-normal text-muted-foreground group-hover:text-primary transition-colors">
                                    Vote
                                </span>
                            )}
                        </Button>
                    );
                })}
            </div>

            <div className="mt-3.5 flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/40">
                <span>
                    {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
                    {hasUserVoted && " • Voted"}
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                    <ClockIcon className="size-3.5" />
                    {timeStatus}
                </span>
            </div>
        </div>
    );
}
