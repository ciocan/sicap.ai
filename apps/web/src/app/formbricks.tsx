"use client";
import { useEffect, useRef, createContext, useContext, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type formbricksJs from "@formbricks/js";

import { env } from "@/lib/env";
import { useIdentify } from "@/hooks";

const FormbricksContext = createContext<{
	formbricks: typeof formbricksJs | null;
	isDone: boolean;
}>({
	formbricks: null,
	isDone: false,
});

export function useFormbricks() {
	const context = useContext(FormbricksContext);
	return context;
}

export default function FormbricksProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [isDone, setIsDone] = useState(false);
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const formbricksRef = useRef<typeof formbricksJs | null>(null);
	const { isAuthenticated, userId, user, isLoading } = useIdentify();
	const { email, name } = user ?? {};

	useEffect(() => {
		const initFormbricks = async () => {
			if (isLoading) {
				window.localStorage.removeItem("formbricks-js");
				return;
			}

			const params =
				isAuthenticated && userId && email && name
					? {
							userId,
							attributes: { email },
						}
					: {};

			await import("@formbricks/js").then(async (fb) => {
				window.localStorage.removeItem("formbricks-js");
				await fb.default.init({
					environmentId: env.NEXT_PUBLIC_FORMBRICKS_ENV_ID,
					apiHost: env.NEXT_PUBLIC_FORMBRICKS_API_HOST,
					...params,
				});

				formbricksRef.current = fb.default;
				setIsDone(true);
			});
		};
		initFormbricks();
		if (email && name && isDone) {
			formbricksRef.current?.setEmail(email);
			formbricksRef.current?.setAttribute("name", name);
			formbricksRef.current?.setAttribute("email", email);
		}
	}, [userId, isAuthenticated, email, name, isLoading, isDone]);

	useEffect(() => {
		formbricksRef.current?.registerRouteChange().then(() => {});
	}, [pathname, searchParams]);

	return (
		<FormbricksContext.Provider
			value={{
				formbricks: formbricksRef.current,
				isDone,
			}}
		>
			{children}
		</FormbricksContext.Provider>
	);
}
