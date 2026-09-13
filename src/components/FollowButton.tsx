'use client';

import { useState } from "react";
import { Button } from "./ui/button";
import toast from "react-hot-toast";
import { Loader2Icon } from "lucide-react";
import { toggleFollow } from "@/actions/user.action";

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
    const [isLoading, setIsLoading] = useState(false);
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [prevInitialIsFollowing, setPrevInitialIsFollowing] = useState(initialIsFollowing);

    if (initialIsFollowing !== prevInitialIsFollowing) {
        setPrevInitialIsFollowing(initialIsFollowing);
        setIsFollowing(initialIsFollowing);
    }

    const handleFollow = async () => {
        if (isLoading) return;
        setIsLoading(true);

        const previousState = isFollowing;
        const optimisticState = !previousState;
        setIsFollowing(optimisticState);

        try {
            const res = await toggleFollow(userId);
            if (res?.success) {
                const confirmedState = typeof res.isFollowing === "boolean" ? res.isFollowing : optimisticState;
                setIsFollowing(confirmedState);
                onFollowToggle?.(confirmedState);
                toast.success(confirmedState ? "User followed successfully" : "User unfollowed successfully");
            } else {
                setIsFollowing(previousState);
                toast.error(res?.error || "Failed to update follow status");
            }
        } catch {
            setIsFollowing(previousState);
            toast.error("Error updating follow status");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            size="sm"
            variant={isFollowing ? "outline" : "secondary"}
            className={className}
            onClick={handleFollow}
            disabled={isLoading}
        >
            {isLoading ? (
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