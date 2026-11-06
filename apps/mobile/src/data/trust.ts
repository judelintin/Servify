import { marketplaceStore } from "./marketplace";
import { createTrustActions } from "./trust-core";
export const {saveReview,reportReview}=createTrustActions(marketplaceStore.mutate);