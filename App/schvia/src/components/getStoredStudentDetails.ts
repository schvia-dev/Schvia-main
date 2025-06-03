import AsyncStorage from '@react-native-async-storage/async-storage';

export const getStoredStudentDetails = async (): Promise<any | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem('@user_data');
    if (jsonValue != null) {
      const studentData = JSON.parse(jsonValue);
      console.log('Retrieved student data in getstored file:', studentData);
      return studentData;
    } else {
      console.warn('No student data found in AsyncStorage.');
      return null;
    }
  } catch (e) {
    console.error('Failed to load user data from AsyncStorage', e);
    return null;
  }
};
