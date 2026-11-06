"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { setToken, useToken } from "./session";

/** The signed-in admin. `checking` while the stored token is read or verified. */
export function useAdmin() {
  const token = useToken();
  const me = useQuery({
    queryKey: ["me", token],
    queryFn: api.me,
    enabled: !!token,
  });
  return {
    admin: token ? me.data : undefined,
    checking: token === undefined || (!!token && me.isPending),
    signedOut: token === null || me.isError,
  };
}

export function useLogout() {
  const queryClient = useQueryClient();
  return () => {
    setToken(null);
    queryClient.clear();
  };
}
