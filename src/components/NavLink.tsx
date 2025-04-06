import { currentUser } from "@clerk/nextjs/server";
import { UserIcon } from "lucide-react";
import Link from "next/link";

async function NavLink() {
    const user = await currentUser();
    console.log(user);

    return (
        <Link
        href={`/profile/${
            user.username ?? user.emailAddresses[0].emailAddress.split("@")[0]
        }`}
        >
            <UserIcon className="w-4 h-4" />
            Profile
        </Link>
    );
}

export default NavLink;
