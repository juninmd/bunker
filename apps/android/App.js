import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useCallback, useState } from 'react';

const MOCK_VAULT = [
  { id: '1', title: 'google.com', username: 'test@gmail.com' },
  { id: '2', title: 'github.com', username: 'dev_user' },
  { id: '3', title: 'bank.com', username: '12345678' }
];

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [vaultItems, setVaultItems] = useState(MOCK_VAULT);

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
        <Button
          title="Sincronizar com Google Drive (.csv)"
          onPress={() => {
            // Mock offline Google Drive CSV sync
            setTimeout(() => {
              setVaultItems([
                ...vaultItems,
                { id: Math.random().toString(), title: 'google-drive-sync.com', username: 'synced_offline' }
              ]);
              alert('Cofre atualizado via passwords.csv (Google Drive)');
            }, 500);
          }}
          color="#1a73e8"
        />
      </View>

      <FlatList
        data={vaultItems}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        style={styles.list}
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
