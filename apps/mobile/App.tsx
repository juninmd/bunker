import { StatusBar } from 'expo-status-bar';
import { Alert, AppState, AppStateStatus, Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import { useCallback, useState, useEffect, useRef } from 'react';
import { SyncService } from './src/SyncService';
import { PasswordGenerator } from './src/PasswordGenerator';
import { SecurityPanel } from './src/SecurityPanel';
import { SaasProtectPanel } from './src/SaasProtectPanel';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import AutofillModule from './src/native/AutofillModule';
import { LockScreen } from './src/components/LockScreen';
import { ScreenBackground } from './src/components/ScreenBackground';
import { VaultHeader } from './src/components/VaultHeader';
import { VaultList } from './src/components/VaultList';
import type { VaultRowItem } from './src/components/vaultItem';

const BACKGROUND_SYNC_TASK = 'BACKGROUND_SYNC_TASK';

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    console.log('Running background sync task...');
    const data = await SyncService.syncWithGoogleDrive(false);
    if (data && (data as any[]).length > 0) {
      if (AutofillModule) {
        AutofillModule.saveCredentials(JSON.stringify(data));
      }
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }
    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (err) {
    console.error('Background sync failed:', err);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

async function registerBackgroundFetchAsync() {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 15 * 60, // 15 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log('Background fetch task registered');
  } catch (err) {
    console.error('Failed to register background fetch task:', err);
  }
}

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const appState = useRef(AppState.currentState);
  const [vaultData, setVaultData] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const processPendingSaves = async (currentData: any[]) => {
    if (!AutofillModule || Platform.OS !== 'android') return;
    try {
      if (AutofillModule.getPendingSaves) {
          const pendingSavesStr = await AutofillModule.getPendingSaves();
          if (pendingSavesStr && pendingSavesStr !== '[]') {
            const pendingSaves = JSON.parse(pendingSavesStr);
            let updatedData = [...currentData];
            let hasNewData = false;

            for (const save of pendingSaves) {
              updatedData.push({
                id: Crypto.randomUUID(),
                title: save.domain,
                username: save.username,
                password: save.password
              });
              hasNewData = true;
            }

            if (hasNewData) {
              setVaultData(updatedData);
              if ((SyncService as any).uploadToGoogleDrive) {
                  await (SyncService as any).uploadToGoogleDrive(updatedData);
              }
              AutofillModule.saveCredentials(JSON.stringify(updatedData));
              if (AutofillModule.clearPendingSaves) {
                  await AutofillModule.clearPendingSaves();
              }
              console.log('Pending saves processed and uploaded to Drive.');
            }
          }
      }
    } catch (e) {
      console.log('Error processing pending saves', e);
    }
  };
    const [showGenerator, setShowGenerator] = useState(false);
  const [showSecurityPanel, setShowSecurityPanel] = useState(false);
  const [showSaasProtectPanel, setShowSaasProtectPanel] = useState(false);
  const [isAutofillEnabled, setIsAutofillEnabled] = useState(false);
  const [hasAutofillSupport, setHasAutofillSupport] = useState(false);
    const syncInProgress = useRef(false);

  const performSync = useCallback(async (interactive: boolean = true) => {
    if (syncInProgress.current) return;

    syncInProgress.current = true;
    if (interactive) setIsSyncing(true);

    try {
      const data = await SyncService.syncWithGoogleDrive(interactive);
      if (data) {
        setVaultData(data as any[]);
        if (AutofillModule) {
          AutofillModule.saveCredentials(JSON.stringify(data));
        }
        console.log(`Sincronizado com passwords.csv no Drive (Interactive: ${interactive})!`); // NOSONAR
      }
    } catch (e) {
      console.log('Error during sync', e);
    } finally {
      syncInProgress.current = false;
      if (interactive) setIsSyncing(false);
    }
  }, []);

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
    if (!isUnlocked || isSyncing) return;
    try {
      const data = await SyncService.syncWithGoogleDrive(false);
      if (data) {
        setVaultData(data as any[]);
        if (AutofillModule) {
          AutofillModule.saveCredentials(JSON.stringify(data));
        }
        console.log('Background silent sync complete.');
        await processPendingSaves(data as any[]);
      }
    } catch (e) {
      console.log('Silent sync failed or skipped:', e);
    }
  }, [isUnlocked, isSyncing]);

  useEffect(() => {
    if (!isUnlocked) return;

    // Initial sync on unlock
    performSilentSync();
    registerBackgroundFetchAsync();

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
  }, [isUnlocked, performSilentSync]);

  const handleRequestAutofill = () => {
    if (AutofillModule) {
      AutofillModule.requestAutofillSetting();
    }
  };

  const handleUnlock = async () => {
    if (masterPassword.length > 0) {
      await SecureStore.setItemAsync('masterPassword', masterPassword);
      setIsUnlocked(true);
      checkAutofillStatus();
      performSilentSync();
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
        promptMessage: 'Desbloquear Bunker',
        fallbackLabel: 'Usar Senha Mestra',
      });
      if (result.success) {
        const stored = await SecureStore.getItemAsync('masterPassword');
        if (stored) {
          setMasterPassword(stored);
          setIsUnlocked(true);
          checkAutofillStatus();
          performSilentSync();
        } else {
          Alert.alert('Erro', 'Por favor, faça login com sua senha mestre primeiro.');
        }
      }
    } catch (error) {
      console.warn('Erro ao autenticar com biometria', error);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    const data = await SyncService.syncWithGoogleDrive(true);
    if (data) {
        setVaultData(data as VaultRowItem[]);
        if (AutofillModule) {
          AutofillModule.saveCredentials(JSON.stringify(data));
        }
        console.log('Sincronizado com passwords.csv no Drive!'); // NOSONAR
        await processPendingSaves(data as VaultRowItem[]);
    }
    setIsSyncing(false);
  };

  if (!isUnlocked) {
    return (
      <>
        <LockScreen
          masterPassword={masterPassword}
          onChangePassword={setMasterPassword}
          onUnlock={handleUnlock}
          onBiometric={handleBiometricUnlock}
        />
        <StatusBar style="light" />
      </>
    );
  }

  return (
    <ScreenBackground>
      <VaultHeader count={vaultData.length} isSyncing={isSyncing} onSync={handleManualSync} />

      {showSaasProtectPanel ? (
        <SaasProtectPanel data={vaultData} onClose={() => setShowSaasProtectPanel(false)} />
      ) : showSecurityPanel ? (
        <SecurityPanel data={vaultData} onClose={() => setShowSecurityPanel(false)} />
      ) : showGenerator ? (
        <PasswordGenerator onClose={() => setShowGenerator(false)} />
      ) : (
        <VaultList
          data={vaultData.length > 0 ? vaultData : []}
          isSyncing={isSyncing}
          onSync={handleManualSync}
          onOpenGenerator={() => setShowGenerator(true)}
          onOpenSecurity={() => setShowSecurityPanel(true)}
          onOpenSaasProtect={() => setShowSaasProtectPanel(true)}
          hasAutofillSupport={hasAutofillSupport}
          isAutofillEnabled={isAutofillEnabled}
          onRequestAutofill={handleRequestAutofill}
        />
      )}

      <StatusBar style="light" />
    </ScreenBackground>
  );
}
