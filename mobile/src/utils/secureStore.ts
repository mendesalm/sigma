import * as SecureStore from 'expo-secure-store';

export async function saveSecureToken(key: string, value: string) {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error('Error saving secure token', error);
  }
}

export async function getSecureToken(key: string) {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error('Error getting secure token', error);
    return null;
  }
}

export async function deleteSecureToken(key: string) {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error('Error deleting secure token', error);
  }
}
