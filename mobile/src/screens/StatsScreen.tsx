import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../api/client';

export default function StatsScreen() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/analytics/attendance/member');
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-primary-500">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-primary-500 px-6 pt-8">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text className="text-2xl font-bold text-primary-500 dark:text-accent-500 mb-6">
          Meu Desempenho
        </Text>

        {stats ? (
          <View className="space-y-6">
            <View className="bg-blue-50 dark:bg-gray-800 p-6 rounded-2xl border border-blue-100 dark:border-gray-700">
              <Text className="text-gray-500 dark:text-gray-400 font-medium">Taxa de Presença</Text>
              <Text className="text-4xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                {(stats.attendance_rate * 100).toFixed(1)}%
              </Text>
            </View>

            <View className="flex-row justify-between">
              <View className="bg-green-50 dark:bg-gray-800 p-4 rounded-2xl flex-1 mr-2 border border-green-100 dark:border-gray-700">
                <Text className="text-gray-500 dark:text-gray-400">Presenças</Text>
                <Text className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.total_present}</Text>
              </View>
              <View className="bg-red-50 dark:bg-gray-800 p-4 rounded-2xl flex-1 ml-2 border border-red-100 dark:border-gray-700">
                <Text className="text-gray-500 dark:text-gray-400">Faltas</Text>
                <Text className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.total_absent}</Text>
              </View>
            </View>
            
            {stats.achievements && stats.achievements.length > 0 && (
              <View className="mt-4">
                <Text className="text-lg font-bold text-primary-500 dark:text-accent-500 mb-3">Conquistas</Text>
                {stats.achievements.map((ach: any, idx: number) => (
                  <View key={idx} className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl mb-2 flex-row items-center">
                    <Text className="text-2xl mr-3">{ach.icon || '🏆'}</Text>
                    <View>
                      <Text className="font-bold text-gray-900 dark:text-white">{ach.title}</Text>
                      <Text className="text-gray-500 text-sm">{ach.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : (
          <Text className="text-gray-500 text-center mt-10">Não foi possível carregar as estatísticas.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
