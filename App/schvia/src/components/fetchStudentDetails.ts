import AsyncStorage from '@react-native-async-storage/async-storage';
import { ngrokConfig } from '../ngrokconfig'; 

export const fetchAndStoreStudentDetails = async (studentId: string) => {
    console.log('Fetching student details for:', studentId);
  
    fetch(`${ngrokConfig.ngrok_URL}/app/studentdetails/${studentId}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }
    })
      .then(async (resp) => {
        const result = await resp.json();
        if (!result.success) {
          console.error('Backend error:', result.message);
          return;
        }
  
        const user = result.data;
        try {
          const jsonValue = JSON.stringify(user);
          await AsyncStorage.setItem('@user_data', jsonValue);
          console.log('User data saved to AsyncStorage');
        } catch (e) {
          console.error('Failed to save user data:', e);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch student details:', err);
      });
  
    console.log('Student data fetch attempt sent');
  };