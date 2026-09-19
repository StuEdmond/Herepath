import { pgTable, pgEnum, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const enquiryStatusEnum = pgEnum("advertising_enquiry_status", ["new", "contacted", "closed"]);

/** A business asking about advertising, from the public Advertise with us form. Handled by hand in admin. */
export const advertisingEnquiries = pgTable("advertising_enquiries", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessName: text("business_name").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  businessType: text("business_type").notNull(),
  website: text("website"),
  message: text("message").notNull(),
  status: enquiryStatusEnum("status").notNull().default("new"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
