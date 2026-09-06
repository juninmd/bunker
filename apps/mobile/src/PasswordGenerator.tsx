import React, { useState } from 'react';
import { View, Text, TextInput, Button, Switch, StyleSheet, TouchableOpacity } from 'react-native';
import * as Crypto from 'expo-crypto';

export function PasswordGenerator({ onClose }: { onClose: () => void }) {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState('16');
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);

  const generatePassword = () => {
    let charset = '';
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+~`|}{[]:;?><,./-=';

    if (charset === '') {
      setPassword('');
      return;
    }

    let newPassword = '';
    const passLength = parseInt(length, 10) || 16;

    // Generate an array of secure random values
    const randomValues = Crypto.getRandomValues(new Uint32Array(passLength));

    for (let i = 0; i < passLength; i++) {
      const randomIndex = randomValues[i] % charset.length;
      newPassword += charset[randomIndex];
    }
    setPassword(newPassword);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gerador de Senhas</Text>

      <TextInput
        style={styles.resultInput}
        value={password}
        editable={false}
        placeholder="Senha gerada..."
      />

      <View style={styles.inputContainer}>
        <Text>Tamanho:</Text>
        <TextInput
          style={styles.lengthInput}
          keyboardType="numeric"
          value={length}
          onChangeText={setLength}
        />
      </View>

      <View style={styles.switchRow}>
        <Text>Letras Maiúsculas</Text>
        <Switch value={includeUppercase} onValueChange={setIncludeUppercase} />
      </View>

      <View style={styles.switchRow}>
        <Text>Letras Minúsculas</Text>
        <Switch value={includeLowercase} onValueChange={setIncludeLowercase} />
      </View>

      <View style={styles.switchRow}>
        <Text>Números</Text>
        <Switch value={includeNumbers} onValueChange={setIncludeNumbers} />
      </View>

      <View style={styles.switchRow}>
        <Text>Símbolos</Text>
        <Switch value={includeSymbols} onValueChange={setIncludeSymbols} />
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Gerar Senha" onPress={generatePassword} color="#fbbc05" />
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Voltar" onPress={onClose} color="#666" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  resultInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    fontSize: 18,
    borderRadius: 4,
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  lengthInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 5,
    marginLeft: 10,
    width: 60,
    textAlign: 'center',
    borderRadius: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonContainer: {
    marginTop: 10,
  }
});
