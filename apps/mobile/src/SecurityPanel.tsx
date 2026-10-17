import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function SecurityPanel() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Painel de Segurança</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Senhas Fracas</Text>
        <Text style={styles.cardText}>Em desenvolvimento...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 20,
  },
  title: {
    color: '#fbbf24',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#1e293b',
    padding: 15,
    borderRadius: 8,
  },
  cardTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  cardText: {
    color: '#94a3b8',
    fontSize: 14,
  },
});
