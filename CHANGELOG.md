# Changelog

Todas as mudanças relevantes deste projeto serão documentadas aqui.

O formato segue o padrão Keep a Changelog e versionamento semântico.

## 1.0.0 (2026-03-10)


### Features

* add CI/CD workflows and desktop app structure ([1791db3](https://github.com/juninmd/bunker/commit/1791db30345050a3e8b805daf1c353972d836f94))
* add credit card support and update docs ([7ebd2cb](https://github.com/juninmd/bunker/commit/7ebd2cb34748d2c0e46741be4b413e5c1f8cec7b))
* add CSV import sync and autofill content scripts ([ba0b204](https://github.com/juninmd/bunker/commit/ba0b204de84c76234061a397472fa2173f5e943c))
* add edit credential feature and update roadmap ([6af6cb3](https://github.com/juninmd/bunker/commit/6af6cb3b4da2debb4a16e1a7376aaf26529dbefc))
* add roadmap and password generator ([e607dfd](https://github.com/juninmd/bunker/commit/e607dfdf9618fe1c62276b45c06cc9abf81a9bfa))
* add secure notes and update roadmap/CI ([f4bb78f](https://github.com/juninmd/bunker/commit/f4bb78fb0b1b30506632958467e5e6bdf36d1987))
* add Security Dashboard (Painel de Segurança) ([17f80fe](https://github.com/juninmd/bunker/commit/17f80fe30ca433b830d8e3a31a66c76b1c9788dd))
* add username generator and update roadmap with LastPass features ([85fe87d](https://github.com/juninmd/bunker/commit/85fe87d3d4dec220e2a2ed6c6b9969f6e397ba0d))
* define product roadmap and automated release workflows ([8e7d361](https://github.com/juninmd/bunker/commit/8e7d3615b65b9ede8757eff152d804cd9e011ff9))
* enhance roadmap and fix csv sync logic for empty usernames ([1df7edb](https://github.com/juninmd/bunker/commit/1df7edb08a469321ba74628039c59af0caa9b0c8))
* enhance roadmap, add password strength meter, and automate release process ([2b4166b](https://github.com/juninmd/bunker/commit/2b4166b9a4cbfc69d733f959e8f67076aa1e8910))
* Implement auto-lock functionality for the vault ([41f84d9](https://github.com/juninmd/bunker/commit/41f84d90b0ac847d0b9cebf431d8fce56e471df3))
* implement credential capture and save flow ([aed90ee](https://github.com/juninmd/bunker/commit/aed90eed2c8e413089d6c85bb1436438e59cf084))
* implement csv sync and update roadmap ([b5cd317](https://github.com/juninmd/bunker/commit/b5cd317e12966a1788f630951edaf07adf1125d8))
* implement Google Drive sync for passwords ([e5c63e2](https://github.com/juninmd/bunker/commit/e5c63e219e32cb4003a8c28dc199102fbe0c39a9))
* implement google drive sync with encrypted vault and csv backup ([d790e21](https://github.com/juninmd/bunker/commit/d790e211204d135e7b1c5d798163d48ff45ca72f))
* implement in-field autofill icon for password fields ([b854c6b](https://github.com/juninmd/bunker/commit/b854c6b3550e31b091fe76baaa3ffd270d75e27e))
* implement intelligent sync with csv tombstones and soft deletes ([6979212](https://github.com/juninmd/bunker/commit/69792122b53d3b1875de115a6d8a81a7250e91b7))
* implement password generator and enhance autofill ([aa028f7](https://github.com/juninmd/bunker/commit/aa028f7816976fc0333c4b7159ba5079a8b32538))
* implement roadmap and enhance sync logic ([6a1c954](https://github.com/juninmd/bunker/commit/6a1c954235d1c251cd486c385db630b75243e805))
* Improve CSV Sync robustness and add Quick Search ([c322e17](https://github.com/juninmd/bunker/commit/c322e174dc20c5aabaec1db00b719a60cd4f9ae0))
* roadmap update, CI/CD readme sync, and CSV tests ([7324399](https://github.com/juninmd/bunker/commit/73243991e6fe33e579f0ca41a3fd58d485c36be1))
* update roadmap and add username generator ([ae21aff](https://github.com/juninmd/bunker/commit/ae21aff26250e1e7696802f99d8625f887b82691))
* update roadmap and implement credential grouping ([1bc1b65](https://github.com/juninmd/bunker/commit/1bc1b65075339884587fbb59ed517597b241ccbe))
* update roadmap and implement Secure Notes ([aa64fd3](https://github.com/juninmd/bunker/commit/aa64fd39e36d480d8199da0c273868922d5cfff3))
* update roadmap, add generator persistence, and enhance CSV sync ([85e81a1](https://github.com/juninmd/bunker/commit/85e81a18b06f73eec05e3e5a086495197b35bf0a))


### Bug Fixes

* correct repository link in update-readme.js ([83d1f60](https://github.com/juninmd/bunker/commit/83d1f60cdd32fd320461c6c177b896f73f07a0a9))
* melhorar mvp da extensão e limpar artefatos versionados ([3195932](https://github.com/juninmd/bunker/commit/3195932584daa15102530e5424ee4651db001f02))

## [Unreleased]

### Added
- Estrutura inicial da extensão browser em `apps/extension` com popup, CRUD inicial (incluindo remoção) e armazenamento criptografado local.
- Scaffolds iniciais para módulos `apps/desktop` e `apps/android`.
- Script de empacotamento `scripts/package-extension.sh`.

### Changed
- Workflow de build/release para publicar artefatos em tags semânticas (`vX.Y.Z`) com checksums.
- CI com validação de manifest da extensão e arquivos-base.
- README e roadmap atualizados com plano por fases, status de implementação e ajustes de segurança/empacotamento.


### Fixed
- Remoção do artefato de build versionado acidentalmente (`dist/*.zip`) e inclusão de `.gitignore` para evitar recorrência.
