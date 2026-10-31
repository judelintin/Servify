export const foundationRoutes = [
  { href: "/customer/dashboard", title: "Customer dashboard", description: "Customers will manage their job requests and accepted offers here." },
  { href: "/jobs/new", title: "Post a job", description: "Customers will describe work, select a service area, and attach job images here." },
  { href: "/jobs/example-job", title: "Job details", description: "A job owner and eligible providers will see an appropriate view of a job here." },
  { href: "/provider/onboarding", title: "Provider onboarding", description: "Providers will select services, coverage areas, and submit verification here." },
  { href: "/provider/dashboard", title: "Provider dashboard", description: "Providers will find relevant requests and manage their offers here." },
  { href: "/offers", title: "Offers", description: "Customers will compare offers and providers will manage their own submissions here." },
  { href: "/conversations", title: "Conversations", description: "Participants will find communication linked to accepted jobs here." },
  { href: "/conversations/example-conversation", title: "Job conversation", description: "Only the job customer and accepted provider will exchange messages here." },
  { href: "/admin/dashboard", title: "Admin dashboard", description: "Authorized administrators will review verification submissions, reports, and disputes here." },
  { href: "/auth/sign-in", title: "Sign in", description: "Authentication will be introduced after delivery and security requirements are validated." },
  { href: "/auth/sign-up", title: "Create an account", description: "Customer and provider registration will be introduced in a later stage." },
] as const;
