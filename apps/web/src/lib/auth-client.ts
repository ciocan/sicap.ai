import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

export const { useSession, signIn, signOut } = authClient;

export type Session = typeof authClient.$Infer.Session;
