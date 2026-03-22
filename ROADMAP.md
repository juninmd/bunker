# 🗺️ ROADMAP.md - Bunker Evolution

## 🏁 Phase 1: Core Scaffolding ✅
- [x] Monorepo structure with `apps/` and `scripts/`.
- [x] Initial release automation with GitHub Actions (`release-please.yml`, `ci.yml`, `build-and-publish.yml`).
- [x] Verification scripts for code integrity.

## 💾 Phase 2: Core Storage & Apps (Current)
- [ ] **Armazenamento e Sincronização**: Salvar e sincronizar senhas off-line no Google Drive, em uma planilha `.csv`.
- [ ] **Acesso Rápido e Offline**: Leitura direta do cofre `.csv` local sem necessidade de conexão constante, sincronizando em background.
- [ ] **App Orchestration**: Implementar um CLI central para gerenciar os sub-apps.
- [ ] **Unified CI/CD**: Padronizar GitHub Actions para todas as aplicações no monorepo.
- [ ] **Secret Management**: Sistema de cofre integrado para configurações locais.
- [ ] **E2E Integration**: Testes de verificação entre aplicações.

## 🚀 Phase 3: Identity & Basic Parity (LastPass Alternative)
- [ ] **Cofre de Senhas**: Armazenamento seguro e hierárquico (pastas).
- [ ] **Extensão e Autofill Avançado**: Salvar e preencher automaticamente em Firefox, Chrome, Safari, Android e iOS.
- [ ] **Gerador de Senhas e Usuários**: Criação de senhas e usernames seguros e customizáveis.
- [ ] **Notas Seguras**: Armazenar informações adicionais como cartões e notas Wi-Fi.
- [ ] **Sincronização Automática (Device Sync)**: Entre múltiplos dispositivos e navegadores.
- [ ] **Login sem Senha (Passwordless)**: Acessar o cofre sem digitar a senha mestra.
- [ ] **Chaves de Acesso (Passkeys)**: Criar, armazenar e gerenciar passkeys.

## 🛡️ Phase 4: Advanced Security & Enterprise
- [ ] **Auditoria e Monitoramento**: Painel de Segurança (Security Dashboard) e Monitoramento da Dark Web.
- [ ] **Compartilhamento**: Compartilhamento de senhas pessoais e empresariais de forma segura.
- [ ] **Gestão e Controle**: Acesso de emergência e Testamento Digital (Digital Will).
- [ ] **Administração e Diretórios**: Gerenciamento de Usuários com Integração de Diretórios.
- [ ] **Segurança Avançada**: Workstation MFA, Login federado e SaaS Protect.

## 🎯 v1.0 Milestone
A production-ready monorepo framework that serves as the gold standard for high-integrity, secure application management, acting as a complete open-source alternative to LastPass.
