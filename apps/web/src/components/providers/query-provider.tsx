"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Create QueryClient with optimized defaults for our use case
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Reduce background refetching for better UX
            staleTime: 1000 * 60 * 5, // 5 minutes
            refetchOnWindowFocus: false,
            refetchOnReconnect: "always",
            // Retry failed requests less aggressively
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors (client errors)
              if (error instanceof Error && "status" in error) {
                const status = (error as any).status;
                if (status >= 400 && status < 500) {
                  return false;
                }
              }
              // Retry up to 2 times for other errors
              return failureCount < 2;
            },
          },
          mutations: {
            // Shorter timeout for mutations
            retry: 1,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}