import Link from 'next/link'
import React from 'react'
import DesktopNavbar from './DesktopNavbar'
import MobileNavbar from './MobileNavbar'
import SearchBar from './SearchBar'
import { currentUser } from '@clerk/nextjs/server'
import { syncUser } from '@/actions/user.action'

import { getUnreadNotificationCount } from '@/actions/notification.action'

async function Navbar() {
    const user = await currentUser();
    if (user) await syncUser();
    const unreadCount = user ? await getUnreadNotificationCount() : 0;

    return (
        <nav className="sticky top-0 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between h-16 gap-4">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="text-xl font-bold text-primary font-mono tracking-wider shrink-0">
                            Socially
                        </Link>
                    </div>

                    <div className="hidden md:flex flex-1 max-w-md mx-2">
                        <SearchBar />
                    </div>

                    <div className="flex items-center gap-2">
                        <DesktopNavbar unreadCount={unreadCount} />
                        <MobileNavbar unreadCount={unreadCount} />
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default Navbar