"use client";

import * as React from "react";
import { DirectionProvider } from "@radix-ui/react-direction";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ApiError } from "@/lib/client-api";

/**
 * One QueryClient per browser tab, created lazily inside state so that a React
 * StrictMode double-render does not build two of them and split the cache.
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Without a staleTime the client refetches on mount and every server
        // prefetch is theatre — the page pays for the data twice.
        staleTime: 30_000,
        retry: (failureCount, error) => {
          // Retrying a 403 does not make the viewer more authorized, and
          // retrying a 404 does not conjure the row. Only retry the transient.
          if (error instanceof ApiError && error.status < 500) return false;
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        onError: (error) => {
          // Mutations may override this, but nothing should fail silently.
          toast.error(error instanceof ApiError ? error.message : "אירעה שגיאה");
        },
      },
    },
  });
}

export function Providers({
  children,
  direction,
}: {
  children: React.ReactNode;
  direction: "rtl" | "ltr";
}) {
  const [queryClient] = React.useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Radix portals render outside <html dir>, so they cannot inherit the
          direction. This is how a dropdown knows which way it is facing. */}
      <DirectionProvider dir={direction}>
        <TooltipProvider delayDuration={300}>
          <NuqsAdapter>{children}</NuqsAdapter>
        </TooltipProvider>
      </DirectionProvider>
    </QueryClientProvider>
  );
}
