# 🗺️ ROADMAP.md - Bunker Evolution

## 🏁 Phase 1: Core Scaffolding ✅
- [x] Monorepo structure with `apps/` and `scripts/`.
- [x] Initial release automation with GitHub Actions (`release-please.yml`, `ci.yml`, `build-and-publish.yml`).
- [x] Verification scripts for code integrity.

## 💾 Phase 2: Core Storage & Apps (Current)
- [ ] **Armazenamento e Sincronização**: Salvar e sincronizar senhas off-line no Google Drive, em uma planilha .csv (Diferencial).
- [x] **Acesso Rápido e Offline**: Leitura direta do cofre `.csv` local sem necessidade de conexão constante, sincronizando em background.
- [ ] **App Orchestration**: Implementar um CLI central para gerenciar os sub-apps.
- [x] **Unified CI/CD**: Padronizar GitHub Actions para todas as aplicações no monorepo.
- [ ] **Secret Management**: Sistema de cofre integrado para configurações locais.
- [ ] **E2E Integration**: Testes de verificação entre aplicações.

## 🚀 Phase 3: Identity & Basic Parity (LastPass Alternative)
- [ ] **Cofre de Senhas**: Armazenamento seguro e hierárquico (pastas) e Notas Seguras. O diferencial é o salvamento off-line das senhas no Google Drive em uma planilha .csv.
- [ ] **Extensão e Autofill Avançado**: Salvar e preencher automaticamente no Firefox, Chrome, Safari, Android e iOS.
- [x] **Gerador de Senhas e Usuários**: Criação de senhas e usernames seguros e customizáveis.
- [x] **Notas Seguras**: Armazenar informações adicionais como cartões e notas Wi-Fi.
- [x] **Endereços e Cartões**: Armazenamento de perfis para preenchimento de formulários (Form Fills) e dados bancários.
- [ ] **Sincronização Automática (Device Sync)**: Entre múltiplos dispositivos e navegadores.
- [ ] **Login sem Senha (Passwordless)**: Acessar o cofre sem digitar a senha mestra, usando WebAuthn ou Biometria.
- [ ] **Chaves de Acesso (Passkeys)**: Suporte nativo para criar, armazenar e gerenciar passkeys.

## 🛡️ Phase 4: Advanced Security & Enterprise
- [ ] **Painel de Segurança**: Auditoria de senhas fracas, reutilizadas e antigas (Security Score).
- [ ] **Monitoramento da Dark Web**: Alertas se informações ou senhas do usuário forem encontradas em vazamentos.
- [ ] **Compartilhamento**: Compartilhamento Pessoal (Personal) e Empresarial (Business) de senhas de forma segura.
- [ ] **Acesso de Emergência (Emergency Access)**: Conceder a um contato de confiança acesso ao cofre em caso de emergência.
- [ ] **Testamento Digital (Digital Will)**: Preparar e transferir o acesso em caso de falecimento.
- [ ] **Integração de Diretórios**: Gerenciamento de Usuários com Integração de Diretórios existentes (AD/LDAP).
- [ ] **Workstation MFA**: Login seguro no sistema operacional (Windows/Mac).
- [ ] **Login federado**: Logon único (SSO) para acessos integrados.
- [ ] **SaaS Protect**: Controle, visibilidade e monitoramento do uso de aplicativos SaaS.
- [ ] **Recuperação de Conta**: Mecanismo seguro de recuperação para senha mestre esquecida.

## 🎯 v1.0 Milestone
A production-ready monorepo framework that serves as the gold standard for high-integrity, secure application management, acting as a complete open-source alternative to LastPass.
