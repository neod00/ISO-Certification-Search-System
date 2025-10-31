import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users, isoCertifications, searchCache, InsertIsoCertification } from "../drizzle/schema";
import { ENV } from './_core/env';

// Connection pool for serverless environments (Vercel)
let pool: mysql.Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance with connection pooling for Vercel serverless
export async function getDb() {
  if (!process.env.DATABASE_URL) {
    console.warn("[Database] DATABASE_URL not set");
    return null;
  }

  if (!pool) {
    try {
      // Create connection pool optimized for serverless
      pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        // Serverless-friendly settings
        maxIdle: 10,
        idleTimeout: 60000,
      });
      _db = drizzle(pool);
      console.log("[Database] Connection pool created successfully");
    } catch (error) {
      console.warn("[Database] Failed to create pool:", error);
      pool = null;
      _db = null;
      return null;
    }
  }
  
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ISO Certification queries
export async function searchISOCertifications(companyName: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot search certifications: database not available");
    return [];
  }

  try {
    const results = await db
      .select()
      .from(isoCertifications)
      .where(
        sql`LOWER(companyName) LIKE LOWER(${`%${companyName}%`})`
      )
      .orderBy(isoCertifications.lastUpdated);

    return results.map(cert => ({
      ...cert,
      certificationTypes: JSON.parse(cert.certificationTypes),
      certificationBodies: JSON.parse(cert.certificationBodies),
      sources: JSON.parse(cert.sources),
    }));
  } catch (error) {
    console.error("[Database] Failed to search certifications:", error);
    return [];
  }
}

export async function getCachedSearchResults(query: string) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(searchCache)
      .where(
        sql`searchQuery = ${query} AND expiresAt > NOW()`
      )
      .limit(1);

    if (result.length > 0) {
      return JSON.parse(result[0].results);
    }
    return null;
  } catch (error) {
    console.error("[Database] Failed to get cached results:", error);
    return null;
  }
}

export async function setCachedSearchResults(
  query: string,
  results: unknown,
  expiryHours: number = 24
) {
  const db = await getDb();
  if (!db) return false;

  try {
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
    await db
      .insert(searchCache)
      .values({
        searchQuery: query,
        results: JSON.stringify(results),
        expiresAt,
      })
      .onDuplicateKeyUpdate({
        set: {
          results: JSON.stringify(results),
          expiresAt,
        },
      });
    return true;
  } catch (error) {
    console.error("[Database] Failed to set cached results:", error);
    return false;
  }
}

export async function saveIsoCertification(data: InsertIsoCertification) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save certification: database not available");
    return null;
  }

  try {
    const result = await db.insert(isoCertifications).values(data);
    return result;
  } catch (error) {
    console.error("[Database] Failed to save certification:", error);
    return null;
  }
}

// TODO: add more feature queries here as your schema grows.
