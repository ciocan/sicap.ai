import {
  integer,
  sqliteTable,
  text,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/sqlite-core";
import type { AdapterAccount } from "@auth/core/adapters";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import { env } from "@/lib/env.server";

const client = createClient({
  url: env.DATABASE_URL,
  authToken: env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client);

export const users = sqliteTable(
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

export const accounts = sqliteTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey(account.provider, account.providerAccountId),
    providerProviderAccountIdIndex: uniqueIndex("accounts__provider__providerAccountId__idx").on(
      account.provider,
      account.providerAccountId,
    ),
    userIdIndex: index("accounts__userId__idx").on(account.userId),
  }),
);

export const sessions = sqliteTable(
  "session",
  {
    sessionToken: text("sessionToken").notNull().primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (session) => ({
    sessionTokenIndex: uniqueIndex("sessions__sessionToken__idx").on(session.sessionToken),
    userIdIndex: index("sessions__userId__idx").on(session.userId),
  }),
);

export const verificationTokens = sqliteTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey(vt.identifier, vt.token),
    tokenIndex: uniqueIndex("verification_tokens__token__idx").on(vt.token),
  }),
);
