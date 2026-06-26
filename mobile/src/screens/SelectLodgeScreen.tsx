import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { jwtDecode } from 'jwt-decode';
import api from '../api/client';
import { useAuth } from '../store/useAuth';

export default function SelectLodgeScreen({ route, navigation }: any) {
  const { tempToken } = route.params;
  const [lodges, setLodges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { signIn } = useAuth();

  useEffect(() => {
    fetchLodges();
  }, []);

  const fetchLodges = async () => {
    try {
      const response = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${tempToken}` }
      });
      setLodges(response.data.lodge_associations || []);
    } catch (error) {
      console.error('Error fetching lodges', error);
      Alert.alert('Erro', 'Não foi possível carregar as Lojas.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLodge = async (lodgeId: number) => {
    try {
      setLoading(true);
      const response = await api.post(
        '/auth/select-lodge',
        { lodge_id: lodgeId },
        { headers: { Authorization: `Bearer ${tempToken}` } }
      );

      const finalToken = response.data.access_token;
      let decodedToken: any = {};
      try {
        decodedToken = jwtDecode(finalToken);
      } catch (e) {
        console.error('Failed to decode token', e);
      }

      const user = {
        id: decodedToken.user_id || 0,
        email: decodedToken.sub || '',
        name: decodedToken.name || 'Usuário',
        cim: decodedToken.cim || '',
        role: decodedToken.role || 'Membro',
        lodge_id: lodgeId,
      };

      await signIn(finalToken, user);
    } catch (error) {
      console.error('Error selecting lodge', error);
      Alert.alert('Erro', 'Não foi possível selecionar a Loja.');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-primary-500 px-6 pt-10">
      <View className="items-center mb-8">
        <Text className="text-3xl font-bold text-gray-800 dark:text-white mb-2 text-center">Seleção de Loja</Text>
        <Text className="text-base text-gray-500 dark:text-gray-300 text-center">
          Você possui múltiplos vínculos. Qual loja deseja acessar nesta sessão?
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FFD700" />
      ) : (
        <FlatList
          data={lodges}
          keyExtractor={(item) => item.lodge.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="bg-gray-100 dark:bg-primary-400 p-4 rounded-xl mb-3 border border-gray-200 dark:border-primary-300"
              onPress={() => handleSelectLodge(item.lodge.id)}
            >
              <Text className="text-lg font-bold text-gray-800 dark:text-white">{item.lodge.lodge_name}</Text>
              <Text className="text-sm text-gray-500 dark:text-gray-300">
                Nº {item.lodge.lodge_number} • Status: {item.status}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="text-center text-gray-500 mt-10">Nenhum vínculo encontrado.</Text>
          }
        />
      )}
      <TouchableOpacity 
        className="mt-auto mb-8 p-4 items-center"
        onPress={() => navigation.goBack()}
      >
        <Text className="text-gray-500 dark:text-gray-400">Voltar para o Login</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
