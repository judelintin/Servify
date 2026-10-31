"use client";
import { useEffect, useSyncExternalStore } from "react";
import { getDraftSnapshot, getServerDraftSnapshot, initializeDrafts, subscribeDrafts } from "@/data/local-drafts";
export function useLocalDrafts() {
  const state = useSyncExternalStore(subscribeDrafts, getDraftSnapshot, getServerDraftSnapshot);
  useEffect(() => { void initializeDrafts(); }, []);
  return state;
}
