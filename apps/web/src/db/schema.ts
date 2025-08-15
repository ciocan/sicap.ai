import { integer, sqliteTable, text, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { drizzle } from "drizzle-orm/libsql";

import { env } from "@/lib/env";

export const db = drizzle({
  connection: {
    url: env.DATABASE_URL,
    authToken: env.DATABASE_AUTH_TOKEN,
  },
});

export const user = sqliteTable(
  "user",
  {
    id: text("id").notNull().primaryKey(),
    name: text("name"),
    email: text("email").notNull(),
    emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
    image: text("image"),
    updatedAt: text("updated_at"),
    createdAt: text("created_at"),
  },
  (user) => ({
    emailIndex: uniqueIndex("users__email__idx").on(user.email),
  }),
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp" }),
    refreshTokenExpiresAt: integer("refreshTokenExpiresAt", { mode: "timestamp" }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  },
  (account) => ({
    providerAccountIdIndex: uniqueIndex("account__providerId__accountId__idx").on(
      account.providerId,
      account.accountId,
    ),
    userIdIndex: index("account__userId__idx").on(account.userId),
  }),
);

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (session) => ({
    tokenIndex: uniqueIndex("session__token__idx").on(session.token),
    userIdIndex: index("session__userId__idx").on(session.userId),
  }),
);

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" }),
    updatedAt: integer("updatedAt", { mode: "timestamp" }),
  },
  (verification) => ({
    identifierIndex: index("verification__identifier__idx").on(verification.identifier),
  }),
);
