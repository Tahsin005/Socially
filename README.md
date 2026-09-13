# ✨ Socially

[![Next.js](https://img.shields.io/badge/Next.js-16.3.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19.3-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Clerk](https://img.shields.io/badge/Clerk-Authentication-6C47FF?style=for-the-badge&logo=clerk)](https://clerk.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.19-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![TanStack Query](https://img.shields.io/badge/TanStack_Query-5.102-FF4154?style=for-the-badge&logo=react-query)](https://tanstack.com/query)

A feature-packed, production-ready modern social media platform and real-time messaging web application. Built with the **Next.js 16 App Router**, **React 19**, **PostgreSQL**, **Prisma**, **Clerk Authentication**, and **TanStack Query**.

🌐 **Live Demo**: [sociallyweb.vercel.app](https://sociallyweb.vercel.app/)

---

## 📑 Table of Contents

- [Features](#-features)
  - [1. Direct Messaging (DMs)](#1-direct-messaging-dms)
  - [2. Dual Infinite Feeds](#2-dual-infinite-feeds)
  - [3. Rich Post Creation & Media Uploads](#3-rich-post-creation--media-uploads)
  - [4. Interactive Polls](#4-interactive-polls)
  - [5. 5-Type Reaction Engine](#5-5-type-reaction-engine)
  - [6. Comments & Moderation](#6-comments--moderation)
  - [7. @Mention Engine](#7-mention-engine)
  - [8. Global Search & Shortcuts](#8-global-search--shortcuts)
  - [9. User Profiles & Social Graph](#9-user-profiles--social-graph)
  - [10. Bookmarks / Saved Posts](#10-bookmarks--saved-posts)
  - [11. Notification Center](#11-notification-center)
  - [12. Theming & Polished UX](#12-theming--polished-ux)
- [Tech Stack](#-tech-stack)
- [Project Architecture](#-project-architecture)
- [Database Schema (Prisma)](#-database-schema-prisma)
- [Environment Variables](#-environment-variables)
- [Getting Started](#-getting-started)
- [Available Scripts](#-available-scripts)
- [Security & Validation](#-security--validation)

---

## 🧩 Features

### 1. Direct Messaging (DMs)
- **1-on-1 Conversations**: Canonical pairs created between users with automatic sorting.
- **Smart Background Polling**: 3-second active thread polling and 6-second conversation list polling via TanStack Query.
- **Read Receipts & Unread Counters**: Message status indicators (sent vs. read checkmarks) and real-time unread badges in navigation bars.
- **Instant Chat Start**: Start conversations directly from a user's profile or via the **New Chat** dialog with live user search.
- **Responsive Split View**: Full-featured chat interface optimized with back navigation on mobile devices.

### 2. Dual Infinite Feeds
- **"For You" Tab**: Discover global posts ordered chronologically.
- **"Following" Tab**: Curated timeline showing only posts from creators you follow.
- **Infinite Scrolling**: Cursor-based pagination powered by TanStack Query (`useInfiniteQuery`) and native `IntersectionObserver`.
- **Zero-Flicker SSR Hydration**: Initial page loads are server-rendered with instant hydration on the client.

### 3. Rich Post Creation & Media Uploads
- **Multi-Format Posts**: Create posts with text, images, or interactive polls.
- **Image Uploads via UploadThing**: Secure client-side uploads supporting files up to 4MB with pre-signed server authorization.
- **Optimistic Mutation Updates**: New posts instantly reflect in feed state with cache invalidation.

### 4. Interactive Polls
- **Custom Poll Builder**: Add 2 to 4 options with configurable durations (1h, 6h, 12h, 24h, 3 days, 7 days).
- **Live Voting & Results**: Dynamic percentage bars, total vote tally, leading option indicators, and expiration countdowns.
- **Vote Integrity**: Guaranteed single vote per user per poll enforced at both the database level (`@@unique([userId, pollId])`) and server validation layer.

### 5. 5-Type Reaction Engine
- **Expressive Reactions**: Choose from 5 distinct reactions:
  - ❤️ **Love** (`LIKE`)
  - 🔥 **Fire** (`FIRE`)
  - 👏 **Clap** (`CLAP`)
  - 💡 **Idea** (`IDEA`)
  - 😂 **Haha** (`LAUGH`)
- **Hover & Long-Press Trigger**: Smooth hover menu on desktop and touch long-press on mobile.
- **Reaction Summary Badges**: Displays top 3 reaction emojis and total count on cards.
- **Reactions Dialog**: Modal showing the full list of who reacted, categorized by reaction type, with one-click follow buttons.

### 6. Comments & Moderation
- **Inline Comment Threads**: Expandable comments section on each post card.
- **Dual-Permission Deletion**: Comments can be deleted by either the comment author or the post owner.
- **Mention Support**: Supports `@username` tagging directly inside comment text.

### 7. @Mention Engine
- **Regex Detection**: Parses `@username` tokens within posts and comments without interfering with email addresses.
- **Profile Linking**: Auto-converts mentions into clickable links pointing to user profiles.
- **Mention Notifications**: Automatically creates dedicated `MENTION` notifications for referenced users.

### 8. Global Search & Shortcuts
- **Global Shortcut**: Press <kbd>Cmd</kbd> + <kbd>K</kbd> or <kbd>Ctrl</kbd> + <kbd>K</kbd> anywhere to open search.
- **Debounced Live Dropdown**: Instant preview of matched users and posts as you type.
- **Dedicated Search Page (`/search?q=...`)**: Full search results with tabbed filtering for **All**, **People**, and **Posts**.

### 9. User Profiles & Social Graph
- **Dynamic Profiles (`/profile/[username]`)**: Displays avatar, bio, location, website link, and joined date.
- **Social Graph Counts**: Live counters for Followers, Following, and Posts.
- **Followers & Following Modals**: Clickable stat counters opening dedicated tabs with follow/unfollow controls.
- **Tabbed Content**: View user's **Posts**, **Liked Posts**, and private **Bookmarks** (owner-only).
- **Edit Profile**: Modal dialog to update name, bio, location, and website with URL validation.

### 10. Bookmarks / Saved Posts
- **Save for Later**: One-click bookmark toggle on any post.
- **Private Bookmarks Feed**: Accessible exclusively to the account owner on their profile page.

### 11. Notification Center
- **Centralized Hub (`/notifications`)**: Real-time alerts for:
  - 👤 **Follows**: When someone follows you.
  - ❤️ **Reactions / Likes**: When someone reacts to your post.
  - 💬 **Comments**: When someone comments on your post.
  - 🏷️ **Mentions**: When someone tags you in a post or comment.
- **Auto-Read Sync**: Automatically marks visible notifications as read upon visit.
- **Navigation Badge**: Displays real-time unread count (e.g. `3 new` or `99+`).

### 12. Theming & Polished UX
- **Theme Switcher**: Dark, Light, and System mode support with persistent preference using `next-themes`.
- **Top Progress Bar**: Smooth page-loading indicators powered by `nextjs-toploader`.
- **Full-Screen Route Transition Loader**: Custom animated branding overlay for route navigation.
- **Toast Notifications**: Responsive, rich feedback messages using `react-hot-toast`.
- **Share API**: Native Web Share API integration with automatic fallback to clipboard copy.

---

## 🚀 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | [Next.js 16.3.5](https://nextjs.org/) (App Router, Server Actions, React Server Components) |
| **Frontend Core** | [React 19.3.0](https://react.dev/), [TypeScript 5](https://www.typescriptlang.org/) |
| **Styling & Theming** | [Tailwind CSS 3.4](https://tailwindcss.com/), [next-themes](https://github.com/pacocoursey/next-themes), `tailwindcss-animate` |
| **UI Components** | [Radix UI Primitives](https://www.radix-ui.com/) (Dialog, Tabs, Avatar, ScrollArea, Separator, AlertDialog) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **State & Caching** | [TanStack React Query v5](https://tanstack.com/query) (Infinite Queries, Polling, Invalidation) |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org/), [Prisma ORM 6.19](https://www.prisma.io/) |
| **Authentication** | [Clerk](https://clerk.com/) (`@clerk/nextjs` v7) |
| **Media Storage** | [UploadThing 7](https://uploadthing.com/) |
| **Validation** | [Zod 4](https://zod.dev/) |
| **Date Formatting** | [date-fns 4](https://date-fns.org/) |

---

## 📁 Project Architecture

```
Socially/
├── prisma/
│   └── schema.prisma           # Prisma data models, enums & relational indexes
├── public/
│   ├── avatar.png              # Default fallback avatar
│   └── logo.ico                # Application favicon
├── src/
│   ├── actions/                # Next.js Server Actions ('use server')
│   │   ├── message.action.ts       # DM conversations, message sending, read status
│   │   ├── notification.action.ts  # Notification retrieval & read status
│   │   ├── post.action.ts          # Posts, comments, reactions, bookmarks, polls
│   │   ├── profile.action.ts       # Profile querying, post tabs, updates
│   │   ├── search.action.ts        # Global search queries (users & posts)
│   │   └── user.action.ts          # Clerk user synchronization, follows, stats
│   ├── app/                    # Next.js App Router routes & layouts
│   │   ├── api/uploadthing/        # UploadThing file router & webhook route
│   │   ├── messages/               # Direct messaging page & client view
│   │   ├── notifications/          # Activity notifications list
│   │   ├── post/[id]/              # Individual post view with comments
│   │   ├── profile/[username]/     # Dynamic user profile page & tabs
│   │   ├── search/                 # Dedicated search results page
│   │   ├── globals.css             # Tailwind base & theme CSS variables
│   │   ├── layout.tsx              # Root layout with providers, navbar & sidebar
│   │   └── page.tsx                # Main homepage feed with Suspense
│   ├── components/             # Reusable UI & feature components
│   │   ├── providers/              # React Query, Theme & Global Loader providers
│   │   ├── ui/                     # Radix UI primitives & custom base elements
│   │   ├── ConversationList.tsx    # DM conversations sidebar with search
│   │   ├── CreatePost.tsx          # Post creator with image upload & poll builder
│   │   ├── FeedTabs.tsx            # Dual feeds (For You / Following) with infinite scroll
│   │   ├── FollowersDialog.tsx     # Followers/Following list modal
│   │   ├── GlobalFullScreenLoader.tsx # Route transition loader animation
│   │   ├── MessageThread.tsx       # Real-time chat thread with read receipts
│   │   ├── PollView.tsx            # Interactive poll card with live percentages
│   │   ├── PostCard.tsx            # Core post component (reactions, comments, share)
│   │   ├── ReactionPicker.tsx      # 5-emotion hover/long-press reaction menu
│   │   ├── ReactionsDialog.tsx     # Breakdown modal of users who reacted
│   │   ├── SearchBar.tsx           # Cmd+K live debounced search bar
│   │   ├── Sidebar.tsx             # Sticky left sidebar with user profile card
│   │   └── WhoToFollow.tsx         # Suggested users discovery widget
│   ├── lib/                    # Shared utilities & configurations
│   │   ├── mention.ts              # Regex parser for @username mentions
│   │   ├── postInclude.ts          # Prisma reusable relations include object
│   │   ├── prisma.ts               # Global Prisma client singleton instance
│   │   ├── queryKeys.ts            # Type-safe TanStack Query key factory
│   │   ├── uploadthing.ts          # UploadThing helpers & components
│   │   └── validations.ts          # Zod schemas for posts, comments, polls, etc.
│   └── proxy.ts                # Clerk authentication middleware configuration
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🗄️ Database Schema (Prisma)

The application utilizes PostgreSQL via Prisma ORM with the following models:

```mermaid
erDiagram
    User ||--o{ Post : "authors"
    User ||--o{ Comment : "writes"
    User ||--o{ Like : "reacts"
    User ||--o{ Bookmark : "saves"
    User ||--o{ Follows : "followers / following"
    User ||--o{ Notification : "receives / creates"
    User ||--o{ PollVote : "votes"
    User ||--o{ Conversation : "participates"
    User ||--o{ Message : "sends"

    Post ||--o{ Comment : "has"
    Post ||--o{ Like : "receives"
    Post ||--o{ Bookmark : "saved_in"
    Post ||--o| Poll : "contains"

    Poll ||--o{ PollOption : "has"
    Poll ||--o{ PollVote : "receives"

    Conversation ||--o{ Message : "contains"
```

### Models Summary:
- **`User`**: Core user record synced with Clerk (`clerkId`, `username`, `email`, `name`, `bio`, `image`, `location`, `website`).
- **`Post`**: Content, optional image URL, author relationship, cascade deletions.
- **`Comment`**: Post comments with author relation and indexed lookup.
- **`Like`**: Stores user post reactions with the `ReactionType` enum (`LIKE`, `FIRE`, `CLAP`, `IDEA`, `LAUGH`).
- **`Follows`**: Join table managing follower/following relationships.
- **`Notification`**: Activity records for `LIKE`, `COMMENT`, `FOLLOW`, and `MENTION` with read states.
- **`Bookmark`**: Tracks saved posts per user with compound unique constraint (`userId`, `postId`).
- **`Poll` & `PollOption` & `PollVote`**: Manages interactive polls with expiration timestamps and one-vote-per-user integrity.
- **`Conversation` & `Message`**: Direct messaging system with canonical participant pairs and read receipt tracking (`isRead`).

---

## 🔑 Environment Variables

Create a `.env` or `.env.local` file in the root of the project with the following keys:

```bash
# Database (PostgreSQL)
DATABASE_URL="postgresql://username:password@localhost:5432/socially?schema=public"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Clerk URL Redirects (Optional)
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/"

# UploadThing (Media Storage)
UPLOADTHING_TOKEN="your_uploadthing_token_here"
```

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js**: v18.18 or higher (v20+ recommended)
- **Package Manager**: `npm`, `pnpm`, or `yarn`
- **PostgreSQL**: Local instance or managed provider (e.g. Neon, Supabase, Railway)
- **Clerk Account**: For user authentication
- **UploadThing Account**: For image uploads

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Tahsin005/Socially.git
   cd Socially
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env.local
   # Fill in your DATABASE_URL, Clerk keys, and UploadThing token
   ```

4. **Initialize the database**:
   ```bash
   # Generate Prisma client
   npx prisma generate

   # Push schema to database
   npx prisma db push
   ```

5. **Run the development server**:
   ```bash
   npm run dev
   ```

6. **Open in browser**:
   Navigate to [http://localhost:3000](http://localhost:3000).

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server with webpack support |
| `npm run build` | Compiles the production build |
| `npm run start` | Runs the compiled production server |
| `npm run lint` | Runs ESLint to check for code quality and syntax issues |
| `npx prisma studio` | Opens the Prisma visual database editor in your browser |
| `npx prisma db push` | Pushes the Prisma schema state directly to your database |

---

## 🛡️ Security & Validation

- **Server-Side Authorization**: Every Server Action validates the caller's session using Clerk's `auth()` helper, preventing unauthorized mutations.
- **Strict Input Validation**: All user inputs (posts, comments, polls, messages, and profile data) are sanitized and validated with **Zod** schemas before reaching the database.
- **Database Consistency**: Relational mutations (such as follows + notifications, reactions + notifications, or conversations) are executed inside atomic Prisma transactions (`prisma.$transaction`).
- **Access Control**: Users can only edit their own profile, delete their own posts, or remove comments on their own posts.

---

Made with ❤️ by [Tahsin](https://github.com/Tahsin005)
