import { NativeModules } from 'react-native';

interface IosAutofillModuleType {
  hasAutofillSupport(): Promise<boolean>;
  isAutofillEnabled(): Promise<boolean>;
  requestAutofillSetting(): void;
  saveCredentials(json: string): void;
}

const { IosAutofillModule } = NativeModules;

export default IosAutofillModule as IosAutofillModuleType;
