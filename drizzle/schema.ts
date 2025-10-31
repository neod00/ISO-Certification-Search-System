import { pgTable, serial, varchar, text, timestamp, pgEnum } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const roleEnum = pgEnum("role", ["user", "admin"]);

export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: serial("id").primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ISO Certification related tables
export const statusEnum = pgEnum("status", ["valid", "expired", "unknown"]);

export const isoCertifications = pgTable("iso_certifications", {
  id: serial("id").primaryKey(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  companyNameEn: varchar("companyNameEn", { length: 255 }),
  certificationTypes: text("certificationTypes").notNull(), // JSON array of ISO types
  certificationBodies: text("certificationBodies").notNull(), // JSON array of certification bodies
  issuedDate: varchar("issuedDate", { length: 10 }), // YYYY-MM-DD format
  expiryDate: varchar("expiryDate", { length: 10 }), // YYYY-MM-DD format
  status: statusEnum("status").default("unknown").notNull(),
  sources: text("sources").notNull(), // JSON array of sources with URLs
  lastUpdated: timestamp("lastUpdated").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type IsoCertification = typeof isoCertifications.$inferSelect;
export type InsertIsoCertification = typeof isoCertifications.$inferInsert;

// Search cache to reduce redundant API calls
export const searchCache = pgTable("search_cache", {
  id: serial("id").primaryKey(),
  searchQuery: varchar("searchQuery", { length: 255 }).notNull().unique(),
  results: text("results").notNull(), // JSON array of certification results
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SearchCache = typeof searchCache.$inferSelect;
export type InsertSearchCache = typeof searchCache.$inferInsert;

