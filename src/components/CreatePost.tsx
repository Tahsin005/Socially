'use client';

import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { ImageIcon, Loader2Icon, SendIcon } from "lucide-react";
import { createPost } from "@/actions/post.action";
import toast from "react-hot-toast";
import ImageUpload from "./ImageUpload";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

function CreatePost() {
    const { user } = useUser();
    const queryClient = useQueryClient();
    const [content, setContent] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [showImageUpload, setShowImageUpload] = useState(false);

    const postMutation = useMutation({
        mutationFn: () => createPost(content, imageUrl),
        onSuccess: (result) => {
            if (result?.success && result.post) {
                setContent("");
                setImageUrl("");
                setShowImageUpload(false);
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
        if ((!content.trim() && !imageUrl) || postMutation.isPending) return;
        postMutation.mutate();
    };

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
                    <div className="flex items-center justify-between border-t pt-4">
                        <div className="flex space-x-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-primary"
                                onClick={() => setShowImageUpload(!showImageUpload)}
                                disabled={postMutation.isPending}
                            >
                                <ImageIcon className="size-4 mr-2" />
                                Photo
                            </Button>
                        </div>
                        <Button
                            className="flex items-center"
                            onClick={handleSubmit}
                            disabled={(!content.trim() && !imageUrl) || postMutation.isPending}
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