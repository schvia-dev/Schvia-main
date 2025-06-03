import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';

// Screens
import HomeScreen from '../screens/HomeScreen';
import FeedScreen from '../screens/FeedScreen';
import ClassScreen from '../screens/ClassScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function BottomNavBar() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          marginBottom: 0,
          marginHorizontal: 0,
          height: 60,
          ...colors.card.shadow,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          borderTopWidth: 0,
          paddingBottom: 10,
        },
        tabBarItemStyle: {
          height: 60,
          paddingTop: 10, // Add padding at the top of items
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = '';
          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Feed':
              iconName = focused ? 'newspaper' : 'newspaper-outline';
              break;
            case 'Class':
              iconName = focused ? 'albums' : 'albums-outline';
              break;
            case 'Chat':
              iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
          }

          return (
            <Icon
              name={iconName}
              size={26}
              color={focused ? colors.primary : colors.navbariconoff}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Class" component={ClassScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}