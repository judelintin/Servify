import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useSyncExternalStore } from 'react';
import { createRequestStore } from './request-core';
export const requestStore=createRequestStore(AsyncStorage);
export function useRequests(){useEffect(()=>{void requestStore.hydrate();},[]);return useSyncExternalStore(requestStore.subscribe,requestStore.getSnapshot,requestStore.getServerSnapshot);}
