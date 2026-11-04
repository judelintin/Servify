import type { UserRole } from '../../../../src/types/marketplace';
import { isCategory, type CategoryId } from './catalog';

/** Same customer/provider terminology as web, with no authenticated identity implied. */
export type PreviewMode = Extract<UserRole, 'customer' | 'provider'>;
export interface RequestStarter {
  id: string;
  category: CategoryId;
  createdAt: string;
  updatedAt: string;
  stage: 'service_selected';
}
export interface PreviewData { schemaVersion: 1; mode: PreviewMode; starters: RequestStarter[] }
export const emptyPreview = (): PreviewData => ({ schemaVersion: 1, mode: 'customer', starters: [] });
export function isMode(value: unknown): value is PreviewMode { return value === 'customer' || value === 'provider'; }

/** Never adapt unknown schemas or silently delete malformed records. */
export function parsePreview(raw: string): PreviewData {
  if (raw.length > 100_000) throw new Error('Preview storage is too large.');
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== 'object') throw new Error('Invalid preview.');
  const p = value as PreviewData;
  if (p.schemaVersion !== 1 || !isMode(p.mode) || !Array.isArray(p.starters) || p.starters.length > 50) throw new Error('Unsupported preview.');
  const ids = new Set<string>();
  for (const item of p.starters) {
    if (!item || typeof item.id !== 'string' || !/^[a-z0-9-]{8,80}$/.test(item.id) || ids.has(item.id) || !isCategory(item.category) || item.stage !== 'service_selected' || [item.createdAt, item.updatedAt].some(d => typeof d !== 'string' || !Number.isFinite(Date.parse(d)))) throw new Error('Invalid request starter.');
    ids.add(item.id);
  }
  return { schemaVersion: 1, mode: p.mode, starters: p.starters.map(s => ({ id: s.id, category: s.category, createdAt: s.createdAt, updatedAt: s.updatedAt, stage: 'service_selected' })) };
}
