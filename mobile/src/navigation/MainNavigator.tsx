import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import HomeScreen from '../screens/HomeScreen';
import AbsencesScreen from '../screens/AbsencesScreen';
import QRScannerScreen from '../screens/QRScannerScreen';
import StatsScreen from '../screens/StatsScreen';
import MyQRCodeScreen from '../screens/MyQRCodeScreen';

const Drawer = createDrawerNavigator();

export default function MainNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1a202c' }, // primary-500
        headerTintColor: '#fff',
        drawerStyle: { backgroundColor: '#f3f4f6' }, // gray-100
      }}
    >
      <Drawer.Screen name="Início" component={HomeScreen} />
      <Drawer.Screen name="Meu QR Code" component={MyQRCodeScreen} />
      <Drawer.Screen name="Meu Desempenho" component={StatsScreen} />
      <Drawer.Screen name="Escanear Loja" component={QRScannerScreen} />
      <Drawer.Screen name="Faltas" component={AbsencesScreen} />
    </Drawer.Navigator>
  );
}
