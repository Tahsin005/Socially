import { BellIcon, UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SignInButton, UserButton } from "@clerk/nextjs";
import ModeToggle from "./ModeToggle";
import { currentUser } from "@clerk/nextjs/server";
import MessagesNavButton from "./MessagesNavButton";

interface DesktopNavbarProps {
    unreadCount?: number;
    unreadMessagesCount?: number;
}

async function DesktopNavbar({ unreadCount = 0, unreadMessagesCount = 0 }: DesktopNavbarProps) {
    const user = await currentUser();

    return (
        <div className="hidden md:flex items-center space-x-4">
            <ModeToggle />

            {user ? (
                <>
                    <MessagesNavButton initialCount={unreadMessagesCount} />

                    <Button variant="ghost" className="flex items-center gap-2" asChild>
                        <Link href="/notifications">
                            <div className="relative flex items-center">
                                <BellIcon className="w-4 h-4" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                                        {unreadCount > 99 ? "99+" : unreadCount}
                                    </span>
                                )}
                            </div>
                            <span className="hidden lg:inline">Notifications</span>
                        </Link>
                    </Button>
                    <Button variant="ghost" className="flex items-center gap-2" asChild>
                        <Link
                            href={`/profile/${
                                user.username ?? user.emailAddresses[0].emailAddress.split("@")[0]
                            }`}
                        >
                            <UserIcon className="w-4 h-4" />
                            <span className="hidden lg:inline">Profile</span>
                        </Link>
                    </Button>
                    <UserButton />
                </>
            ) : (
                <SignInButton mode="modal">
                    <Button variant="default">Sign In</Button>
                </SignInButton>
            )}
        </div>
    );
}
export default DesktopNavbar;
