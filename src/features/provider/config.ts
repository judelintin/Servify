import { customerCategories, customerAreas } from "@/features/customer/config";
/** One provisional taxonomy for both roles; no claim of validated launch coverage. */
export const providerCategories = customerCategories;
export const providerAreas = customerAreas;
export const providerSteps = ["About you", "Services", "Coverage", "Introduction", "Portfolio", "Review"] as const;
export const specializations: Record<string, readonly string[]> = {
  plumbing: ["Taps & fittings", "Pipe repairs", "Drainage"],
  electrical: ["Lighting", "Sockets & switches", "Fault finding"],
  cooling: ["AC servicing", "Refrigerator repairs", "Installation"],
  generator: ["Generator servicing", "Power faults", "Maintenance"],
  cleaning: ["Home cleaning", "Deep cleaning", "Office cleaning"],
  appliance: ["Washing machines", "Kitchen appliances", "Appliance maintenance"],
};
export const categoryName = (slug: string) => providerCategories.find(item => item.slug === slug)?.label ?? "Unlisted service";
export const areaName = (slug: string) => providerAreas.find(item => item.slug === slug)?.label ?? "Unlisted area";
