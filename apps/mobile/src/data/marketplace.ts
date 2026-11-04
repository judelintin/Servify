import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useSyncExternalStore } from 'react';
import { createMarketplaceStore } from './marketplace-core';
import { photoUri, keepPhoto } from './photo-files';
import { newId, type RequestDraft } from '../domain/requests';
export const marketplaceStore=createMarketplaceStore(AsyncStorage);
export function useMarketplace(){useEffect(()=>{void marketplaceStore.hydrate();},[]);return useSyncExternalStore(marketplaceStore.subscribe,marketplaceStore.getSnapshot,marketplaceStore.getServerSnapshot);}
export async function publishRequest(draft:RequestDraft){
  if(marketplaceStore.getSnapshot().data.jobs.some(j=>j.sourceId===draft.id))return;
  const snapshot:RequestDraft=JSON.parse(JSON.stringify(draft));
  // Publication owns its own photo copies, independent of subsequent draft cleanup.
  for(const photo of snapshot.content.photos){const uri=await photoUri(photo.id);const id=newId();await keepPhoto(id,uri,'marketplace');photo.id=id;}
  await marketplaceStore.publish(snapshot);
}
