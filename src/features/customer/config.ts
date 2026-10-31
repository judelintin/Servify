/** Provisional design-review catalogue, not a claim of live launch coverage. */
export const customerCategories = [
  { slug: "plumbing", label: "Plumbing", description: "Leaks, pipes, taps and water fittings" },
  { slug: "electrical", label: "Electrical", description: "Wiring, sockets, lighting and repairs" },
  { slug: "cooling", label: "AC & refrigeration", description: "Cooling, servicing and refrigeration" },
  { slug: "generator", label: "Generator & power", description: "Generator servicing and power issues" },
  { slug: "cleaning", label: "Cleaning", description: "A fresh start for your home or space" },
  { slug: "appliance", label: "Appliance repair", description: "Help with everyday household appliances" },
] as const;
export const customerAreas = [
  { slug: "bodija", label: "Bodija" }, { slug: "akobo", label: "Akobo" },
  { slug: "oluyole", label: "Oluyole" }, { slug: "iyaganku", label: "Iyaganku" },
  { slug: "jericho", label: "Jericho" }, { slug: "challenge", label: "Challenge" },
  { slug: "ring-road", label: "Ring Road" }, { slug: "apete", label: "Apete" },
  { slug: "other-ibadan", label: "Another area in Ibadan" },
] as const;
export const postingSteps = ["Service", "Details", "Photos", "Area", "Timing", "Budget", "Review"] as const;
export const categoryLabel = (slug: string) => customerCategories.find((item) => item.slug === slug)?.label ?? "Choose a service";
export const areaLabel = (slug: string) => customerAreas.find((item) => item.slug === slug)?.label ?? "Not selected";
