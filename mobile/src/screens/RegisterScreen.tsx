import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../api/client';

export default function RegisterScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  // Step 1: Potência Principal
  const [obediences, setObediences] = useState<{id: number, name: string}[]>([]);
  const [selectedObedienceId, setSelectedObedienceId] = useState<string>('');
  const [customObedienceName, setCustomObedienceName] = useState('');

  // Step 1.5: Subpotência
  const [subObediences, setSubObediences] = useState<{id: number, name: string}[]>([]);
  const [selectedSubObedienceId, setSelectedSubObedienceId] = useState<string>('');
  const [isSubpotencyStepActive, setIsSubpotencyStepActive] = useState(false);

  // Step 2: Loja (Busca)
  const [searchQuery, setSearchQuery] = useState('');
  const [lodges, setLodges] = useState<{id: number, lodge_name: string, lodge_number: string}[]>([]);
  const [selectedLodgeId, setSelectedLodgeId] = useState<string>('');
  const [customLodgeName, setCustomLodgeName] = useState('');
  const [customLodgeNumber, setCustomLodgeNumber] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Step 3: CIM
  const [cim, setCim] = useState('');
  
  // Step 4: Status and Data
  const [status, setStatus] = useState<'PRE_REGISTERED' | 'NOT_FOUND' | null>(null);
  const [verifyMessage, setVerifyMessage] = useState('');
  const [emailHint, setEmailHint] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    degree: '', 
    phone: '',
  });

  useEffect(() => {
    if (step === 1 && obediences.length === 0) {
      fetchTopLevelObediences();
    }
  }, [step]);

  const fetchTopLevelObediences = async () => {
    setLoading(true);
    try {
      const response = await api.get('/obediences?only_top_level=true');
      setObediences(response.data);
    } catch (error) {
      Alert.alert('Erro', 'Erro ao buscar potências');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubObediences = async (parentId: number) => {
    setLoading(true);
    try {
      const response = await api.get(`/obediences?parent_id=${parentId}`);
      if (response.data && response.data.length > 0) {
        setSubObediences(response.data);
        setIsSubpotencyStepActive(true);
      } else {
        setSubObediences([]);
        setIsSubpotencyStepActive(false);
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao buscar subpotências');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectObedience = (id: string) => {
    setSelectedObedienceId(id);
    if (id !== 'OTHER') {
      fetchSubObediences(parseInt(id));
    } else {
      setSubObediences([]);
      setIsSubpotencyStepActive(false);
      setSelectedSubObedienceId('');
    }
  };

  const handleSelectSubObedience = (id: string) => {
    setSelectedSubObedienceId(id);
  };

  const handleNextStep1 = () => {
    if (!selectedObedienceId) {
       Alert.alert('Erro', 'Selecione a Potência');
       return;
    }
    if (selectedObedienceId === 'OTHER' && !customObedienceName) {
      Alert.alert('Erro', 'Por favor, informe o nome da sua Potência.');
      return;
    }
    if (isSubpotencyStepActive && selectedObedienceId !== 'OTHER' && !selectedSubObedienceId) {
      Alert.alert('Erro', 'Selecione uma Subpotência ou marque como Nenhuma.');
      return;
    }
    setStep(2);
  };

  const searchLodges = async () => {
    if (!searchQuery) {
      Alert.alert('Aviso', 'Digite o nome ou número para buscar');
      return;
    }
    setLoading(true);
    setHasSearched(true);
    setSelectedLodgeId('');
    try {
      const targetObedienceId = selectedSubObedienceId && selectedSubObedienceId !== 'OTHER' 
        ? selectedSubObedienceId 
        : selectedObedienceId;
        
      let endpoint = `/lodges?search=${searchQuery}`;
      if (targetObedienceId && targetObedienceId !== 'OTHER') {
        endpoint += `&obedience_id=${targetObedienceId}`;
      }
      
      const response = await api.get(endpoint);
      setLodges(response.data);
      if (response.data.length === 1) {
        setSelectedLodgeId(String(response.data[0].id));
        setStep(3); // Auto advance to CIM
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao buscar lojas');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLodge = (id: string) => {
    setSelectedLodgeId(id);
    setStep(3); // Auto advance to CIM
  };

  const handleNextStep2 = () => {
    if (!selectedLodgeId && selectedObedienceId !== 'OTHER') {
       Alert.alert('Erro', 'Selecione ou busque uma Loja');
       return;
    }
    if ((selectedLodgeId === 'OTHER' || selectedObedienceId === 'OTHER') && !customLodgeName) {
      Alert.alert('Erro', 'Por favor, informe o nome da sua Loja.');
      return;
    }
    setStep(3);
  };

  const handleVerifyCim = async () => {
    if (!cim) {
      Alert.alert('Erro', 'Por favor, informe seu CIM.');
      return;
    }
    try {
      setLoading(true);
      const obedienceIdToSubmit = selectedSubObedienceId && selectedSubObedienceId !== 'OTHER' ? parseInt(selectedSubObedienceId) : 
                                  selectedObedienceId !== 'OTHER' ? parseInt(selectedObedienceId) : null;
      const payload = {
        cim,
        obedience_id: obedienceIdToSubmit,
        lodge_id: selectedLodgeId && selectedLodgeId !== 'OTHER' ? parseInt(selectedLodgeId) : null,
      };
      const response = await api.post('/auth/first-access/verify', payload);
      setStatus(response.data.status);
      setVerifyMessage(response.data.message);
      setEmailHint(response.data.email_hint || '');
      setStep(4);
    } catch (err: any) {
      Alert.alert('Erro', 'Não foi possível verificar o CIM.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    const obedienceIdToSubmit = selectedSubObedienceId && selectedSubObedienceId !== 'OTHER' ? parseInt(selectedSubObedienceId) : 
                                selectedObedienceId !== 'OTHER' ? parseInt(selectedObedienceId) : null;

    if (status === 'PRE_REGISTERED') {
      if (!formData.email) {
        Alert.alert('Erro', 'Informe o e-mail cadastrado.');
        return;
      }
      try {
        setLoading(true);
        await api.post('/auth/first-access/confirm-pre-registration', {
          cim,
          email: formData.email,
          obedience_id: obedienceIdToSubmit,
          lodge_id: selectedLodgeId !== 'OTHER' ? parseInt(selectedLodgeId) : null,
        });
        Alert.alert('Sucesso', 'Senha enviada para o seu e-mail!', [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      } catch (err: any) {
        Alert.alert('Erro', err.response?.data?.detail || 'Erro ao processar solicitação.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!formData.email || !formData.full_name || !formData.degree) {
        Alert.alert('Erro', 'Preencha os campos obrigatórios.');
        return;
      }
      try {
        setLoading(true);
        await api.post('/auth/first-access/register', {
          cim,
          full_name: formData.full_name,
          email: formData.email,
          degree: formData.degree,
          phone: formData.phone,
          obedience_id: obedienceIdToSubmit,
          obedience_name: selectedObedienceId === 'OTHER' ? customObedienceName : null,
          lodge_id: selectedLodgeId !== 'OTHER' ? parseInt(selectedLodgeId) : null,
          lodge_name: (selectedLodgeId === 'OTHER' || selectedObedienceId === 'OTHER') ? customLodgeName : null,
          lodge_number: customLodgeNumber ? parseInt(customLodgeNumber, 10) : null
        });
        Alert.alert('Sucesso', 'Solicitação enviada com sucesso!', [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      } catch (err: any) {
        Alert.alert('Erro', err.response?.data?.detail || 'Não foi possível realizar o cadastro.');
      } finally {
        setLoading(false);
      }
    }
  };

  const getSubtitle = () => {
    switch (step) {
      case 1: return 'Selecione sua Potência';
      case 2: return 'Busque sua Loja';
      case 3: return 'Informe seu CIM';
      case 4: return verifyMessage;
      default: return '';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-primary-500">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <View className="mb-6">
          <Text className="text-3xl font-bold text-primary-500 dark:text-accent-500 text-center mb-2">Primeiro Acesso</Text>
          <Text className="text-gray-500 text-center">{getSubtitle()}</Text>
        </View>

        {/* Step 1 */}
        {step === 1 && (
          <View className="space-y-4">
            {loading && obediences.length === 0 ? (
              <ActivityIndicator size="large" color="#0ea5e9" />
            ) : (
              <>
                <Text className="font-bold text-gray-700 mb-2">Potência Principal</Text>
                {obediences.map((ob) => (
                  <TouchableOpacity
                    key={ob.id}
                    className={`w-full bg-gray-50 border ${selectedObedienceId === String(ob.id) ? 'border-primary-500' : 'border-gray-200'} rounded-lg p-4 mb-3`}
                    onPress={() => handleSelectObedience(String(ob.id))}
                  >
                    <Text className="text-gray-800 text-lg font-medium">{ob.name}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  className={`w-full bg-gray-50 border ${selectedObedienceId === 'OTHER' ? 'border-primary-500' : 'border-gray-200'} rounded-lg p-4 mb-3`}
                  onPress={() => handleSelectObedience('OTHER')}
                >
                  <Text className="text-gray-800 text-lg font-medium">Outra / Não listada</Text>
                </TouchableOpacity>

                {selectedObedienceId === 'OTHER' && (
                  <View className="mt-2 space-y-4">
                    <TextInput
                      placeholder="Nome da sua Potência"
                      placeholderTextColor="#9ca3af"
                      value={customObedienceName}
                      onChangeText={setCustomObedienceName}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-800"
                    />
                    <Text className="text-xs text-gray-500 text-center mb-2">Seu cadastro passará por moderação.</Text>
                  </View>
                )}

                {isSubpotencyStepActive && selectedObedienceId !== 'OTHER' && (
                  <View className="mt-4 pt-4 border-t border-gray-200">
                    <Text className="font-bold text-gray-700 mb-3">Subpotência (Estadual/Regional)</Text>
                    {subObediences.map((sub) => (
                      <TouchableOpacity
                        key={sub.id}
                        className={`w-full bg-gray-50 border ${selectedSubObedienceId === String(sub.id) ? 'border-primary-500' : 'border-gray-200'} rounded-lg p-4 mb-3`}
                        onPress={() => handleSelectSubObedience(String(sub.id))}
                      >
                        <Text className="text-gray-800 text-lg font-medium">{sub.name}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      className={`w-full bg-gray-50 border ${selectedSubObedienceId === 'OTHER' ? 'border-primary-500' : 'border-gray-200'} rounded-lg p-4 mb-3`}
                      onPress={() => handleSelectSubObedience('OTHER')}
                    >
                      <Text className="text-gray-800 text-lg font-medium">Não se aplica / Nenhuma</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity
                  className="w-full bg-primary-500 dark:bg-accent-500 rounded-lg p-4 items-center shadow-sm mt-4"
                  onPress={handleNextStep1}
                >
                  <Text className="text-white font-bold text-lg">Avançar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <View className="space-y-4">
            {selectedObedienceId === 'OTHER' ? (
              <View className="space-y-4">
                <TextInput
                  placeholder="Nome da Loja"
                  placeholderTextColor="#9ca3af"
                  value={customLodgeName}
                  onChangeText={setCustomLodgeName}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-800 mb-3"
                />
                <TextInput
                  placeholder="Nº da Loja"
                  placeholderTextColor="#9ca3af"
                  value={customLodgeNumber}
                  onChangeText={setCustomLodgeNumber}
                  keyboardType="numeric"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-800 mb-3"
                />
                <TouchableOpacity
                  className="w-full bg-primary-500 dark:bg-accent-500 rounded-lg p-4 items-center shadow-sm mt-4"
                  onPress={handleNextStep2}
                >
                  <Text className="text-white font-bold text-lg">Avançar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View className="flex-row gap-2 mb-4">
                  <TextInput
                    placeholder="Nome ou Número..."
                    placeholderTextColor="#9ca3af"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-800"
                  />
                  <TouchableOpacity 
                    onPress={searchLodges}
                    disabled={loading || !searchQuery}
                    className="bg-gray-200 rounded-lg justify-center px-4 border border-gray-300"
                  >
                    {loading ? <ActivityIndicator color="#0ea5e9" /> : <Text className="text-gray-700 font-bold">Buscar</Text>}
                  </TouchableOpacity>
                </View>
                
                {hasSearched && (
                  <View className="mt-2">
                    <Text className="text-gray-600 mb-2 font-medium">Resultados:</Text>
                    {lodges.length > 0 ? lodges.map((lg) => (
                      <TouchableOpacity
                        key={lg.id}
                        className={`w-full bg-gray-50 border ${selectedLodgeId === String(lg.id) ? 'border-primary-500' : 'border-gray-200'} rounded-lg p-4 mb-3`}
                        onPress={() => handleSelectLodge(String(lg.id))}
                      >
                        <Text className="text-gray-800 text-lg font-medium">{lg.lodge_number ? `${lg.lodge_name} nº ${lg.lodge_number}` : lg.lodge_name}</Text>
                      </TouchableOpacity>
                    )) : (
                      <>
                        <Text className="text-red-500 mb-4">Nenhuma loja encontrada para a busca.</Text>
                        <TouchableOpacity
                          className={`w-full bg-gray-50 border ${selectedLodgeId === 'OTHER' ? 'border-primary-500' : 'border-gray-200'} rounded-lg p-4 mb-3`}
                          onPress={() => setSelectedLodgeId('OTHER')}
                        >
                          <Text className="text-gray-800 text-lg font-medium">Minha Loja não foi encontrada</Text>
                        </TouchableOpacity>
                      </>
                    )}
                    
                    {selectedLodgeId === 'OTHER' && (
                      <View className="mt-2 space-y-4">
                        <TextInput
                          placeholder="Nome da Loja"
                          placeholderTextColor="#9ca3af"
                          value={customLodgeName}
                          onChangeText={setCustomLodgeName}
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-800 mb-3"
                        />
                        <TextInput
                          placeholder="Nº da Loja"
                          placeholderTextColor="#9ca3af"
                          value={customLodgeNumber}
                          onChangeText={setCustomLodgeNumber}
                          keyboardType="numeric"
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-800 mb-3"
                        />
                        <Text className="text-xs text-gray-500 text-center mb-2">Sua solicitação passará por moderação.</Text>
                      </View>
                    )}
                    
                    <TouchableOpacity
                      className="w-full bg-primary-500 dark:bg-accent-500 rounded-lg p-4 items-center shadow-sm mt-4"
                      onPress={handleNextStep2}
                    >
                      <Text className="text-white font-bold text-lg">Avançar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <View className="space-y-4 mt-4">
            <TextInput
              placeholder="Seu CIM"
              placeholderTextColor="#9ca3af"
              value={cim}
              onChangeText={setCim}
              keyboardType="numeric"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-800"
            />
            <TouchableOpacity
              className="w-full bg-primary-500 dark:bg-accent-500 rounded-lg p-4 items-center mt-6 shadow-sm"
              onPress={handleVerifyCim}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Avançar</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Step 4: Pre-Registered */}
        {step === 4 && status === 'PRE_REGISTERED' && (
          <View className="space-y-4 mt-4">
            {!!emailHint && (
              <Text className="text-gray-500 text-center mb-4">Dica de e-mail: {emailHint}</Text>
            )}
            <TextInput
              placeholder="Confirme seu e-mail"
              placeholderTextColor="#9ca3af"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              autoCapitalize="none"
              keyboardType="email-address"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-800"
            />
            <TouchableOpacity
              className="w-full bg-primary-500 dark:bg-accent-500 rounded-lg p-4 items-center mt-6 shadow-sm"
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Receber Senha</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Step 4: Not Found (Registration) */}
        {step === 4 && status === 'NOT_FOUND' && (
          <View className="space-y-4 mt-4">
            <TextInput
              placeholder="Nome Completo"
              placeholderTextColor="#9ca3af"
              value={formData.full_name}
              onChangeText={(text) => setFormData({ ...formData, full_name: text })}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-800 mb-3"
            />
            <TextInput
              placeholder="E-mail"
              placeholderTextColor="#9ca3af"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              autoCapitalize="none"
              keyboardType="email-address"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-800 mb-3"
            />
            <TextInput
              placeholder="Telefone"
              placeholderTextColor="#9ca3af"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-800 mb-3"
            />
            <TextInput
              placeholder="Grau (Aprendiz, Companheiro, Mestre...)"
              placeholderTextColor="#9ca3af"
              value={formData.degree}
              onChangeText={(text) => setFormData({ ...formData, degree: text })}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-800 mb-3"
            />
            
            <TouchableOpacity
              className="w-full bg-primary-500 dark:bg-accent-500 rounded-lg p-4 items-center mt-6 shadow-sm"
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Enviar Solicitação</Text>}
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity 
          className="w-full p-4 items-center mt-6"
          onPress={() => {
            if (step > 1) {
              setStep(step - 1);
            } else {
              navigation.navigate('Login');
            }
          }}
          disabled={loading}
        >
          <Text className="text-primary-500 dark:text-accent-500 font-medium">
            {step > 1 ? 'Voltar' : 'Já tem uma senha? Faça Login'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
