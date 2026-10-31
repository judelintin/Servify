"use client";
import { useEffect, useSyncExternalStore } from "react";
import { getProviderSnapshot, getServerProviderSnapshot, initializeProvider, subscribeProvider } from "@/data/local-provider";
export function useProviderProfile() {
  const state = useSyncExternalStore(subscribeProvider, getProviderSnapshot, getServerProviderSnapshot);
  useEffect(() => { void initializeProvider(); }, []);
  return state;
}
