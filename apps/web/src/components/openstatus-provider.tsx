"use client";

import { OpenStatusProvider as OSTProvider } from "@openstatus/next-monitoring";

interface OpenStatusProviderProps {
	/**
	 * The DSN of your OpenStatus project.
	 */
	dsn: string;
}

/**
 * Client-side wrapper for `@openstatus/next-monitoring`'s `OpenStatusProvider`.
 *
 * This ensures that the provider (which relies on the React Client runtime)
 * is only executed on the client, preventing `createContext` errors during the
 * Next.js server build.
 */
export default function OpenStatusProvider({ dsn }: OpenStatusProviderProps) {
	return <OSTProvider dsn={dsn} />;
}
