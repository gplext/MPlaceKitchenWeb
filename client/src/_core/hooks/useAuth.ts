import { trpc } from "@/lib/trpc";
import { useQueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import { useCallback } from "react";

/** The signed-in user (or null), plus sign-out. Signing in is optional for customers. */
export function useAuth() {
  const utils = trpc.useUtils();
  const queryClient = useQueryClient();
  const meQuery = trpc.auth.me.useQuery(undefined, { retry: false, refetchOnWindowFocus: false, staleTime: 60_000 });
  const logoutMutation = trpc.auth.logout.useMutation();

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } finally {
      utils.auth.me.setData(undefined, null);
      // Forget everything that belonged to the account that just signed out, without refetching it.
      for (const key of [getQueryKey(trpc.orders.mine), getQueryKey(trpc.admin)]) queryClient.removeQueries({ queryKey: key });
    }
  }, [logoutMutation, utils, queryClient]);

  return { user: meQuery.data ?? null, loading: meQuery.isLoading || logoutMutation.isPending, logout };
}
