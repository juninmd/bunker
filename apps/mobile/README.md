# DrivePass Mobile

Este módulo gerencia o aplicativo Mobile (React Native/Expo) do DrivePass, com suporte multiplataforma, focado na expansão para dispositivos Android e integração com iOS.

## Funcionalidades Implementadas (Fase 5 Concluída)

- **Cofre Local Criptografado**: Interface completa do cofre local (`vault.enc`) mantendo o modelo de criptografia `AES-256-GCM` com `PBKDF2`.
- **Biometria (Fingerprint / FaceID)**: Desbloqueio seguro do aplicativo utilizando biometria via `expo-local-authentication` em conjunto com `expo-secure-store`.
- **Integração com Android Autofill**: Integração nativa profunda com a estrutura de Autofill do Android (`DrivePassAutofillService`) implementada de forma limpa como um Expo Config Plugin Customizado (`plugins/android-autofill`).
- **Integração com iOS AutoFill**: App Extension nativa e compartilhamento de senhas utilizando *Keychain Access Groups* e `react-native-keychain`, também via Config Plugin (`plugins/ios-autofill`).
- **Sincronização com Google Drive**: Integração real utilizando a API do Google Drive via OAuth2 implícito (App Auth via `expo-auth-session`).
- **Sincronização em Background (Device Sync)**: Sincronização e Refresh silencioso gerenciados via `AppState` sempre que o app retorna ao foreground ou permanece ativo.

## Desenvolvimento

O projeto utiliza **Expo Prebuild** devido à natureza nativa das integrações Autofill. Scripts clássicos do Expo Go não suportarão as extensões nativas (Android Service e iOS App Extension).

1. Instalar dependências:
   ```bash
   npm install
   ```
2. Gerar pastas nativas:
   ```bash
   npx expo prebuild --clean
   ```
3. Rodar aplicativo (requer emulador/device físico e Xcode/Android Studio):
   ```bash
   npm run android
   npm run ios
   ```
