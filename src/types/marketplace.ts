/** Planning contracts, not runtime validators or a production database schema.
 * All IDs are UUIDs, all timestamps are UTC ISO-8601 strings.
 * Ownership, constraints and transitions: docs/DATA_MODEL.md.
 */
export type ID = string;
export type Timestamp = string;
export type UserRole = "customer" | "provider" | "admin";
export type AccountStatus = "active" | "suspended" | "deactivated";

export interface Entity { id: ID; createdAt: Timestamp; updatedAt: Timestamp }
/** Private account record. Never return this whole object as a public profile. */
export interface User extends Entity {
  roles: UserRole[];
  displayName: string;
  email: string | null;
  phoneE164: string | null;
  phoneVerifiedAt: Timestamp | null;
  status: AccountStatus;
}
export interface CustomerProfile extends Entity {
  userId: ID;
  defaultServiceAreaId: ID | null;
}
export type ProviderStatus = "draft" | "pending_review" | "approved" | "rejected" | "suspended";
export interface ProviderProfile extends Entity {
  userId: ID;
  businessName: string | null;
  bio: string;
  categoryIds: ID[];
  serviceAreaIds: ID[];
  portfolioImagePaths: string[];
  status: ProviderStatus;
}
export interface ServiceCategory extends Entity {
  slug: string;
  name: string;
  description: string;
  active: boolean;
}
export interface ServiceArea extends Entity {
  name: string;
  city: "Ibadan";
  state: "Oyo";
  countryCode: "NG";
  active: boolean;
}
export type VerificationStatus = "submitted" | "under_review" | "approved" | "rejected" | "withdrawn";
export interface VerificationSubmission extends Entity {
  providerProfileId: ID;
  kind: "identity" | "trade_credential";
  privateDocumentPaths: string[];
  status: VerificationStatus;
  reviewedByUserId: ID | null;
  reviewedAt: Timestamp | null;
  decisionReason: string | null;
}
export type JobStatus = "draft" | "open" | "assigned" | "in_progress" | "completion_requested" | "completed" | "cancelled";
/** Full private record; provider discovery must use a sanitized projection. */
export interface JobRequest extends Entity {
  customerProfileId: ID;
  categoryId: ID;
  serviceAreaId: ID;
  title: string;
  description: string;
  privateAddress: string | null;
  preferredDate: string | null;
  budgetMinKobo: number | null;
  budgetMaxKobo: number | null;
  currency: "NGN";
  status: JobStatus;
  acceptedOfferId: ID | null;
  publishedAt: Timestamp | null;
  completedAt: Timestamp | null;
}
export interface JobImage extends Entity {
  jobRequestId: ID;
  uploadedByUserId: ID;
  storagePath: string;
  altText: string;
  sortOrder: number;
}
export type OfferStatus = "submitted" | "accepted" | "not_selected" | "withdrawn" | "expired";
export interface ProviderOffer extends Entity {
  jobRequestId: ID;
  providerProfileId: ID;
  amountKobo: number;
  currency: "NGN";
  scope: string;
  estimatedDuration: string;
  availableFrom: Timestamp | null;
  expiresAt: Timestamp;
  status: OfferStatus;
  acceptedAt: Timestamp | null;
}
export interface Conversation extends Entity {
  jobRequestId: ID;
  customerUserId: ID;
  providerUserId: ID;
  status: "active" | "closed";
}
export interface Message extends Entity {
  conversationId: ID;
  senderUserId: ID;
  body: string;
  moderationStatus: "visible" | "hidden";
}
export interface JobStatusHistory {
  id: ID;
  jobRequestId: ID;
  actorUserId: ID;
  fromStatus: JobStatus | null;
  toStatus: JobStatus;
  reason: string | null;
  createdAt: Timestamp;
}
export interface Review extends Entity {
  jobRequestId: ID;
  customerProfileId: ID;
  providerProfileId: ID;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  moderationStatus: "published" | "hidden";
}
export type ReportTarget =
  | { kind: "user"; userId: ID }
  | { kind: "job"; jobRequestId: ID }
  | { kind: "message"; messageId: ID }
  | { kind: "review"; reviewId: ID };
export type CaseStatus = "open" | "under_review" | "resolved" | "dismissed";
export interface Report extends Entity {
  reporterUserId: ID;
  target: ReportTarget;
  reason: "spam" | "harassment" | "fraud" | "unsafe_work" | "other";
  description: string;
  status: CaseStatus;
  assignedAdminUserId: ID | null;
  resolution: string | null;
  resolvedAt: Timestamp | null;
}
export interface Dispute extends Entity {
  jobRequestId: ID;
  openedByUserId: ID;
  reason: "work_quality" | "no_show" | "scope_disagreement" | "safety" | "other";
  description: string;
  status: CaseStatus;
  assignedAdminUserId: ID | null;
  resolution: string | null;
  resolvedAt: Timestamp | null;
}
