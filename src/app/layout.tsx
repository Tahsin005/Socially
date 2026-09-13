import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/ThemeProvider";
import QueryProvider from "@/components/providers/QueryProvider";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { Toaster } from 'react-hot-toast'
import NextTopLoader from "nextjs-toploader";
import GlobalLoaderProvider from "@/components/providers/GlobalLoaderProvider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Socially",
  description: "Made with ❤️ by Tahsin",
  icons: {
    icon: '/logo.ico'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <NextTopLoader
            color="#3b82f6"
            initialPosition={0.08}
            crawlSpeed={200}
            height={3}
            crawl={true}
            showSpinner={false}
            easing="ease"
            speed={200}
            shadow="0 0 10px #3b82f6,0 0 5px #3b82f6"
          />
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>
              <GlobalLoaderProvider>
                <div className="min-h-screen">
                  <Navbar></Navbar>
                  <main className="py-8">
                    <div className="max-w-7xl mx-auto px-4">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="hidden lg:block col-span-3">
                          <Sidebar></Sidebar>
                        </div>
                        <div className="lg:col-span-9">
                          {children}
                        </div>
                      </div>
                    </div>
                  </main>
                </div>
                <Toaster />
              </GlobalLoaderProvider>
            </QueryProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
