import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  platforms: text("platforms").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const secrets = pgTable("secrets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // API Key, Client ID, Client Secret, Access Token, Custom
  platform: varchar("platform").notNull(), // Google, AWS, Stripe, GitHub, Custom, etc.
  encryptedValues: jsonb("encrypted_values").notNull(), // JSON object with key-value pairs, all values AES-256 encrypted
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  secrets: many(secrets),
}));

export const secretsRelations = relations(secrets, ({ one }) => ({
  project: one(projects, {
    fields: [secrets.projectId],
    references: [projects.id],
  }),
}));

// Schemas
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSecretSchema = createInsertSchema(secrets).omit({
  id: true,
  encryptedValues: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  values: z.record(z.string(), z.string().min(1, "Secret value is required")).refine(
    (obj) => Object.keys(obj).length > 0,
    { message: "At least one key-value pair is required" }
  ),
});

export const updateProjectSchema = insertProjectSchema.partial();
export const updateSecretSchema = insertSecretSchema.partial();

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Secret = typeof secrets.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertSecret = z.infer<typeof insertSecretSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;
export type UpdateSecret = z.infer<typeof updateSecretSchema>;

// Extended types for frontend
export type ProjectWithSecrets = Project & {
  secrets: (Secret & { decryptedValues?: Record<string, string> })[];
  secretCount: number;
};

export type SecretWithDecrypted = Secret & {
  decryptedValues: Record<string, string>;
};
