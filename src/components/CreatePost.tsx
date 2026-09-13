'use client';

import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { BarChart2Icon, ImageIcon, Loader2Icon, PlusIcon, SendIcon, XIcon } from "lucide-react";
import { createPost } from "@/actions/post.action";
import toast from "react-hot-toast";
import ImageUpload from "./ImageUpload";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { CreatePollInput } from "@/lib/validations";

function CreatePost() {
    const { user } = useUser();
    const queryClient = useQueryClient();
    const [content, setContent] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [showImageUpload, setShowImageUpload] = useState(false);

    // Poll state
    const [showPoll, setShowPoll] = useState(false);
    const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
    const [pollDuration, setPollDuration] = useState<number>(24);

    const handleAddPollOption = () => {
        if (pollOptions.length < 4) {
            setPollOptions([...pollOptions, ""]);
        }
    };

    const handleRemovePollOption = (index: number) => {
        if (pollOptions.length > 2) {
            setPollOptions(pollOptions.filter((_, i) => i !== index));
        }
    };

    const handlePollOptionChange = (index: number, value: string) => {
        const updated = [...pollOptions];
        updated[index] = value;
        setPollOptions(updated);
    };

    const postMutation = useMutation({
        mutationFn: (pollData?: CreatePollInput) => createPost(content, imageUrl, pollData),
        onSuccess: (result) => {
            if (result?.success && result.post) {
                setContent("");
                setImageUrl("");
                setShowImageUpload(false);
                setShowPoll(false);
                setPollOptions(["", ""]);
                setPollDuration(24);
                toast.success("Post created successfully");

                // Invalidate all feeds to pull fresh data
                queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
            } else {
                toast.error(result?.error || "Failed to create post");
            }
        },
        onError: (error) => {
            console.error("Failed to create post:", error);
            toast.error("Failed to create post");
        },
    });

    const handleSubmit = () => {
        if (postMutation.isPending) return;

        let pollData: CreatePollInput | undefined = undefined;

        if (showPoll) {
            const validOptions = pollOptions.map((o) => o.trim()).filter((o) => o.length > 0);
            if (validOptions.length < 2) {
                toast.error("Please provide at least 2 options for the poll");
                return;
            }
            pollData = {
                options: validOptions,
                durationHours: pollDuration,
            };
        }

        const hasContent = content.trim().length > 0;
        const hasImage = imageUrl.trim().length > 0;
        const hasPoll = Boolean(pollData);

        if (!hasContent && !hasImage && !hasPoll) {
            toast.error("Post must have text content, an image, or a poll");
            return;
        }

        postMutation.mutate(pollData);
    };

    const validPollOptionsCount = pollOptions.filter((o) => o.trim().length > 0).length;
    const isSubmitDisabled =
        postMutation.isPending ||
        (!content.trim() && !imageUrl && (!showPoll || validPollOptionsCount < 2));

    return (
        <Card className="mb-6">
            <CardContent className="pt-6">
                <div className="space-y-4">
                    <div className="flex space-x-4">
                        <Avatar className="w-10 h-10">
                            <AvatarImage src={user?.imageUrl || "/avatar.png"} />
                        </Avatar>
                        <Textarea
                            placeholder="What's on your mind?"
                            className="min-h-[100px] resize-none border-none focus-visible:ring-0 p-0 text-base"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            disabled={postMutation.isPending}
                        />
                    </div>

                    {(showImageUpload || imageUrl) && (
                        <div className="border rounded-lg p-4">
                            <ImageUpload
                                endpoint="postImage"
                                value={imageUrl}
                                onChange={(url) => {
                                    setImageUrl(url);
                                    if (!url) setShowImageUpload(false);
                                }}
                            />
                        </div>
                    )}

                    {showPoll && (
                        <div className="border rounded-xl p-4 bg-muted/30 space-y-3 transition-all animate-in fade-in-50 duration-200">
                            <div className="flex items-center justify-between border-b border-border/40 pb-2">
                                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                                    <BarChart2Icon className="size-3.5 text-primary" />
                                    Create a poll
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                    onClick={() => setShowPoll(false)}
                                >
                                    <XIcon className="size-3.5" />
                                </Button>
                            </div>

                            <div className="space-y-2">
                                {pollOptions.map((opt, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <Input
                                            type="text"
                                            placeholder={`Option ${index + 1}${index < 2 ? " (required)" : " (optional)"}`}
                                            maxLength={80}
                                            value={opt}
                                            onChange={(e) => handlePollOptionChange(index, e.target.value)}
                                            disabled={postMutation.isPending}
                                            className="h-9 text-sm bg-background"
                                        />
                                        {pollOptions.length > 2 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                                                onClick={() => handleRemovePollOption(index)}
                                                disabled={postMutation.isPending}
                                            >
                                                <XIcon className="size-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/40 text-xs">
                                {pollOptions.length < 4 ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleAddPollOption}
                                        disabled={postMutation.isPending}
                                        className="h-8 text-xs font-medium"
                                    >
                                        <PlusIcon className="size-3.5 mr-1" />
                                        Add option
                                    </Button>
                                ) : (
                                    <span className="text-muted-foreground">Maximum 4 options</span>
                                )}

                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground font-medium">Duration:</span>
                                    <select
                                        value={pollDuration}
                                        onChange={(e) => setPollDuration(Number(e.target.value))}
                                        disabled={postMutation.isPending}
                                        className="h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                                    >
                                        <option value={6}>6 hours</option>
                                        <option value={12}>12 hours</option>
                                        <option value={24}>1 day (24h)</option>
                                        <option value={72}>3 days</option>
                                        <option value={168}>7 days</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between border-t pt-4">
                        <div className="flex space-x-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className={`text-muted-foreground hover:text-primary ${showImageUpload ? "text-primary bg-primary/10" : ""}`}
                                onClick={() => setShowImageUpload(!showImageUpload)}
                                disabled={postMutation.isPending}
                            >
                                <ImageIcon className="size-4 mr-2" />
                                Photo
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className={`text-muted-foreground hover:text-primary ${showPoll ? "text-primary bg-primary/10" : ""}`}
                                onClick={() => setShowPoll(!showPoll)}
                                disabled={postMutation.isPending}
                            >
                                <BarChart2Icon className="size-4 mr-2" />
                                Poll
                            </Button>
                        </div>
                        <Button
                            className="flex items-center"
                            onClick={handleSubmit}
                            disabled={isSubmitDisabled}
                        >
                            {postMutation.isPending ? (
                                <>
                                    <Loader2Icon className="size-4 mr-2 animate-spin" />
                                    Posting...
                                </>
                            ) : (
                                <>
                                    <SendIcon className="size-4 mr-2" />
                                    Post
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default CreatePost;