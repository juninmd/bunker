[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/juninmd/bunker/releases)

# BunkerPass

BunkerPass é um gerenciador de senhas open-source inspirado no LastPass, com foco em **privacidade, sincronização via Google Drive** e suporte multiplataforma:

- Extensão para **Chrome/Firefox**
- Aplicativo desktop (Planejado: Electron/Tauri)
- Aplicativo Android (Planejado: React Native/Flutter)
- Acesso offline rápido com sincronização posterior

## Visão do produto

O diferencial do BunkerPass é armazenar os dados de senhas do usuário em estruturas no Google Drive:

1. **Google Sheets** para metadados e índice de busca rápida.
2. **CSV versionado** para interoperabilidade e backup.
3. **Blob criptografado local** (cache offline) para acesso imediato sem internet.

Toda informação sensível deve ser criptografada ponta a ponta antes de qualquer sincronização com a nuvem.

## Roadmap

O roadmap completo de funcionalidades está em [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Features Mapeadas (Alternativa ao LastPass)

- **Cofre de Senhas Criptografado** (Acesso offline com chave derivada localmente).
- **Gerador de Senhas e Nome de Usuário** (Senhas fortes e seguras).
- **Notas Seguras e Cartões de Pagamento** (Organização diversificada).
- **Organização por Pastas e Grupos**.
- **Sincronização via Google Drive** (Planilha CSV e blob encriptado).
- **Autofill (Preenchimento Automático)** em páginas da web.
- **Detector de Mudança de Senha** e **Painel de Segurança** (Monitoramento de senhas fracas ou reutilizadas).
- **Monitoramento da Dark Web** e **Testamento Digital**.
- **Compartilhamento de Senhas** (Uso pessoal e times/business via Drive).
- **Autenticação Multifatorial (MFA)**, **Workstation MFA**, e **Login Sem Senha (Passkeys)**.
- **SaaS Protect** e **Acesso Seguro** (VPN/Proxy).
- Suporte a **Android (APK)** e **Desktop (App)** integrados.

## Estado atual de desenvolvimento

### ✅ Entregue neste ciclo

- Scaffold do módulo de extensão em `apps/extension`.
- Popup MVP com:
  - desbloqueio por senha mestra
  - cadastro e remoção de credenciais (CRUD inicial)
  - suporte a diferentes tipos de itens: Senhas, Notas Seguras e Cartões de Pagamento
  - armazenamento criptografado em `chrome.storage.local`/`browser.storage.local` com schema versionado
  - fallback para `localStorage` em ambiente de teste
- Pipeline para empacotar artefato `.zip` da extensão (via GitHub Actions).
- Workflow de release orientado a tags (`vX.Y.Z`) com anexos automáticos.
- **Sincronização Bidirecional com Google Drive (`vault.enc` + `passwords.csv`)**

### 🔜 Próximas entregas (curto prazo)

1. **Gerador de Senhas Seguro** (Em desenvolvimento).
2. Sync Automático (Background Service).
3. Testes automatizados da lógica de criptografia e CSV.
4. Desktop e Android App (em fases posteriores).

## Arquitetura em alto nível

- **Core criptográfico compartilhado** (Rust/WASM):
  - Derivação de chave (Argon2id)
  - Criptografia (XChaCha20-Poly1305)
  - Gestão de cofre
- **Clientes**:
  - Extensão browser (Manifest V3)
  - Desktop (Tauri/Electron)
  - Android (React Native/Kotlin)
- **Sincronização**:
  - API Google Drive/Sheets
  - Estratégia offline-first
  - Resolução de conflitos com versionamento por registro

## Estratégia de releases e versionamento

Este repositório usa GitHub Actions para:

- Rodar CI em push e pull request.
- Executar **Release Please** para gerar PR de release, atualizar CHANGELOG e criar tags automaticamente.
- Empacotar artefatos (extensão, desktop e APK) ao publicar uma tag `vX.Y.Z`.

Fluxo resumido:

1. Commits entram na `main` usando Conventional Commits.
2. Workflow `release-please.yml` abre/atualiza PR de release com versão e changelog.
3. Ao merge do PR de release, a action cria tag `vX.Y.Z` e release.
4. Workflow `build-and-publish.yml` roda na tag e anexa artefatos + checksums.

## Configuração do Google Drive (Desenvolvimento)

Para que a sincronização com o Google Drive funcione, é necessário configurar um projeto no Google Cloud Platform:

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. Crie um novo projeto.
3. Ative a **Google Drive API**.
4. Configure a "Tela de permissão OAuth" (OAuth Consent Screen).
5. Crie credenciais do tipo **ID do cliente OAuth** para **Extensão do Chrome**.
   - Adicione o ID da extensão (que pode ser encontrado em `chrome://extensions` ao carregar a extensão descompactada) em "ID do item".
6. Copie o `Client ID` gerado.
7. Abra o arquivo `apps/extension/manifest.json` e substitua `YOUR_CLIENT_ID.apps.googleusercontent.com` pelo seu Client ID.

## Como contribuir

1. Crie branch para feature/fix.
2. Siga Conventional Commits (`feat:`, `fix:`, `chore:` etc.).
3. Abra PR com contexto técnico e plano de testes.
