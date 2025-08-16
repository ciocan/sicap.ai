import { integer, sqliteTable, text, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { drizzle } from "drizzle-orm/libsql";

import { env } from "../lib/env";

export const db = drizzle({
  connection: {
    url: env.DATABASE_URL,
    authToken: env.DATABASE_AUTH_TOKEN,
  },
});

export const userTable = sqliteTable(
  "user",
  {
    id: text("id").notNull().primaryKey(),
    name: text("name"),
    email: text("email").notNull(),
    emailVerified: integer("emailVerified", { mode: "boolean" })
      .$defaultFn(() => false)
      .notNull(),
    image: text("image"),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (user) => [uniqueIndex("users__email__idx").on(user.email)],
);

export const sessionTable = sqliteTable(
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
      .references(() => userTable.id, { onDelete: "cascade" }),
  },
  (session) => [
    uniqueIndex("session__token__idx").on(session.token),
    index("session__userId__idx").on(session.userId),
  ],
);

export const accountTable = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
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
  (account) => [
    uniqueIndex("account__providerId__accountId__idx").on(account.providerId, account.accountId),
    index("account__userId__idx").on(account.userId),
  ],
);

export const verificationTable = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(
      () => /* @__PURE__ */ new Date(),
    ),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(
      () => /* @__PURE__ */ new Date(),
    ),
  },
  (verification) => [index("verification__identifier__idx").on(verification.identifier)],
);

export const jwksTable = sqliteTable("jwks", {
  id: text("id").primaryKey(),
  publicKey: text("publicKey").notNull(),
  privateKey: text("privateKey").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
});
