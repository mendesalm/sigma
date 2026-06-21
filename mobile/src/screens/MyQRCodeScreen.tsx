import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../store/useAuth';

export default function MyQRCodeScreen({ navigation }: any) {
  const { user, token } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-primary-500 px-6 items-center justify-center">
      <View className="items-center mb-8">
        <Text className="text-2xl font-bold text-primary-500 dark:text-accent-500 text-center">
          Meu QR Code
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 mt-2 text-center">
          Apresente este código no Totem da Loja para registrar sua presença.
        </Text>
      </View>

      <View className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 items-center justify-center mb-10">
        {token ? (
          <QRCode
            value={token}
            size={250}
            color="#1a202c"
            backgroundColor="white"
          />
        ) : (
          <Text className="text-gray-500">Token não disponível</Text>
        )}
      </View>

      <TouchableOpacity 
        className="w-full bg-primary-500 dark:bg-accent-500 rounded-lg p-4 items-center"
        onPress={() => navigation.goBack()}
      >
        <Text className="text-white dark:text-primary-900 font-bold text-lg">Voltar</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
