import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from './colors';

type ThemeType = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: () => void;
  colors: typeof colors.light;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  colors: colors.light,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeType>('light');

  useEffect(() => {
    const loadThemeFromStorage = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('APP_THEME');
        if (storedTheme === 'light' || storedTheme === 'dark') {
          setTheme(storedTheme);
        }
      } catch (error) {
        console.error('Failed to load theme from storage:', error);
      }
    };

    loadThemeFromStorage();
  }, []);

  const toggleTheme = async () => {
    try {
      const newTheme: ThemeType = theme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
      await AsyncStorage.setItem('APP_THEME', newTheme);
    } catch (error) {
      console.error('Failed to save theme to storage:', error);
    }
  };

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    colors: colors[theme],
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
