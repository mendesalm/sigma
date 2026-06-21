import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../api/client';
import { useAuth } from '../store/useAuth';

export default function QRScannerScreen({ navigation }: any) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const getPermissions = async () => {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(cameraStatus === 'granted');

      // Request location permissions upfront as well
      await Location.requestForegroundPermissionsAsync();
    };

    getPermissions();
  }, []);

  const handleBarCodeScanned = async ({ type, data }: { type: string, data: string }) => {
    setScanned(true);

    try {
      // Data expected to be lodge_id or a secure JSON payload identifying the Lodge session
      const qrData = JSON.parse(data);
      if (!qrData.lodge_id) {
        throw new Error('QR Code inválido');
      }

      // Check Location
      let location = await Location.getCurrentPositionAsync({});
      
      const payload = {
        user_id: user?.id,
        lodge_id: qrData.lodge_id,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      await api.post('/check-in/qr', payload);
      Alert.alert('Sucesso', 'Check-in realizado com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
      
    } catch (error: any) {
      console.error(error);
      Alert.alert(
        'Erro', 
        error.message === 'QR Code inválido' ? error.message : 'Falha ao registrar check-in. Verifique sua localização e tente novamente.',
        [{ text: 'Tentar Novamente', onPress: () => setScanned(false) }]
      );
    }
  };

  if (hasPermission === null) {
    return <View className="flex-1 items-center justify-center bg-black"><Text className="text-white">Solicitando permissão de câmera...</Text></View>;
  }
  if (hasPermission === false) {
    return (
      <View className="flex-1 items-center justify-center bg-black p-6">
        <Text className="text-white text-center mb-4">Sem acesso à câmera</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} className="bg-blue-600 px-6 py-3 rounded-lg">
          <Text className="text-white font-bold">Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1">
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
        />
        <View className="absolute inset-x-0 top-10 items-center">
          <Text className="text-white font-bold text-lg bg-black/50 px-4 py-2 rounded-full overflow-hidden">
            Aponte para o QR Code da Loja
          </Text>
        </View>
        <View className="absolute inset-x-0 bottom-10 items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="bg-red-600 px-8 py-4 rounded-full">
            <Text className="text-white font-bold">Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
