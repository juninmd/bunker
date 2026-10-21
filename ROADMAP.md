# 🗺️ DrivePass Roadmap

## 🎯 Escopo do Projeto

O objetivo do DrivePass é ser um substituto completo, open-source e auto-hospedado para o LastPass, operando offline-first e com sincronização no Google Drive do próprio usuário.

### Fases de Implementação

#### Fase 1: Estrutura Inicial (Completa)
- [x] Arquitetura Monorepo (Workspace npm).
- [x] Extensão Web: Chrome e Firefox (Manifest V3).
- [x] App Desktop: Multiplataforma via Electron.
- [x] App Mobile: Android APK nativo (React Native / Expo).
- [x] Storage/Sync Core: Sincronização offline-first usando uma planilha cifrada no Google Drive.
- [x] Criptografia de ponta a ponta nativa usando AES-256-GCM.

#### Fase 2: Paridade com o LastPass (Em Andamento)
- [x] **Painel de Segurança**:
  - Análise de senhas fracas, reutilizadas ou antigas.
  - Verificação de vazamentos (integração com HIBP - Have I Been Pwned).
- [ ] **Passkeys**:
  - Suporte completo a autenticação nativa sem senha (WebAuthn) nas extensões, desktop e mobile.
- [x] **Login sem senha**:
  - Capacidade de desbloquear o cofre utilizando biometria, passkeys ou chaves de hardware.
- [ ] **SaaS Protect**:
  - Monitoramento avançado e proteções específicas para aplicações web corporativas (SSO e IAM leves locais).
  - *Status:* UI inicial scaffoldada em todas as plataformas, aguardando implementação da lógica de monitoramento real.

#### Fase 3: Aprimoramentos Contínuos e Refinamentos
- [ ] Melhorias no Autofill de Android e iOS.
- [ ] Otimizações de sincronização em segundo plano no Mobile.
- [ ] Melhorias na interface de usuário (Bunker Midnight).
- [ ] Manutenção de dependências e monitoramento de saúde do código.

---
*Este documento é mantido automaticamente e será atualizado em cada ciclo do loop CRON.*
