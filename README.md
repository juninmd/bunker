[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/juninmd/bunker/releases)

# 🛡️ Bunker

[![Status: Active](https://img.shields.io/badge/Status-Active-brightgreen.svg)]()
[![Release: Latest](https://img.shields.io/github/v/release/juninmd/bunker)]()
[![Protocol: Antigravity](https://img.shields.io/badge/Protocol-Antigravity-orange.svg)]()

> A secure, monorepo-style collection of localized applications and documentation, managed with a focus on privacy and high-integrity code.

## ✨ Features

- **Isolated Applications**: Multiple apps stored within the `apps/` directory for clean separation.
- **Unified Documentation**: Centralized docs for all sub-projects.
- **Automation Scripts**: Comprehensive shell and python scripts for management and verification.
- **Release Automation**: Integrated with `release-please` para geração automatizada de tags e atualizações do `README.md`.
- **Sincronização com Google Drive**: apenas o cofre cifrado (`vault.enc`, AES-256-GCM) é enviado ao Drive; nenhuma senha sai do dispositivo em texto puro.
- **GitHub Actions Integration**: Automated generation of releases and tags, keeping the README.md updated via scripts.

## 🎨 Design

Interface escura e moderna, a "Bunker Midnight": fundo quase preto, acento dourado e um mostrador de cofre como marca. A mesma linguagem vale para a extensão, o desktop e o mobile (guia completo em [docs/DESIGN.md](docs/DESIGN.md)).

| Extensão | Desktop | Mobile |
| --- | --- | --- |
| <img src="docs/screenshots/06-lista.png" alt="Extensão: lista do cofre" width="230"> | <img src="docs/screenshots/desktop-cofre.png" alt="Desktop: cofre" width="440"> | <img src="docs/screenshots/mobile-cofre.png" alt="Mobile: cofre" width="210"> |
| <img src="docs/screenshots/13-desbloqueio-pin.png" alt="Extensão: bloqueio" width="230"> | <img src="docs/screenshots/desktop-bloqueio.png" alt="Desktop: bloqueio" width="440"> | <img src="docs/screenshots/mobile-bloqueio.png" alt="Mobile: bloqueio" width="210"> |

## 🛠️ DrivePass (Substituto do LastPass)

O DrivePass é um gerenciador de senhas multiplataforma, que sincroniza um cofre cifrado (`vault.enc`) no Google Drive. O `.csv` é só para importar/exportar manualmente (compatível com LastPass).

### 🔐 Modelo de segurança (extensão)
- Cofre local e remoto cifrados com AES-256-GCM; chave derivada da senha mestra via PBKDF2-SHA256 com 600.000 iterações (cofres antigos com 250.000 são migrados no próximo desbloqueio).
- Senha mestra de no mínimo 12 caracteres para criar um cofre novo.
- PIN de no mínimo 6 dígitos, apenas em memória (`chrome.storage.session`): some ao fechar o navegador e é apagado após 5 tentativas erradas.
- Páginas só veem os nomes de usuário do próprio site; a senha é preenchida após um clique real no ícone.
- Autofill usa o domínio informado pelo navegador (não pela página) e nunca devolve a senha salva ao verificar um login.
- ⚠️ Se você usou uma versão anterior que gravava `passwords.csv` no Drive, apague esse arquivo e a lixeira do Drive.
- A sessão aberta usa só a chave derivada em `chrome.storage.session`; ela some no bloqueio automático (15 min), ao bloquear o computador e ao fechar o navegador.
- Senhas copiadas saem da área de transferência após 30 s. Oferta de salvar login fica 60 s na memória do service worker e só grava após confirmação.

### 🚚 Migrar do LastPass
1. No LastPass: **Opções avançadas > Exportar > Arquivo CSV**.
2. No Bunker: **Ajustes > Importar CSV do LastPass** (mantém pastas, notas seguras e códigos 2FA). Apague o CSV depois.
3. Sincronização entre computadores: `node scripts/setup-drive-oauth.mjs` e [docs/SETUP.md](docs/SETUP.md).

### ✅ Homologação
`cd apps/extension && npm test && npm run e2e` roda a extensão real no Chromium (criar cofre, importar CSV, 2FA, busca, gerador, saúde do cofre, autofill, salvar login, PIN, bloqueio automático, tema escuro por padrão e tema claro opcional) e grava os prints em [docs/screenshots](docs/screenshots). `npm run e2e:security` ataca a extensão como uma página hostil e um ladrão de disco; o relatório está em [docs/SECURITY.md](docs/SECURITY.md).
- Extensão (Firefox/Chrome)
- App Desktop (Electron - offline)
- Android APK (React Native / Expo, Android Autofill Framework, Sincronização Automática com Google Drive)
- Features de Paridade com o LastPass mapeadas no ROADMAP: Painel de Segurança, Passkeys, Login sem senha e SaaS Protect.

## 🛠️ Tech Stack

- **Structure**: Monorepo
- **Documentation**: Markdown-driven
- **Automation**: Bash + Python
- **Release**: GitHub Actions + Release Please

## 🛡️ Antigravity Protocol

This project follows the **Antigravity** code standards:
- **Modular Apps**: Each application in `apps/` is strictly isolated.
- **150-Line Limit**: Applied to all management scripts in the `scripts/` directory.
- **Strict Verification**: Every change must pass the `verification/` suite.

## 🔄 Current Progress & Next Steps (CRON Loop)

**Progress**:
- Completed all features mapped out in the Roadmap (Phases 1 through 5).
- Achieved CSV encryption parity across all clients (Browser Extension, Desktop, Mobile) using AES-256-GCM natively.
- Resolved and stabilized all monorepo test pipelines and type checks.
- Cleaned up the repository state and verified builds across all targets.

**Known Bugs**:
- None explicitly identified currently.

**Next Tasks**:
- The project has entered the long-term maintenance phase.
- Periodic updates for dependency bumps and continued code health optimizations.

---

*"Security is not a feature; it is the foundation."*
