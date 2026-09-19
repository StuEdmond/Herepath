import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { contentStatusEnum } from "./enums";

/** Articles written by the Herepath team in admin: maintenance, camping, tool kits, gear. */
export const adviceArticles = pgTable("advice_articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull().default(""),
  /** Plain text: blank lines separate paragraphs, "## " starts a heading, "- " lines make a list. */
  body: text("body").notNull(),
  category: text("category").notNull().default("general"),
  coverImage: text("cover_image"),
  status: contentStatusEnum("status").notNull().default("draft"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
