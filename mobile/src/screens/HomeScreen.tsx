import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../store/useAuth';
import { getDashboardStats, DashboardStats } from '../api/dashboardService';

export default function HomeScreen({ navigation }: any) {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#0ea5e9" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        {/* Header Section */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-primary-500 dark:text-primary-400">
            Olá, Irmão {user?.name?.split(' ')[0] || 'Maçom'}
          </Text>
          <Text className="text-gray-500 mt-1 font-medium">
            {stats?.lodge_info?.name || 'Loja'}
          </Text>
        </View>

        {/* Info Cards */}
        <View className="flex-row justify-between mb-8">
          <View className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex-1 mr-2">
            <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Membros</Text>
            <Text className="text-2xl font-bold text-gray-800">{stats?.total_members || 0}</Text>
          </View>
          <View className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex-1 ml-2">
            <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Avisos</Text>
            <Text className="text-2xl font-bold text-gray-800">{stats?.active_notices_count || 0}</Text>
          </View>
        </View>

        {/* Next Session Section */}
        <View className="mb-8">
          <Text className="text-lg font-bold text-gray-800 mb-4">Próxima Sessão</Text>
          {stats?.next_session ? (
            <View className="bg-primary-500 rounded-2xl p-6 shadow-md">
              <Text className="text-accent-500 font-bold mb-2">
                {new Date(stats.next_session.session_date).toLocaleDateString('pt-BR')} às {stats.next_session.start_time || '20:00'}
              </Text>
              <Text className="text-white text-xl font-bold">{stats.next_session.title}</Text>
            </View>
          ) : (
            <View className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <Text className="text-gray-500 text-center">Nenhuma sessão agendada.</Text>
            </View>
          )}
        </View>

        {/* Fazer Check-In em Sessão Section */}
        <View className="mb-8">
          <Text className="text-lg font-bold text-gray-800 mb-4">Fazer Check-In em Sessão</Text>
          <View className="flex-row justify-between">
            <TouchableOpacity 
              className="bg-white border border-primary-500 p-4 rounded-2xl flex-1 mr-2 items-center justify-center shadow-sm"
              onPress={() => navigation.navigate('Meu QR Code')}
            >
              <Text className="text-primary-500 font-bold text-center">Apresentar QR Code</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="bg-accent-500 p-4 rounded-2xl flex-1 ml-2 items-center justify-center shadow-sm"
              onPress={() => navigation.navigate('Escanear Loja')}
            >
              <Text className="text-white font-bold text-center">Ler QR Code</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          className="mt-4 py-4 rounded-xl items-center"
          onPress={signOut}
        >
          <Text className="text-red-400 font-bold">Sair da Conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
