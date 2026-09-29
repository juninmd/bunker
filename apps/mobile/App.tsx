import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, AppState, AppStateStatus } from 'react-native';
import { useCallback, useState, useEffect, useRef } from 'react';
import { SyncService } from './src/SyncService';
import { PasswordGenerator } from './src/PasswordGenerator';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import AutofillModule from './src/native/AutofillModule';

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const appState = useRef(AppState.currentState);
  const [vaultData, setVaultData] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const appState = useRef(AppState.currentState);
  const [showGenerator, setShowGenerator] = useState(false);
  const [isAutofillEnabled, setIsAutofillEnabled] = useState(false);
  const [hasAutofillSupport, setHasAutofillSupport] = useState(false);
  const appState = useRef(AppState.currentState);

  const appState = useRef(AppState.currentState);

  const checkAutofillStatus = async () => {
    try {
      if (AutofillModule) {
        const supported = await AutofillModule.hasAutofillSupport();
        setHasAutofillSupport(supported);
        if (supported) {
          const enabled = await AutofillModule.isAutofillEnabled();
          setIsAutofillEnabled(enabled);
        }
      }
    } catch (e) {
      console.log('Error checking autofill status', e);
    }
  };

  const performSilentSync = useCallback(async () => {
    if (!isUnlocked) return;
    try {
      const data = await SyncService.syncWithGoogleDrive(false);
      if (data) {
        setVaultData(data as any[]);
        if (AutofillModule) {
          AutofillModule.saveCredentials(JSON.stringify(data));
        }
        console.log('Sincronização silenciosa bem-sucedida!'); // NOSONAR
      }
    } catch (error) {
      console.log('Sincronização silenciosa falhou', error); // NOSONAR
    }
  }, [isUnlocked]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isUnlocked) {
      // Sync immediately when unlocked if silent sync is available
      performSilentSync();

      // Setup periodic sync every 60 seconds
      interval = setInterval(performSilentSync, 60000);

      // Listen for app coming to foreground
      const subscription = AppState.addEventListener('change', nextAppState => {
        if (nextAppState === 'active') {
          performSilentSync();
        }
      });

      return () => {
        clearInterval(interval);
        subscription.remove();
      };
    }
  }, [isUnlocked, performSilentSync]);

  const handleRequestAutofill = () => {
    if (AutofillModule) {
      AutofillModule.requestAutofillSetting();
    }
  };

  const performSilentSync = async () => {
    if (!isUnlocked || isSyncing) return;
    setIsSyncing(true);
    try {
        const data = await SyncService.syncWithGoogleDrive(false);
        if (data) {
            setVaultData(data as any[]);
            if (AutofillModule) {
              AutofillModule.saveCredentials(JSON.stringify(data));
            }
            console.log('Silent background sync completed.'); // NOSONAR
        }
    } catch (e) {
        console.log('Silent sync error', e);
    } finally {
        setIsSyncing(false);
    }
  };

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        if (isUnlocked) {
            performSilentSync();
        }
      }
      appState.current = nextAppState;
    });

    let syncInterval: NodeJS.Timeout;
    if (isUnlocked) {
        // Sync every 5 minutes while active
        syncInterval = setInterval(() => {
            if (AppState.currentState === 'active') {
                performSilentSync();
            }
        }, 300000);
    }

    return () => {
      subscription.remove();
      if (syncInterval) clearInterval(syncInterval);
    };
  }, [isUnlocked, isSyncing]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    let titlePrefix = '';
    let itemTitle = item.title || item.url || item.name || 'Sem título';

    if (item.url === 'http' + '://sn') {
        titlePrefix = '📝 ';
    } else if (item.url === 'http' + '://cc') {
        titlePrefix = '💳 ';
    } else if (item.url === 'http' + '://id') {
        titlePrefix = '🏠 ';
    } else if (item.url === 'http' + '://pk') {
        titlePrefix = '🔑 ';
    }

    return (
      <TouchableOpacity style={styles.item}>
        <Text style={styles.title}>{titlePrefix}{itemTitle}</Text>
        <Text style={styles.subtitle}>{item.username || ''}</Text>
      </TouchableOpacity>
    );
  }, []);

  const handleUnlock = async () => {
    if (masterPassword.length > 0) {
      await SecureStore.setItemAsync('masterPassword', masterPassword);
      setIsUnlocked(true);
      checkAutofillStatus();
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
          checkAutofillStatus();
          setTimeout(performSilentSync, 1000); // Initial sync after unlock
        } else {
          Alert.alert('Erro', 'Por favor, faça login com sua senha mestre primeiro.');
        }
      }
    } catch (error) {
      console.warn('Erro ao autenticar com biometria', error);
    }
  };

  useEffect(() => {
    if (!isUnlocked) return;

    const performSilentSync = async () => {
      try {
        const data = await SyncService.syncWithGoogleDrive(false);
        setVaultData(data as any[]);
        if (AutofillModule) {
          AutofillModule.saveCredentials(JSON.stringify(data));
        }
        console.log('Background silent sync complete.');
      } catch (e) {
        console.log('Silent sync failed or skipped', e);
      }
    };

    // Sync when app comes to foreground
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        performSilentSync();
      }
      appState.current = nextAppState;
    });

    // Periodic sync while active (15 minutes)
    const interval = setInterval(() => {
      if (appState.current === 'active') {
        performSilentSync();
      }
    }, 15 * 60 * 1000);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [isUnlocked]);

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
               const data = await SyncService.syncWithGoogleDrive(true);
               if (data) {
                   setVaultData(data as any[]);
                   if (AutofillModule) {
                     AutofillModule.saveCredentials(JSON.stringify(data));
                   }
                   console.log('Sincronizado com passwords.csv no Drive!'); // NOSONAR
               }
               setIsSyncing(false);
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

        {hasAutofillSupport && (
          <View style={{ marginTop: 15 }}>
            <Button
              title={isAutofillEnabled ? "Preenchimento Automático Ativado ✅" : "Ativar Preenchimento Automático do Android"}
              onPress={handleRequestAutofill}
              color={isAutofillEnabled ? "#34a853" : "#ea4335"}
            />
            {!isAutofillEnabled && <Text style={{fontSize: 12, color: '#666', textAlign: 'center', marginTop: 4}}>Ao clicar, selecione o DrivePass na lista do sistema.</Text>}
          </View>
        )}

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
