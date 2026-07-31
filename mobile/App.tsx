import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TVSProvider } from './src/context/TVSContext';
import DashboardScreen from './src/screens/DashboardScreen';
import DashboardWebScreen from './src/screens/DashboardWebScreen';
import AgentsScreen from './src/screens/AgentsScreen';
import TerminalScreen from './src/screens/TerminalScreen';
import TokenScreen from './src/screens/TokenScreen';
import VoiceScreen from './src/screens/VoiceScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

type IoniconsName = keyof typeof Ionicons.glyphMap;

const TAB_ICONS: Record<string, { focused: IoniconsName; unfocused: IoniconsName }> = {
  Dashboard: { focused: 'grid', unfocused: 'grid-outline' },
  DashboardWeb: { focused: 'globe', unfocused: 'globe-outline' },
  Agents: { focused: 'people', unfocused: 'people-outline' },
  Terminal: { focused: 'terminal', unfocused: 'terminal-outline' },
  Token: { focused: 'cash', unfocused: 'cash-outline' },
  Voice: { focused: 'mic', unfocused: 'mic-outline' },
  Settings: { focused: 'settings', unfocused: 'settings-outline' },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <TVSProvider>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ focused, color, size }) => {
                const icons = TAB_ICONS[route.name] || { focused: 'ellipse', unfocused: 'ellipse' };
                const iconName = focused ? icons.focused : icons.unfocused;
                return <Ionicons name={iconName} size={size} color={color} />;
              },
              tabBarActiveTintColor: '#00f5ff',
              tabBarInactiveTintColor: '#4a4a7a',
              tabBarStyle: {
                backgroundColor: '#0a0a2e',
                borderTopColor: '#1a1a4e',
                borderTopWidth: 1,
                paddingBottom: 4,
                height: 56,
              },
              headerStyle: { backgroundColor: '#0a0a2e' },
              headerTintColor: '#00f5ff',
              headerTitleStyle: { fontWeight: 'bold' },
            })}
          >
            <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'TVS' }} />
            <Tab.Screen name="DashboardWeb" component={DashboardWebScreen} options={{ title: 'Web' }} />
            <Tab.Screen name="Agents" component={AgentsScreen} />
            <Tab.Screen name="Terminal" component={TerminalScreen} />
            <Tab.Screen name="Token" component={TokenScreen} />
            <Tab.Screen name="Voice" component={VoiceScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
          </Tab.Navigator>
        </NavigationContainer>
        <StatusBar style="light" />
      </TVSProvider>
    </SafeAreaProvider>
  );
}
