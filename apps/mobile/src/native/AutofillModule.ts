import { NativeModules, Platform } from 'react-native';

interface AutofillModuleType {
  hasAutofillSupport(): Promise<boolean>;
  isAutofillEnabled(): Promise<boolean>;
  requestAutofillSetting(): void;
  saveCredentials(json: string): void;
}

const { AutofillModule, IosAutofillModule } = NativeModules;

export default (Platform.OS === 'ios' ? IosAutofillModule : AutofillModule) as AutofillModuleType;
