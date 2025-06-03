import React,{ useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ThemeProvider } from './src/theme/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import BottomNavBar from './src/components/BottomNavBar';
import ProfileDetailsScreen from './src/screens/ProfileDetailsScreen';
import { SafeAreaView, ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  ProfileDetailsScreen:undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const { isLoggedIn } = useAuth();

  if (isLoggedIn === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
    {!isLoggedIn ? (
      <Stack.Screen name="Login" component={LoginScreen} />
    ) : (
      <>
        <Stack.Screen name="Main" component={BottomNavBar} />
        <Stack.Screen name="ProfileDetailsScreen" component={ProfileDetailsScreen} />
        {/* Add more screens here */}
      </>
    )}
  </Stack.Navigator>
  );
};

function App(): React.JSX.Element {
  // Ensure default theme is set once
  useEffect(() => {
    const initializeDefaultTheme = async () => {
      try {
        const stored = await AsyncStorage.getItem('APP_THEME');
        if (!stored) {
          await AsyncStorage.setItem('APP_THEME', 'dark');
        }
      } catch (err) {
        console.error('Failed to initialize APP_THEME:', err);
      }
    };
    initializeDefaultTheme();
  }, []);
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <AuthProvider>
        <ThemeProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaView>
  );
}

export default App;
