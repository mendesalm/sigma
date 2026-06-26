import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../api/client';
import { useAuth } from '../store/useAuth';

export default function FirstAccessScreen({ navigation }: any) {
  const [cim, setCim] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { tenantPotencia } = useAuth();

  const handleSubmit = async () => {
    if (!cim || !birthDate || !newEmail) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }

    setLoading(true);
    try {
      await api.post(
        '/auth/first-access/update-email',
        {
          cim,
          birth_date: birthDate,
          new_email: newEmail,
        },
        {
          headers: {
            ...(tenantPotencia ? { 'X-Tenant-Potencia': tenantPotencia } : {})
          }
        }
      );
      Alert.alert(
        'Sucesso', 
        'E-mail atualizado com sucesso. Enviamos um link de redefinição de senha para o seu novo e-mail.',
        [{ text: 'OK', onPress: () => navigation.replace('Login') }]
      );
    } catch (error: any) {
      console.error('Error on first access', error);
      Alert.alert(
        'Erro na Validação',
        error.response?.data?.detail || 'Os dados informados não conferem com os registros. Procure o secretário da sua Loja.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-primary-500 justify-center px-6">
      <View className="items-center mb-8">
        <Text className="text-3xl font-bold text-gray-800 dark:text-white mb-2 text-center">Primeiro Acesso</Text>
        <Text className="text-base text-gray-500 dark:text-gray-300 text-center">
          Atualize seu e-mail validando seus dados de segurança.
        </Text>
      </View>

      <View className="w-full space-y-4">
        <View>
          <Text className="text-gray-700 dark:text-gray-200 mb-1 ml-1 font-medium">CIM</Text>
          <TextInput
            className="w-full bg-gray-100 dark:bg-primary-400 p-4 rounded-xl text-gray-800 dark:text-white"
            placeholder="Seu CIM"
            placeholderTextColor="#9ca3af"
            value={cim}
            onChangeText={setCim}
            keyboardType="numeric"
          />
        </View>

        <View className="mt-4">
          <Text className="text-gray-700 dark:text-gray-200 mb-1 ml-1 font-medium">Data de Nascimento</Text>
          <TextInput
            className="w-full bg-gray-100 dark:bg-primary-400 p-4 rounded-xl text-gray-800 dark:text-white"
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9ca3af"
            value={birthDate}
            onChangeText={setBirthDate}
          />
        </View>

        <View className="mt-4">
          <Text className="text-gray-700 dark:text-gray-200 mb-1 ml-1 font-medium">Novo E-mail</Text>
          <TextInput
            className="w-full bg-gray-100 dark:bg-primary-400 p-4 rounded-xl text-gray-800 dark:text-white"
            placeholder="Seu novo e-mail de acesso"
            placeholderTextColor="#9ca3af"
            value={newEmail}
            onChangeText={setNewEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity 
          className="w-full bg-primary-600 p-4 rounded-xl items-center mt-8 shadow-md shadow-primary-600/30"
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-center text-lg">Validar e Atualizar E-mail</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          className="w-full p-4 items-center mt-2"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-gray-500 dark:text-gray-400 font-medium">Voltar para o Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
