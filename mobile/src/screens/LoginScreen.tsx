import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { jwtDecode } from 'jwt-decode';
import api from '../api/client';
import { useAuth } from '../store/useAuth';

export default function LoginScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await api.post('/auth/login', formData.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const token = response.data.access_token;
      
      let decodedToken: any = {};
      try {
        decodedToken = jwtDecode(token);
      } catch (e) {
        console.error('Failed to decode token', e);
      }
      
      const user = {
        id: decodedToken.user_id || 0,
        email: decodedToken.sub || username,
        name: decodedToken.name || 'Usuário',
        cim: username,
        role: decodedToken.role || 'Membro',
      };

      await signIn(token, user);
    } catch (error: any) {
      console.error('Login error', error.response?.data || error.message);
      Alert.alert('Erro de Autenticação', 'Usuário ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-primary-500 justify-center px-6">
      <View className="items-center mb-10">
        <Text className="text-4xl font-bold text-primary-500 dark:text-accent-500">
          Σ Maçom
        </Text>
        <Text className="text-gray-500 mt-2 text-center">
          Acesse sua conta para gerar seu QR Code e visualizar seu perfil
        </Text>
      </View>

      <View className="space-y-4">
        <View>
          <Text className="text-gray-700 dark:text-gray-300 font-medium mb-1">CIM ou E-mail</Text>
          <TextInput
            className="w-full bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-gray-900 dark:text-white border border-transparent focus:border-blue-500"
            placeholder="Digite seu CIM"
            placeholderTextColor="#9ca3af"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View>
          <Text className="text-gray-700 dark:text-gray-300 font-medium mb-1 mt-4">Senha</Text>
          <TextInput
            className="w-full bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-gray-900 dark:text-white border border-transparent focus:border-blue-500"
            placeholder="Sua senha secreta"
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity 
          className="w-full bg-blue-600 rounded-lg p-4 items-center mt-6 flex-row justify-center"
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-lg">Entrar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          className="w-full p-4 items-center mt-2 flex-row justify-center"
          onPress={() => navigation.navigate('Register')}
          disabled={loading}
        >
          <Text className="text-blue-600 dark:text-blue-400 font-medium text-lg">Não tem uma conta? Cadastre-se</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
