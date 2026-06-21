import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AbsencesScreen() {
  const [justification, setJustification] = useState('');

  const submitJustification = () => {
    if (!justification) {
      Alert.alert('Erro', 'Por favor, escreva sua justificativa.');
      return;
    }
    // Integrate with API: POST /absences/{session_id}/justifications
    Alert.alert('Sucesso', 'Justificativa enviada para análise do Chanceler.');
    setJustification('');
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-primary-500 px-6 pt-8">
      <Text className="text-2xl font-bold text-primary-500 dark:text-accent-500 mb-2">
        Justificar Falta
      </Text>
      <Text className="text-gray-500 dark:text-gray-400 mb-6">
        Caso não possa comparecer à sessão de hoje, envie sua justificativa ao Chanceler da sua Loja.
      </Text>

      <View className="space-y-4 flex-1">
        <TextInput
          className="w-full bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-gray-900 dark:text-white border border-transparent focus:border-blue-500 min-h-[120px]"
          placeholder="Escreva o motivo da sua ausência..."
          placeholderTextColor="#9ca3af"
          value={justification}
          onChangeText={setJustification}
          multiline
          textAlignVertical="top"
        />

        <TouchableOpacity 
          className="w-full bg-blue-600 rounded-lg p-4 items-center mt-4"
          onPress={submitJustification}
        >
          <Text className="text-white font-bold text-lg">Enviar Justificativa</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
