import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useCallback, useState } from 'react';
import { SyncService } from './src/SyncService';
import { PasswordGenerator } from './src/PasswordGenerator';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [vaultData, setVaultData] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <TouchableOpacity style={styles.item}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.username}</Text>
    </TouchableOpacity>
  ), []);

  const handleUnlock = async () => {
    if (masterPassword.length > 0) {
      await SecureStore.setItemAsync('masterPassword', masterPassword);
      setIsUnlocked(true);
    }
  };

  const handleBiometricUnlock = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        Alert.alert('Erro', 'Biometria não disponível neste dispositivo.');
        return;
      }
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        Alert.alert('Erro', 'Nenhuma biometria cadastrada no dispositivo.');
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Desbloquear DrivePass',
        fallbackLabel: 'Usar Senha Mestra',
      });
      if (result.success) {
        const stored = await SecureStore.getItemAsync('masterPassword');
        if (stored) {
          setMasterPassword(stored);
          setIsUnlocked(true);
        } else {
          Alert.alert('Erro', 'Por favor, faça login com sua senha mestre primeiro.');
        }
      }
    } catch (error) {
      console.warn('Erro ao autenticar com biometria', error);
    }
  };

  if (!isUnlocked) {
    return (
      <View style={styles.container}>
        <View style={styles.loginContainer}>
          <Text style={styles.headerTitleDark}>DrivePass</Text>
          <Text style={styles.loginSubtitle}>Digite sua senha mestra para desbloquear o cofre offline.</Text>
          <TextInput
            style={styles.input}
            placeholder="Senha mestra"
            secureTextEntry
            value={masterPassword}
            onChangeText={setMasterPassword}
          />
          <Button title="Desbloquear" onPress={handleUnlock} color="#1a73e8" />
          <View style={{ marginTop: 15 }}>
            <Button title="Desbloquear com Biometria" onPress={handleBiometricUnlock} color="#34a853" />
          </View>
        </View>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>DrivePass</Text>
        <Text style={styles.headerSubtitle}>Android App (Sincronizado via Google Drive .csv)</Text>
      </View>

      <View style={styles.actions}>
        {isSyncing ? (
           <ActivityIndicator size="small" color="#1a73e8" />
        ) : (
           <Button
             title="Sincronizar com Google Drive (CSV)"
             onPress={async () => {
               setIsSyncing(true);
               const data = await SyncService.syncWithGoogleDrive();
               setVaultData(data as any[]);
               setIsSyncing(false);
               console.log('Sincronizado com passwords.csv no Drive!'); // NOSONAR
             }}
             color="#1a73e8"
           />
        )}
        <View style={styles.buttonRow}>
          <Button
            title="Gerador"
            onPress={() => setShowGenerator(true)}
            color="#fbbc05"
          />
        </View>
        <Text style={{color: 'orange', textAlign: 'center', marginTop: 10}}>Aviso: Sincronização offline-first com Google Drive ativa.</Text>
      </View>

      {showGenerator ? (
        <PasswordGenerator onClose={() => setShowGenerator(false)} />
      ) : (
        <FlatList
          data={vaultData.length > 0 ? vaultData : []}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          style={styles.list}
          ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 20}}>Nenhuma senha. Clique em Sincronizar.</Text>}
        />
      )}

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  headerTitleDark: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a73e8',
    textAlign: 'center',
    marginBottom: 10,
  },
  loginSubtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#1a73e8',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#e8eaed',
    fontSize: 14,
  },
  actions: {
    padding: 20,
    gap: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  list: {
    paddingHorizontal: 20,
  },
  item: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});
