import AsyncStorage from '@react-native-async-storage/async-storage';

export const removeUserData = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('@user_data');
    console.log('User data removed from AsyncStorage');
  } catch (e) {
    console.error('Failed to remove user data', e);
  }
};
