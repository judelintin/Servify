/** Portable snapshot of the provisional web catalogue. Parity is checked by verify-domain.mjs.
 * This avoids making native Metro resolve web modules or a second React installation.
 */
export const categories = [
  { slug: 'plumbing', label: 'Plumbing', description: 'Leaks, pipes, taps and water fittings', icon: 'droplet' },
  { slug: 'electrical', label: 'Electrical', description: 'Wiring, sockets, lighting and repairs', icon: 'zap' },
  { slug: 'cooling', label: 'AC & refrigeration', description: 'Cooling, servicing and refrigeration', icon: 'wind' },
  { slug: 'generator', label: 'Generator & power', description: 'Generator servicing and power issues', icon: 'battery-charging' },
  { slug: 'cleaning', label: 'Cleaning', description: 'A fresh start for your home or space', icon: 'feather' },
  { slug: 'appliance', label: 'Appliance repair', description: 'Help with everyday household appliances', icon: 'grid' },
] as const;
export type CategoryId = typeof categories[number]['slug'];
export function isCategory(value: unknown): value is CategoryId { return categories.some(item => item.slug === value); }
export function categoryById(id: CategoryId) { return categories.find(item => item.slug === id)!; }
export const requestSteps = ['Service', 'Details', 'Photos', 'Area', 'Timing', 'Budget', 'Review'] as const;
