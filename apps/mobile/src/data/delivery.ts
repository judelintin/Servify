import { marketplaceStore } from "./marketplace";
import { createDeliveryActions } from "./delivery-core";
export const {changeJobState,proposeSchedule,resolveSchedule,reportJobIssue,sendJobMessage,markConversationRead}=createDeliveryActions(marketplaceStore.mutate);