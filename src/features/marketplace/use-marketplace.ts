"use client";
import { useEffect, useSyncExternalStore } from "react";
import { getMarketplaceSnapshot, getServerMarketplaceSnapshot, initializeMarketplace, subscribeMarketplace } from "@/data/local-marketplace";
export function useMarketplace() { const state = useSyncExternalStore(subscribeMarketplace, getMarketplaceSnapshot, getServerMarketplaceSnapshot); useEffect(() => { void initializeMarketplace(); }, []); return state; }
