# BunkerPass

BunkerPass é um gerenciador de senhas open-source inspirado no LastPass, com foco em **privacidade, sincronização via Google Drive** e suporte multiplataforma:

- Extensão para **Chrome/Firefox**
- Aplicativo desktop (Tauri)
- Aplicativo Android (APK)
- Acesso offline rápido com sincronização posterior

## Visão do produto

O diferencial do BunkerPass é armazenar os dados de senhas do usuário em estruturas no Google Drive:

1. **Google Sheets** para metadados e índice de busca rápida.
2. **CSV versionado** para interoperabilidade e backup.
3. **Blob criptografado local** (cache offline) para acesso imediato sem internet.

Toda informação sensível deve ser criptografada ponta a ponta antes de qualquer sincronização com a nuvem.

## Roadmap

O roadmap completo de funcionalidades está em [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Estado atual de desenvolvimento

### ✅ Entregue neste ciclo

- Scaffold do módulo de extensão em `apps/extension`.
- Popup MVP com:
  - desbloqueio por senha mestra
  - cadastro e remoção de credenciais (CRUD inicial)
  - armazenamento criptografado em `chrome.storage.local`/`browser.storage.local` com schema versionado
  - fallback para `localStorage` em ambiente de teste
- Pipeline para empacotar artefato `.zip` da extensão.
- Workflow de release orientado a tags (`vX.Y.Z`) com anexos automáticos.

### 🔜 Próximas entregas (curto prazo)

1. Content script para detecção de formulários e autofill básico.
2. Modelo de dados versionado do cofre (`vault schema v1`).
3. Módulo de sincronização inicial com Google Drive (arquivo `vault.enc` + índice Sheets).
4. Importador CSV (LastPass) para migração assistida.

## Arquitetura em alto nível

- **Core criptográfico compartilhado** (Rust/WASM):
  - Derivação de chave (Argon2id)
  - Criptografia (XChaCha20-Poly1305)
  - Gestão de cofre
- **Clientes**:
  - Extensão browser (Manifest V3)
  - Desktop (Tauri)
  - Android (Kotlin + bridge para core)
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

## Como contribuir

1. Crie branch para feature/fix.
2. Siga Conventional Commits (`feat:`, `fix:`, `chore:` etc.).
3. Abra PR com contexto técnico e plano de testes.
