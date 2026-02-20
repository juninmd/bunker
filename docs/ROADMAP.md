# Roadmap de funcionalidades — BunkerPass

> Objetivo: substituir o LastPass com foco em extensão browser + app desktop + app Android, sincronizando cofre criptografado com Google Drive (Sheets + CSV), com operação offline-first.

## 1) Princípios de produto

- **Zero-knowledge**: nenhuma senha em texto puro fora do dispositivo.
- **Offline-first**: leitura e preenchimento rápido sem internet.
- **Multiplataforma real**: Chrome, Firefox, Desktop e Android.
- **Portabilidade**: import/export em CSV e backup verificável.
- **Segurança por padrão**: MFA, políticas fortes e auditoria.

## 2) Mapa de features

### 2.1 Cofre de senhas

- Cadastro manual de credenciais (site, usuário, senha, notas).
- Pastas e tags para organização.
- Busca full-text por domínio, título e tags.
- Histórico de versões por item (com rollback).

### 2.2 Geração de senhas

- Gerador com regras: tamanho, símbolos, pronúncia opcional.
- Avaliação de força em tempo real.

### 2.3 Preenchimento automático (autofill)

- Detecção inteligente de formulários de login.
- Fill de múltiplos campos (usuário/senha/OTP quando aplicável).
- Captura automática de novas credenciais no submit.

### 2.4 Segurança e autenticação

- Senha mestra obrigatória.
- PBKDF2 (MVP) → Argon2id (Futuro).
- Cofre criptografado com AES-GCM (MVP).
- Bloqueio automático por tempo/inatividade.
- Biometria no desktop/mobile.

### 2.5 Sincronização Google Drive (Diferencial)

A sincronização utiliza o Google Drive como backend de armazenamento, garantindo privacidade total (zero-knowledge cloud).

- **Arquivo Principal (`vault.enc`)**:
  - Contém todo o cofre criptografado com a chave do usuário.
  - É a fonte da verdade (Source of Truth).
  - Atualizado em cada alteração local.

- **Arquivo CSV (`passwords.csv`)**:
  - Exportação legível (para backup ou migração).
  - Atualizado automaticamente após cada sync bem-sucedido do `vault.enc`.
  - Permite edição manual externa (com reimportação via "Importar CSV").

- **Índice (Google Sheets - Opcional)**:
  - Metadados não sensíveis (ex: lista de sites) para busca rápida sem baixar todo o cofre.

## 3) Arquitetura Multiplataforma

O projeto utiliza um **Monorepo** para compartilhar a lógica de negócio (`core`) entre as plataformas.

### 3.1 Core (Shared Logic)
- **Linguagem**: TypeScript / JavaScript (ES Modules).
- **Módulos**:
  - `crypto`: Criptografia AES-GCM, PBKDF2.
  - `vault`: Gerenciamento de estado do cofre e versionamento.
  - `sync`: Lógica de sincronização com Google Drive API.
  - `csv`: Parser e gerador de CSV compatível com RFC 4180.

### 3.2 Extensão (Chrome/Firefox)
- **Tecnologia**: Web Extensions API (Manifest V3).
- **Estado**: Em desenvolvimento (`apps/extension`).
- **Features**: Popup, Autofill (Content Script), Background Sync.

### 3.3 Desktop App
- **Tecnologia**: Electron ou Tauri (Rust + Frontend Web).
- **Estratégia**:
  - Reutilizar a UI da extensão (React/HTML/CSS) dentro de uma janela desktop.
  - Adaptar a camada de armazenamento (`chrome.storage.local` -> `fs` ou `sqlite`).
  - Teclas de atalho globais e integração com sistema (tray icon).

### 3.4 Android App
- **Tecnologia**: React Native ou Flutter.
- **Estratégia**:
  - Se React Native: Compartilhar diretamente o código JS do `core`.
  - Bridge para Crypto nativo (para performance).
  - Integração com Autofill Framework do Android.

## 4) Fases do Roadmap

### Fase 1 — MVP Extensão (Concluído/Em Polimento)
- ✅ Estrutura do projeto e Release Automation.
- ✅ Criptografia local e CRUD básico.
- ✅ Sincronização Manual com Google Drive (`vault.enc` + `passwords.csv`).
- 🔄 Melhoria: Sync Automático e Tratamento de Conflitos robusto.

### Fase 2 — Sync Automático e Segurança (Próximo)
- Sync em background via `chrome.alarms` (cada 15min).
- Detecção de alterações remotas (polling eficiente).
- Testes automatizados da lógica de criptografia e CSV.

### Fase 3 — Desktop App (Electron/Tauri)
1. Criar `apps/desktop`.
2. Configurar build pipeline (GitHub Actions).
3. Portar `VaultService` para usar File System local.
4. Implementar UI responsiva baseada na extensão.

### Fase 4 — Android App (React Native)
1. Criar `apps/android` (React Native CLI).
2. Configurar build de APK (GitHub Actions).
3. Implementar UI Mobile-first.
4. Integrar com Google Drive Android API.

### Fase 5 — Paridade e Polimento
- Autofill inteligente em iframes e shadow DOM.
- Compartilhamento seguro de senhas (via link temporário ou chave pública).
- Auditoria de segurança (senha fraca/repetida).
