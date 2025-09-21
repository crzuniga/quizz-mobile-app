import AsyncStorage from '@react-native-async-storage/async-storage';

export function useStorage(key: string) {
  const get = async () => {
    try {
      const raw = await AsyncStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('Storage get error', e);
      return null;
    }
  };

  const set = async (value: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('Storage set error', e);
    }
  };

  const remove = async () => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.warn('Storage remove error', e);
    }
  };

  return { get, set, remove };
}
