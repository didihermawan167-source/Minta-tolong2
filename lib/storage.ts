lib/storage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

export async function getItem(key: string) {
  return AsyncStorage.getItem(key);
}

export async function setItem(key: string, value: string) {
  return AsyncStorage.setItem(key, value);
}

export async function removeItem(key: string) {
  return AsyncStorage.removeItem(key);
}
