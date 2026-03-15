import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, FlatList, TouchableOpacity } from 'react-native';

const MOCK_VAULT = [
  { id: '1', title: 'google.com', username: 'test@gmail.com' },
  { id: '2', title: 'github.com', username: 'dev_user' },
  { id: '3', title: 'bank.com', username: '12345678' }
];

export default function App() {
  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.item}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.username}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>BunkerPass</Text>
        <Text style={styles.headerSubtitle}>Android App (Google Drive Sync)</Text>
      </View>

      <View style={styles.actions}>
        <Button
          title="Sync with Google Drive"
          onPress={() => alert('Syncing passwords.csv with vault.enc...')}
        />
      </View>

      <FlatList
        data={MOCK_VAULT}
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
