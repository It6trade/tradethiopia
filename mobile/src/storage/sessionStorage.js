import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'tradethiopia.mobile.session';

export const storeSession = async (session) => {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
};

export const getStoredSession = async () => {
  try {
    const value = await SecureStore.getItemAsync(SESSION_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

export const clearStoredSession = async () => {
  await SecureStore.deleteItemAsync(SESSION_KEY);
};
