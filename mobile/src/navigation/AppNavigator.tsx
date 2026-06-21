import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../store/useAuth';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { View, ActivityIndicator } from 'react-native';

export default function AppNavigator() {
  const { token, isLoading, hydrate } = useAuth();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-primary-500">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {token ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
