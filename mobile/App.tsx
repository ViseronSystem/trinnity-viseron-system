import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TVSProvider } from './src/context/TVSContext';
import DashboardScreen from './src/screens/DashboardScreen';
import AgentsScreen from './src/screens/AgentsScreen';
import TerminalScreen from './src/screens/TerminalScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <TVSProvider>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ focused, color, size }) => {
                let iconName: keyof typeof Ionicons.glyphMap = 'ellipse';
                if (route.name === 'Dashboard') iconName = focused ? 'grid' : 'grid-outline';
                else if (route.name === 'Agents') iconName = focused ? 'people' : 'people-outline';
                else if (route.name === 'Terminal') iconName = focused ? 'terminal' : 'terminal-outline';
                return <Ionicons name={iconName} size={size} color={color} />;
              },
              tabBarActiveTintColor: '#00f5ff',
              tabBarInactiveTintColor: '#4a4a7a',
              tabBarStyle: {
                backgroundColor: '#0a0a2e',
                borderTopColor: '#1a1a4e',
                borderTopWidth: 1,
              },
              headerStyle: {
                backgroundColor: '#0a0a2e',
              },
              headerTintColor: '#00f5ff',
              headerTitleStyle: { fontWeight: 'bold' },
            })}
          >
            <Tab.Screen name="Dashboard" component={DashboardScreen} />
            <Tab.Screen name="Agents" component={AgentsScreen} />
            <Tab.Screen name="Terminal" component={TerminalScreen} />
          </Tab.Navigator>
        </NavigationContainer>
        <StatusBar style="light" />
      </TVSProvider>
    </SafeAreaProvider>
  );
}
