# 🗺️ ROADMAP.md - Bunker Evolution

## 🏁 Phase 1: Core Scaffolding ✅
- [x] Monorepo structure with `apps/` and `scripts/`.
- [x] Initial release automation with GitHub Actions (`release-please.yml`, `ci.yml`, `build-and-publish.yml`).
- [x] Verification scripts for code integrity.

## 💾 Phase 2: Core Storage & Apps (Current)
- [x] **Armazenamento e Sincronização**: Salvar e sincronizar senhas off-line no Google Drive, em uma planilha .csv (Diferencial).
- [x] **Acesso Rápido e Offline**: Leitura direta do cofre `.csv` local sem necessidade de conexão constante, sincronizando em background.
- [x] **App Orchestration**: Implementar um CLI central para gerenciar os sub-apps.
- [x] **Unified CI/CD**: Padronizar GitHub Actions para todas as aplicações no monorepo.
- [ ] **Secret Management**: Sistema de cofre integrado para configurações locais.
- [ ] **E2E Integration**: Testes de verificação entre aplicações.

## 🚀 Phase 3: Identity & Basic Parity (LastPass Alternative)
- [x] **Cofre de Senhas**: Armazenamento seguro e hierárquico (pastas) e Notas Seguras. O diferencial é o salvamento off-line das senhas no Google Drive em uma planilha .csv.
- [x] **Extensão e Autofill Avançado**: Salvar e preencher automaticamente no Firefox, Chrome, Safari, Android e iOS.
- [x] **Gerador de Senhas e Usuários**: Criação de senhas e usernames seguros e customizáveis.
- [x] **Notas Seguras**: Armazenar informações adicionais como cartões e notas Wi-Fi.
- [x] **Endereços e Cartões**: Armazenamento de perfis para preenchimento de formulários (Form Fills) e dados bancários.
- [x] **Sincronização Automática (Device Sync)**: Salve uma senha em um dispositivo e ela será sincronizada em todos.
- [ ] **Login sem Senha no Cofre (Passwordless)**: Acessar facilmente seu cofre de senhas sem precisar digitar a senha mestre.
- [ ] **Chaves de Acesso (Passkeys)**: Crie, armazene e gerencie chaves de acesso, tornando os logins mais rápidos.
- [ ] **Autofill Multiplataforma**: Salvar e preencher automaticamente no Google Chrome, Android, iPhone/iPad, Safari e Mozilla Firefox.

## 🛡️ Phase 4: Advanced Security & Enterprise
- [x] **Painel de Segurança**: Receba notificações sobre senhas fracas, reutilizadas e antigas com recomendações.
- [ ] **Monitoramento da Dark Web**: Receber alerta imediato se informações pessoais forem encontradas na dark web.
- [ ] **Compartilhar Credenciais com Segurança**: Compartilhamento Pessoal e Empresarial de senhas de forma segura.
- [ ] **Acesso de Emergência (Emergency Access)**: Conceder a um contato de confiança acesso ao cofre em caso de emergência.
- [ ] **Testamento Digital (Digital Will)**: Deixe uma cópia da sua vida digital em caso de emergência.
- [ ] **Gerenciamento de Usuários**: Controle a segurança, as contas e as políticas da sua empresa em uma única plataforma.
- [ ] **Integração de Diretórios**: Integre ao diretório de usuários existente para automatizar o gerenciamento.
- [ ] **Workstation MFA**: Expanda a autenticação para a estação de trabalho para simplificar logins e aumentar a segurança.
- [ ] **Login Federado**: Permita que os usuários façam login com suas credenciais de identidade federada.
- [ ] **SaaS Protect**: Tome medidas imediatas para controlar o uso de SaaS, bloquear ou restringir aplicativos perigosos.

## 🎯 v1.0 Milestone
A production-ready monorepo framework that serves as the gold standard for high-integrity, secure application management, acting as a complete open-source alternative to LastPass.
