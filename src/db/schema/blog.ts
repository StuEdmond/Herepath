import { pgTable, pgEnum, uuid, text, timestamp, unique } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { tripTargetEnum } from "./enums-social";

/** pending = waiting for a moderator; approved = live; rejected = sent back to the rider with a note. */
export const blogPostStatusEnum = pgEnum("blog_post_status", ["pending", "approved", "rejected"]);

/** Posts written by riders. Nothing is public until a moderator approves it. */
export const blogPosts = pgTable("blog_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  /** Plain text: blank lines separate paragraphs, "## " starts a heading, "- " lines make a list. */
  body: text("body").notNull(),
  coverImage: text("cover_image"),
  /** Optional Herepath ride this post is about. */
  targetType: tripTargetEnum("target_type"),
  targetId: uuid("target_id"),
  status: blogPostStatusEnum("status").notNull().default("pending"),
  moderatorNote: text("moderator_note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  publishedAt: timestamp("published_at"),
  reviewedAt: timestamp("reviewed_at"),
});

/** A reader flagging a live post for a moderator. One report per person per post. */
export const blogPostReports = pgTable(
  "blog_post_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => blogPosts.id, { onDelete: "cascade" }),
    reporterId: text("reporter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [unique("blog_post_reports_once").on(t.postId, t.reporterId)],
);
