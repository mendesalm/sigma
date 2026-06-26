import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import TenantOnboardingScreen from '../screens/TenantOnboardingScreen';
import SelectLodgeScreen from '../screens/SelectLodgeScreen';
import FirstAccessScreen from '../screens/FirstAccessScreen';
import { useAuth } from '../store/useAuth';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  const { tenantPotencia } = useAuth();

  return (
    <Stack.Navigator 
      screenOptions={{ headerShown: false }}
      initialRouteName={tenantPotencia ? "Login" : "TenantOnboarding"}
    >
      <Stack.Screen name="TenantOnboarding" component={TenantOnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="SelectLodge" component={SelectLodgeScreen} />
      <Stack.Screen name="FirstAccess" component={FirstAccessScreen} />
    </Stack.Navigator>
  );
}
