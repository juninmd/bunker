# Changelog

Todas as mudanças relevantes deste projeto serão documentadas aqui.

O formato segue o padrão Keep a Changelog e versionamento semântico.

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
