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
- **Sincronização com Google Drive**: O diferencial é o salvamento off-line das senhas no Google Drive, em uma planilha `.csv`.
- **GitHub Actions Integration**: Automated generation of releases and tags, keeping the README.md updated via scripts.

## 🛠️ DrivePass (Substituto do LastPass)

O DrivePass é um gerenciador de senhas multiplataforma, que armazena os dados em um `.csv` no Google Drive.
- Extensão (Firefox/Chrome)
- App Desktop (Electron - offline)
- Android APK (React Native / Expo)
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
- Implemented Automatic Background Device Sync for the browser extension to synchronize vault items without manual user interaction.
- Verified Password History feature and officially updated roadmap mapping.
- Implemented Account Recovery mechanism for the browser extension using a securely generated high-entropy code.
- Implemented PIN Unlock feature for the browser extension, allowing quick access via a short PIN.
- Migrated Extension UI scripts (`popup.ts`, `content.ts`) to TypeScript and reconstructed `vault-service.ts`, completing Phase 1 TypeScript migration. Emitted `.js` files are now properly ignored in version control.
- Migrated Extension core (`background.ts`) and all services (`auth-service.ts`, `credential-service.ts`, `google-drive.ts`, `sync-service.ts`) to TypeScript.
- Migrated Extension utilities (`csv-utils`, `crypto`, `password-generator`, `username-generator`) to TypeScript and established in-place build pipeline.
- Analyzed Passkeys (WebAuthn) requirements; determined it requires a complex background proxy architecture. Feature deferred in favor of core structural migrations.
- Implemented secure Biometric Unlock (Fingerprint/FaceID) for Android App using `expo-local-authentication` and `expo-secure-store`.
- Migrated Desktop Application (`apps/desktop`) to TypeScript, renaming files to `.ts`, configuring `tsconfig.json` for ES2022+ module compatibility, and updating Electron build process.
- Updated `apps/desktop/src/main.ts` with explicit security preferences (`webviewTag: false`).
- Migrated Android Application (`apps/android`) to TypeScript, converting `.js` files to `.tsx` / `.ts` and configuring `tsconfig.json`.

**Known Bugs**:
- None explicitly identified currently.

**Next Tasks**:

- Map and implement pending Phase 2+ features from `ROADMAP.md` iteratively.

---

*"Security is not a feature; it is the foundation."*
