import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import SchedulesScreen from './src/screens/SchedulesScreen';
import SensorsScreen from './src/screens/SensorsScreen';
import LogsScreen from './src/screens/LogsScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Dashboard: '🏠',
  Schedules: '⏰',
  Sensors: '📊',
  Logs: '📋',
};

const TAB_LABELS = {
  Dashboard: 'Ana Sayfa',
  Schedules: 'Zamanlayıcı',
  Sensors: 'Sensörler',
  Logs: 'Loglar',
};

function MainApp() {
  const { token, logout } = useAuth();

  if (!token) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#0F1923" />
        <LoginScreen />
      </>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0F1923" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: styles.tabBar,
            tabBarActiveTintColor: '#4CAF50',
            tabBarInactiveTintColor: '#556677',
            tabBarLabel: TAB_LABELS[route.name],
            tabBarLabelStyle: styles.tabLabel,
            tabBarIcon: ({ focused }) => (
              <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>
                {TAB_ICONS[route.name]}
              </Text>
            ),
          })}
        >
          <Tab.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{
              headerShown: true,
              headerStyle: { backgroundColor: '#1A2733' },
              headerTintColor: '#fff',
              headerTitle: 'Ana Sayfa',
              headerRight: () => (
                <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                  <Text style={styles.logoutText}>Çıkış</Text>
                </TouchableOpacity>
              ),
            }}
          />
          <Tab.Screen name="Schedules" component={SchedulesScreen} />
          <Tab.Screen name="Sensors" component={SensorsScreen} />
          <Tab.Screen name="Logs" component={LogsScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#1A2733',
    borderTopColor: '#2A3A4A',
    borderTopWidth: 1,
    paddingTop: 6,
    paddingBottom: 8,
    height: 60,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  tabIcon: {
    fontSize: 20,
  },
  tabIconActive: {
    fontSize: 22,
  },
  logoutBtn: {
    marginRight: 16,
  },
  logoutText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '500',
  },
});
