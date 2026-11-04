import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { createPreviewStore } from './store-core';

/** Mobile-owned store. No web localStorage, IndexedDB or implicit cross-app synchronization. */
export const previewStore = createPreviewStore(AsyncStorage);
export function usePreview() { return useSyncExternalStore(previewStore.subscribe, previewStore.getSnapshot, previewStore.getServerSnapshot); }
