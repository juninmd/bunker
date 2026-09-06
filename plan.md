1.  **Refatorar diretório Mobile**: Já mudamos `apps/android` para `apps/mobile`. Renomeamos referências em `package.json`, `.github/workflows/build-artifacts.yml`, e `app.json`.
2.  **Configurar dependência `xcode`**: Adicionamos o pacote `xcode` no `apps/mobile/package.json` para permitir a manipulação programática do `.pbxproj` pelo plugin do Expo.
3.  **Desenvolver Plugin Expo (`ios-autofill`)**:
    - Cria a pasta do Native Target (`DrivePassAutofill`).
    - Adiciona `Info.plist`, `CredentialProviderViewController.swift`, e Entitlements corretos.
    - Usa a lib `xcode` dentro do config-plugin para adicionar o novo target `app_extension`, ligar os arquivos Swift e configurar os build settings (`CODE_SIGN_ENTITLEMENTS`, `PRODUCT_BUNDLE_IDENTIFIER`, etc).
4.  **Atualizar Roadmap/README**: Marcar a task de "Salvar e preencher automaticamente no iPhone e iPad" (iOS Autofill) como iniciada/parcialmente implementada ou testável via expo.
5.  **Pre-commit steps**: `pre_commit_instructions`
6.  **Submeter a branch com a funcionalidade (Submit)**.
