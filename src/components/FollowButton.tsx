'use client';

import { useState } from "react";
import { Button } from "./ui/button";
import toast from "react-hot-toast";
import { Loader2Icon } from "lucide-react";
import { toggleFollow } from "@/actions/user.action";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { useRouter } from "next/navigation";

interface FollowButtonProps {
    userId: string;
    initialIsFollowing?: boolean;
    onFollowToggle?: (isFollowing: boolean) => void;
    className?: string;
}

function FollowButton({
    userId,
    initialIsFollowing = false,
    onFollowToggle,
    className = "w-20",
}: FollowButtonProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [prevInitialIsFollowing, setPrevInitialIsFollowing] = useState(initialIsFollowing);

    if (initialIsFollowing !== prevInitialIsFollowing) {
        setPrevInitialIsFollowing(initialIsFollowing);
        setIsFollowing(initialIsFollowing);
    }

    const followMutation = useMutation({
        mutationFn: () => toggleFollow(userId),
        onMutate: async () => {
            const previousState = isFollowing;
            const optimisticState = !previousState;
            setIsFollowing(optimisticState);
            return { previousState };
        },
        onSuccess: (res, _, context) => {
            if (res?.success) {
                const confirmedState = typeof res.isFollowing === "boolean" ? res.isFollowing : !context.previousState;
                setIsFollowing(confirmedState);
                onFollowToggle?.(confirmedState);
                toast.success(confirmedState ? "User followed successfully" : "User unfollowed successfully");

                // Invalidate Following feed so new posts show up immediately
                queryClient.invalidateQueries({ queryKey: queryKeys.posts.following() });
                // Invalidate Who to Follow list
                queryClient.invalidateQueries({ queryKey: queryKeys.users.whoToFollow() });
                // Invalidate all user stats and follow relationships
                queryClient.invalidateQueries({ queryKey: queryKeys.users.all });

                router.refresh();
            } else {
                setIsFollowing(context.previousState);
                toast.error(res?.error || "Failed to update follow status");
            }
        },
        onError: (err, _, context) => {
            if (context) {
                setIsFollowing(context.previousState);
            }
            toast.error("Error updating follow status");
        },
    });

    const handleFollow = () => {
        if (followMutation.isPending) return;
        followMutation.mutate();
    };

    return (
        <Button
            size="sm"
            variant={isFollowing ? "outline" : "secondary"}
            className={className}
            onClick={handleFollow}
            disabled={followMutation.isPending}
        >
            {followMutation.isPending ? (
                <Loader2Icon className="size-4 animate-spin" />
            ) : isFollowing ? (
                "Unfollow"
            ) : (
                "Follow"
            )}
        </Button>
    );
}

export default FollowButton;