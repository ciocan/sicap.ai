import { jwtVerify, createRemoteJWKSet } from "jose";

import { env } from "@sicap/data/lib/env";

export async function validateToken(token: string) {
  try {
    const JWKS = createRemoteJWKSet(new URL(`${env.NEXTAUTH_URL}/api/auth/jwks`));

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: env.NEXTAUTH_URL,
      audience: env.NEXTAUTH_URL,
    });

    return payload;
  } catch (error) {
    console.error("Token validation failed:", error);
    throw error;
  }
}
