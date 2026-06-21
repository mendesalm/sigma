import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../api/client';

export default function RegisterScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    cim: '',
    full_name: '',
    degree: 'Master', // default
    obedience_name: '',
    lodge_number: '',
    lodge_name: '',
    lodge_city: '',
  });

  const handleRegister = async () => {
    if (!formData.email || !formData.password || !formData.cim || !formData.full_name || !formData.obedience_name || !formData.lodge_number || !formData.lodge_name || !formData.lodge_city) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        lodge_number: parseInt(formData.lodge_number, 10),
      };
      await api.post('/auth/register', payload);
      
      Alert.alert('Sucesso', 'Cadastro realizado com sucesso! Você já pode fazer login.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (err: any) {
      console.error(err);
      Alert.alert('Erro no Cadastro', err.response?.data?.detail || 'Não foi possível realizar o cadastro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-primary-500">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <View className="mb-8">
          <Text className="text-3xl font-bold text-primary-500 dark:text-accent-500 text-center mb-2">Criar Conta</Text>
          <Text className="text-gray-500 text-center">Cadastre-se para acessar o sistema Sigma</Text>
        </View>

        <View className="space-y-4">
          <Text className="text-lg font-bold text-gray-800 dark:text-white mt-4">Dados Pessoais</Text>
          <TextInput
            placeholder="Nome Completo"
            placeholderTextColor="#9ca3af"
            value={formData.full_name}
            onChangeText={(text) => setFormData({ ...formData, full_name: text })}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-800"
          />
          <TextInput
            placeholder="E-mail"
            placeholderTextColor="#9ca3af"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            autoCapitalize="none"
            keyboardType="email-address"
            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-800"
          />
          <TextInput
            placeholder="Senha"
            placeholderTextColor="#9ca3af"
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            secureTextEntry
            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-800"
          />
          <TextInput
            placeholder="CIM"
            placeholderTextColor="#9ca3af"
            value={formData.cim}
            onChangeText={(text) => setFormData({ ...formData, cim: text })}
            keyboardType="numeric"
            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-800"
          />

          <Text className="text-lg font-bold text-gray-800 dark:text-white mt-6">Dados da Loja & Obediência</Text>
          <TextInput
            placeholder="Obediência (Ex: GOB, CMSB)"
            placeholderTextColor="#9ca3af"
            value={formData.obedience_name}
            onChangeText={(text) => setFormData({ ...formData, obedience_name: text })}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-800"
          />
          <TextInput
            placeholder="Número da Loja"
            placeholderTextColor="#9ca3af"
            value={formData.lodge_number}
            onChangeText={(text) => setFormData({ ...formData, lodge_number: text })}
            keyboardType="numeric"
            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-800"
          />
          <TextInput
            placeholder="Nome da Loja"
            placeholderTextColor="#9ca3af"
            value={formData.lodge_name}
            onChangeText={(text) => setFormData({ ...formData, lodge_name: text })}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-800"
          />
          <TextInput
            placeholder="Oriente / Cidade"
            placeholderTextColor="#9ca3af"
            value={formData.lodge_city}
            onChangeText={(text) => setFormData({ ...formData, lodge_city: text })}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-800"
          />

          <TouchableOpacity
            className="w-full bg-primary-500 dark:bg-accent-500 rounded-lg p-4 items-center mt-6 shadow-sm"
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white dark:text-primary-900 font-bold text-lg">Concluir Cadastro</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            className="w-full p-4 items-center mt-2"
            onPress={() => navigation.navigate('Login')}
            disabled={loading}
          >
            <Text className="text-primary-500 dark:text-accent-500 font-medium">
              Já tem uma conta? Faça Login
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
