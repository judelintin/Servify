import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useSyncExternalStore } from 'react';
import { createProfessionalStore } from './professional-core';
export const professionalStore=createProfessionalStore(AsyncStorage);
export function useProfessional(){useEffect(()=>{void professionalStore.hydrate();},[]);return useSyncExternalStore(professionalStore.subscribe,professionalStore.getSnapshot,professionalStore.getServerSnapshot);}
