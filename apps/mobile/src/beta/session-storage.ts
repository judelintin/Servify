import * as SecureStore from 'expo-secure-store';
import { createSessionStorage } from './session-storage-core';
export const sessionStorage=createSessionStorage({
 getItemAsync:key=>SecureStore.getItemAsync(key),
 setItemAsync:(key,value)=>SecureStore.setItemAsync(key,value,{keychainAccessible:SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY}),
 deleteItemAsync:key=>SecureStore.deleteItemAsync(key),
});
