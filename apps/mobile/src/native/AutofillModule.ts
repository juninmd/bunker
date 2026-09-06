import { NativeModules } from 'react-native';

interface AutofillModuleType {
  hasAutofillSupport(): Promise<boolean>;
  isAutofillEnabled(): Promise<boolean>;
  requestAutofillSetting(): void;
  saveCredentials(json: string): void;
}

const { AutofillModule } = NativeModules;

export default AutofillModule as AutofillModuleType;
