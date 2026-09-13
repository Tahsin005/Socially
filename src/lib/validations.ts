import { z } from "zod";

export const pollDurationSchema = z.number().int().min(1).max(168).default(24);

export const createPollSchema = z.object({
  options: z
    .array(z.string().trim().min(1, "Option cannot be empty").max(80, "Option cannot exceed 80 characters"))
    .min(2, "Poll must have at least 2 options")
    .max(4, "Poll cannot have more than 4 options"),
  durationHours: pollDurationSchema,
});

export type CreatePollInput = z.infer<typeof createPollSchema>;

export const createPostSchema = z
  .object({
    content: z.string().max(1000, "Content cannot exceed 1000 characters").default(""),
    image: z.string().default(""),
    poll: createPollSchema.optional(),
  })
  .refine(
    (data) =>
      data.content.trim().length > 0 ||
      data.image.trim().length > 0 ||
      Boolean(data.poll && data.poll.options.length >= 2),
    {
      message: "Post must have text content, an image, or a poll",
    }
  );

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

