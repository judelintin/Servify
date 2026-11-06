import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useSyncExternalStore } from 'react';
import { createWelcomeStore } from './welcome-core';
export const welcomeStore=createWelcomeStore(AsyncStorage);
export function useWelcome(){useEffect(()=>{void welcomeStore.hydrate();},[]);return useSyncExternalStore(welcomeStore.subscribe,welcomeStore.getSnapshot,welcomeStore.getServerSnapshot);}
