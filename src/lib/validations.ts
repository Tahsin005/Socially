import { z } from "zod";

export const createPostSchema = z
  .object({
    content: z.string().max(1000, "Content cannot exceed 1000 characters").default(""),
    image: z.string().default(""),
  })
  .refine((data) => data.content.trim().length > 0 || data.image.trim().length > 0, {
    message: "Post must have either text content or an image",
  });

export const createCommentSchema = z.object({
  postId: z.string().min(1, "Post ID is required"),
  content: z
    .string()
    .trim()
    .min(1, "Comment cannot be empty")
    .max(500, "Comment cannot exceed 500 characters"),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(50, "Name cannot exceed 50 characters"),
  bio: z.string().max(250, "Bio cannot exceed 250 characters").default(""),
  location: z.string().max(100, "Location cannot exceed 100 characters").default(""),
  website: z
    .string()
    .trim()
    .max(100, "Website URL cannot exceed 100 characters")
    .default("")
    .refine(
      (val) => {
        if (!val) return true;
        try {
          const url = new URL(val.startsWith("http") ? val : `https://${val}`);
          return url.protocol === "http:" || url.protocol === "https:";
        } catch {
          return false;
        }
      },
      { message: "Please enter a valid website URL" }
    ),
});

export const reactionTypeSchema = z.enum(["LIKE", "FIRE", "CLAP", "IDEA", "LAUGH"]);
export type ReactionType = z.infer<typeof reactionTypeSchema>;

