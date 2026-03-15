1. **Atualizar `docs/ROADMAP.md`**: Vou rever e garantir que TODAS as funcionalidades listadas na página de features do LastPass (https://www.lastpass.com/pt/features) estejam mapeadas no roadmap, como: Monitoramento da Dark Web, Compartilhamento Pessoal/Empresarial, Chaves de Acesso (Passkeys), Acesso de Emergência, Testamento Digital, SaaS Protect, Integração de Diretórios, Login sem senha, Login federado, Workstation MFA, Salvar/Preencher no Chrome/Firefox/Android/iOS/Safari.
   - O projeto já possui a sincronização via Google Drive configurada no roadmap.
   - Os metadados de diferenciais já estão ali, mas irei destacar as adições do site oficial da LastPass.

2. **Revisar GitHub Actions (Release, Tags e README)**:
   - Os arquivos de workflows `.github/workflows/release-please.yml` e `.github/workflows/build-and-publish.yml` já automatizam a geração de releases, tags, empacotam a extensão e os placeholders desktop/mobile.
   - O script `scripts/update-readme.js` já existe e é chamado pelas actions para manter a versão no README atualizada.
   - Vou revisar a chamada do script no `release-please.yml` e verificar se precisa de ajustes para a build dos artefatos.

3. **Iniciar o Desenvolvimento (Android APK e App Desktop)**:
   - A requisição pede uma extensão para Firefox/Chrome COM função de app desktop e android apk.
   - Atualmente `apps/android` tem apenas um README. Vou inicializar um projeto Expo/React Native limpo e básico (o ponto de partida) com uma tela `App.js` demonstrando o conceito do "BunkerPass" integrado com Google Drive CSV.
   - Vou ajustar a lógica do github actions para que a estrutura de compilação contemple o Android (criando um script dummy de build local para o workflow se não houver um `eas build` configurado) e garantir que o zip do desktop seja gerado corretamente.

4. **Concluir pre-commit**:
   - Rodar verificação e instruções pré-commit, testando os artefatos com `npm test` na extensão.
