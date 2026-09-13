import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HomeIcon } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] grid place-items-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            <p className="text-8xl font-bold text-primary font-mono">404</p>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">Post not found</h1>
              <p className="text-muted-foreground">
                The post you&apos;re looking for doesn&apos;t exist or has been deleted.
              </p>
            </div>

            <div className="flex justify-center">
              <Button variant="default" asChild>
                <Link href="/">
                  <HomeIcon className="mr-2 size-4" />
                  Back to Feed
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
