import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../api/client';
import { useAuth } from '../store/useAuth';

export default function TenantOnboardingScreen({ navigation }: any) {
  const [obediences, setObediences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { setTenantPotencia } = useAuth();

  useEffect(() => {
    fetchObediences();
  }, []);

  const fetchObediences = async () => {
    try {
      const response = await api.get('/auth/obediences');
      setObediences(response.data);
    } catch (error) {
      console.error('Error fetching obediences', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPotencia = async (id: number) => {
    await setTenantPotencia(id.toString());
    navigation.replace('Login');
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-primary-500 justify-center px-6 pt-10">
      <View className="items-center mb-8">
        <Text className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Bem-vindo ao Sigma</Text>
        <Text className="text-base text-gray-500 dark:text-gray-300 text-center">
          Para acessar sua conta, por favor identifique a qual Potência (Obediência) você pertence.
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FFD700" />
      ) : (
        <FlatList
          data={obediences}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="bg-gray-100 dark:bg-primary-400 p-4 rounded-xl mb-3 flex-row items-center border border-gray-200 dark:border-primary-300"
              onPress={() => handleSelectPotencia(item.id)}
            >
              <View className="flex-1">
                <Text className="text-lg font-bold text-gray-800 dark:text-white">{item.name}</Text>
                <Text className="text-sm text-gray-500 dark:text-gray-300 uppercase mt-1">{item.type}</Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="text-center text-gray-500 mt-10">Nenhuma potência encontrada.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}
