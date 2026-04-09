import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useCallback, useState } from 'react';
import { SyncService } from './src/SyncService';

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [vaultData, setVaultData] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const renderItem = useCallback(({ item }) => (
    <TouchableOpacity style={styles.item}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.username}</Text>
    </TouchableOpacity>
  ), []);

  const handleUnlock = () => {
    if (masterPassword.length > 0) {
      setIsUnlocked(true);
    }
  };

  if (!isUnlocked) {
    return (
      <View style={styles.container}>
        <View style={styles.loginContainer}>
          <Text style={styles.headerTitleDark}>BunkerPass</Text>
          <Text style={styles.loginSubtitle}>Digite sua senha mestra para desbloquear o cofre offline.</Text>
          <TextInput
            style={styles.input}
            placeholder="Senha mestra"
            secureTextEntry
            value={masterPassword}
            onChangeText={setMasterPassword}
          />
          <Button title="Desbloquear" onPress={handleUnlock} color="#1a73e8" />
        </View>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>BunkerPass</Text>
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
               setVaultData(data);
               setIsSyncing(false);
               alert('Sincronizado com passwords.csv no Drive!');
             }}
             color="#1a73e8"
           />
        )}
        <View style={styles.buttonRow}>
          <Button
            title="Painel de Segurança"
            onPress={() => alert('Painel de Segurança em desenvolvimento')}
            color="#34a853"
          />
          <Button
            title="Gerador"
            onPress={() => alert('Gerador de Senhas em desenvolvimento')}
            color="#fbbc05"
          />
          <Button
            title="Compartilhamento"
            onPress={() => alert('Compartilhamento em desenvolvimento')}
            color="#ea4335"
          />
        </View>
        <View style={styles.buttonRow}>
          <Button
            title="Dark Web"
            onPress={() => alert('Monitoramento Dark Web em desenvolvimento')}
            color="#666666"
          />
          <Button
            title="SaaS Protect"
            onPress={() => alert('SaaS Protect em desenvolvimento')}
            color="#666666"
          />
          <Button
            title="Testamento"
            onPress={() => alert('Testamento Digital em desenvolvimento')}
            color="#666666"
          />
        </View>
        <View style={styles.buttonRow}>
          <Button
            title="Diretórios"
            onPress={() => alert('Integração de Diretórios em desenvolvimento')}
            color="#666666"
          />
          <Button
            title="Sem Senha"
            onPress={() => alert('Login sem senha em desenvolvimento')}
            color="#666666"
          />
          <Button
            title="Passkeys"
            onPress={() => alert('Chaves de Acesso em desenvolvimento')}
            color="#666666"
          />
        </View>
        <View style={styles.buttonRow}>
          <Button
            title="Federação"
            onPress={() => alert('Login federado em desenvolvimento')}
            color="#666666"
          />
          <Button
            title="MFA Estação"
            onPress={() => alert('Workstation MFA em desenvolvimento')}
            color="#666666"
          />
          <Button
            title="Emergência"
            onPress={() => alert('Acesso de Emergência em desenvolvimento')}
            color="#666666"
          />
        </View>
      </View>

      <FlatList
        data={vaultData.length > 0 ? vaultData : []}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        style={styles.list}
        ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 20}}>Nenhuma senha. Clique em Sincronizar.</Text>}
      />

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
