'use client';

import { getProfileByUsername, getUserPosts, updateProfile } from "@/actions/profile.action";
import { toggleFollow } from "@/actions/user.action";
import PostCard from "@/components/PostCard";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { SignInButton, useUser } from "@clerk/nextjs";
import { format } from "date-fns";
import {
    BookmarkIcon,
    CalendarIcon,
    EditIcon,
    FileTextIcon,
    HeartIcon,
    LinkIcon,
    MapPinIcon,
    MessageSquareIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import FollowersDialog from "@/components/FollowersDialog";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

type User = Awaited<ReturnType<typeof getProfileByUsername>>;
type Posts = Awaited<ReturnType<typeof getUserPosts>>;

interface ProfilePageClientProps {
    user: NonNullable<User>;
    dbUserId: string;
    posts: Posts;
    likedPosts: Posts;
    bookmarkedPosts?: Posts;
    isFollowing: boolean;
}

function ProfilePageClient({
    isFollowing: initialIsFollowing,
    dbUserId,
    likedPosts,
    posts,
    bookmarkedPosts = [],
    user,
}: ProfilePageClientProps) {
    const { user: currentUser } = useUser();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showFollowersModal, setShowFollowersModal] = useState(false);
    const [followersModalTab, setFollowersModalTab] = useState<"followers" | "following">("followers");
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [followersCount, setFollowersCount] = useState(user._count.followers);
    const [prevFollowersCount, setPrevFollowersCount] = useState(user._count.followers);
    const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);

    if (user._count.followers !== prevFollowersCount) {
        setPrevFollowersCount(user._count.followers);
        setFollowersCount(user._count.followers);
    }

    const [editForm, setEditForm] = useState({
        name: user.name || "",
        bio: user.bio || "",
        location: user.location || "",
        website: user.website || "",
    });

    const handleEditSubmit = async () => {
        const formData = new FormData();
        Object.entries(editForm).forEach(([key, value]) => {
            formData.append(key, value);
        });

        const result = await updateProfile(formData);
        if (result.success) {
            setShowEditDialog(false);
            toast.success("Profile updated successfully");
            queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
            router.refresh();
        } else {
            toast.error(result.error || "Failed to update profile");
        }
    };

    const handleFollow = async () => {
        if (!currentUser) return;

        try {
            setIsUpdatingFollow(true);
            const res = await toggleFollow(user.id);
            if (res?.success) {
                const nextState = typeof res.isFollowing === "boolean" ? res.isFollowing : !isFollowing;
                setIsFollowing(nextState);
                setFollowersCount((prev) => prev + (nextState ? 1 : -1));
                toast.success(nextState ? "User followed successfully" : "User unfollowed successfully");

                queryClient.invalidateQueries({ queryKey: queryKeys.posts.following() });
                queryClient.invalidateQueries({ queryKey: queryKeys.users.whoToFollow() });
                queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
                router.refresh();
            } else {
                toast.error(res?.error || "Failed to update follow status");
            }
        } catch (error) {
            toast.error("Failed to update follow status");
        } finally {
            setIsUpdatingFollow(false);
        }
    };

    const isOwnProfile =
        currentUser?.username === user.username ||
        currentUser?.primaryEmailAddress?.emailAddress?.split("@")[0] === user.username ||
        currentUser?.emailAddresses?.[0]?.emailAddress?.split("@")[0] === user.username;

    const formattedDate = format(new Date(user.createdAt), "MMMM yyyy");

    return (
        <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-1 gap-6">
                <div className="w-full max-w-lg mx-auto">
                    <Card className="bg-card">
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center">
                                <Avatar className="w-24 h-24">
                                    <AvatarImage src={user.image ?? "/avatar.png"} />
                                </Avatar>
                                <h1 className="mt-4 text-2xl font-bold">{user.name ?? user.username}</h1>
                                <p className="text-muted-foreground">@{user.username}</p>
                                <p className="mt-2 text-sm">{user.bio}</p>

                                <div className="w-full mt-6">
                                    <div className="flex justify-between mb-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFollowersModalTab("following");
                                                setShowFollowersModal(true);
                                            }}
                                            className="text-center group transition-colors hover:opacity-80 cursor-pointer"
                                        >
                                            <div className="font-semibold group-hover:text-primary transition-colors">{user._count.following.toLocaleString()}</div>
                                            <div className="text-sm text-muted-foreground">Following</div>
                                        </button>
                                        <Separator orientation="vertical" />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFollowersModalTab("followers");
                                                setShowFollowersModal(true);
                                            }}
                                            className="text-center group transition-colors hover:opacity-80 cursor-pointer"
                                        >
                                            <div className="font-semibold group-hover:text-primary transition-colors">{followersCount.toLocaleString()}</div>
                                            <div className="text-sm text-muted-foreground">Followers</div>
                                        </button>
                                        <Separator orientation="vertical" />
                                        <div className="text-center">
                                            <div className="font-semibold">{user._count.posts.toLocaleString()}</div>
                                            <div className="text-sm text-muted-foreground">Posts</div>
                                        </div>
                                    </div>
                                </div>

                                {!currentUser ? (
                                    <SignInButton mode="modal">
                                        <Button className="w-full mt-4">Follow</Button>
                                    </SignInButton>
                                    ) : isOwnProfile ? (
                                    <Button className="w-full mt-4" onClick={() => setShowEditDialog(true)}>
                                        <EditIcon className="size-4 mr-2" />
                                        Edit Profile
                                    </Button>
                                ) : (
                                    <div className="flex gap-2 w-full mt-4">
                                        <Button
                                            className="flex-1"
                                            onClick={handleFollow}
                                            disabled={isUpdatingFollow}
                                            variant={isFollowing ? "outline" : "default"}
                                        >
                                            {isFollowing ? "Unfollow" : "Follow"}
                                        </Button>
                                        <Button variant="outline" asChild>
                                            <Link href={`/messages?userId=${user.id}`}>
                                                <MessageSquareIcon className="size-4 mr-1.5" />
                                                Message
                                            </Link>
                                        </Button>
                                    </div>
                                )}

                                <div className="w-full mt-6 space-y-2 text-sm">
                                    {user.location && (
                                        <div className="flex items-center text-muted-foreground">
                                            <MapPinIcon className="size-4 mr-2" />
                                        {user.location}
                                        </div>
                                    )}
                                    {user.website && (
                                        <div className="flex items-center text-muted-foreground">
                                            <LinkIcon className="size-4 mr-2" />
                                            <a
                                                href={
                                                user.website.startsWith("http") ? user.website : `https://${user.website}`
                                                }
                                                className="hover:underline"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {user.website}
                                            </a>
                                        </div>
                                    )}
                                    <div className="flex items-center text-muted-foreground">
                                        <CalendarIcon className="size-4 mr-2" />
                                        Joined {formattedDate}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="posts" className="w-full">
                    <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                        <TabsTrigger
                            value="posts"
                            className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary
                            data-[state=active]:bg-transparent px-6 font-semibold"
                        >
                            <FileTextIcon className="size-4" />
                            Posts
                        </TabsTrigger>
                        <TabsTrigger
                            value="likes"
                            className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary
                            data-[state=active]:bg-transparent px-6 font-semibold"
                        >
                            <HeartIcon className="size-4" />
                            Likes
                        </TabsTrigger>
                        {isOwnProfile && (
                            <TabsTrigger
                                value="bookmarks"
                                className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary
                                data-[state=active]:bg-transparent px-6 font-semibold"
                            >
                                <BookmarkIcon className="size-4" />
                                Saved
                            </TabsTrigger>
                        )}
                    </TabsList>

                    <TabsContent value="posts" className="mt-6">
                        <div className="space-y-6">
                            {posts.length > 0 ? (
                                posts.map((post) => <PostCard key={post.id} post={post} dbUserId={dbUserId} />)
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">No posts yet</div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="likes" className="mt-6">
                        <div className="space-y-6">
                            {likedPosts.length > 0 ? (
                                likedPosts.map((post) => <PostCard key={post.id} post={post} dbUserId={dbUserId} />)
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">No liked posts to show</div>
                            )}
                        </div>
                    </TabsContent>

                    {isOwnProfile && (
                        <TabsContent value="bookmarks" className="mt-6">
                            <div className="space-y-6">
                                {bookmarkedPosts.length > 0 ? (
                                    bookmarkedPosts.map((post) => (
                                        <PostCard key={post.id} post={post} dbUserId={dbUserId} />
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No saved posts yet
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    )}
                </Tabs>

                <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Edit Profile</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input
                                    name="name"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    placeholder="Your name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Bio</Label>
                                <Textarea
                                    name="bio"
                                    value={editForm.bio}
                                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                    className="min-h-[100px]"
                                    placeholder="Tell us about yourself"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Location</Label>
                                <Input
                                    name="location"
                                    value={editForm.location}
                                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                    placeholder="Where are you based?"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Website</Label>
                                <Input
                                    name="website"
                                    value={editForm.website}
                                    onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                                    placeholder="Your personal website"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button onClick={handleEditSubmit}>Save Changes</Button>
                        </div>
                    </DialogContent>
                </Dialog>

                <FollowersDialog
                    userId={user.id}
                    initialTab={followersModalTab}
                    open={showFollowersModal}
                    onOpenChange={setShowFollowersModal}
                    currentUserId={dbUserId || null}
                />
            </div>
        </div>
    );
}
export default ProfilePageClient;
