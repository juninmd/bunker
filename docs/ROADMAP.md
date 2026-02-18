# Roadmap de funcionalidades — BunkerPass

> Objetivo: substituir o LastPass com foco em extensão browser + app desktop + app Android, sincronizando cofre criptografado com Google Drive (Sheets + CSV), com operação offline-first.

## 1) Princípios de produto

- **Zero-knowledge**: nenhuma senha em texto puro fora do dispositivo.
- **Offline-first**: leitura e preenchimento rápido sem internet.
- **Multiplataforma real**: Chrome, Firefox, Desktop e Android.
- **Portabilidade**: import/export em CSV e backup verificável.
- **Segurança por padrão**: MFA, políticas fortes e auditoria.

## 2) Mapa de features (inspirado em funcionalidades do LastPass)

## 2.1 Cofre de senhas

- Cadastro manual de credenciais (site, usuário, senha, notas).
- Pastas e tags para organização.
- Busca full-text por domínio, título e tags.
- Favoritos e itens recentes.
- Histórico de versões por item (com rollback).

## 2.2 Geração de senhas

- Gerador com regras: tamanho, símbolos, pronúncia opcional.
- Perfis de geração (ex.: bancos, redes sociais, devops).
- Avaliação de força em tempo real.

## 2.3 Preenchimento automático (autofill)

- Detecção inteligente de formulários de login.
- Fill de múltiplos campos (usuário/senha/OTP quando aplicável).
- Captura automática de novas credenciais no submit.
- Atualização de senha detectada (password change flow).

## 2.4 Segurança e autenticação

- Senha mestra obrigatória.
- PBKDF2 (MVP) → Argon2id (Futuro) para derivação de chave.
- Cofre criptografado com AES-GCM (MVP) → XChaCha20-Poly1305 (Futuro).
- Bloqueio automático por tempo/inatividade.
- Biometria no desktop/mobile (quando disponível).
- MFA para desbloqueio de conta (TOTP/WebAuthn).
- Lista de dispositivos confiáveis e revogação remota.

## 2.5 Auditoria de segurança

- Dashboard de saúde das senhas:
  - senhas fracas
  - reutilizadas
  - antigas
  - potencialmente vazadas (integração HIBP por hash k-anon)
- Score de segurança por usuário.
- Recomendações automáticas priorizadas por risco.

## 2.6 Compartilhamento e colaboração

- Compartilhamento seguro de credenciais entre usuários.
- Cofres compartilhados (família/equipe).
- Permissões por papel (leitura, edição, admin).
- Revogação imediata de acesso.

## 2.7 Recuperação de conta

- Kit de recuperação com frases/chaves de recuperação.
- Contatos de emergência configuráveis.
- Fluxo anti-sequestro com delay e notificações.

## 2.8 Sincronização Google Drive (diferencial)

- Armazenamento de índice em **Google Sheets** (metadados não sensíveis).
- Exportação/snapshot em **CSV** para portabilidade.
- Arquivo canônico criptografado (`vault.enc`) no Google Drive.
- Sincronização incremental por `record_version` + `updated_at`.
- Estratégia de conflitos:
  - last-writer-wins para campos não sensíveis
  - merge assistido para colisões relevantes
- Logs de sync, retries e fila local.

## 2.9 Offline e performance

- Cache local criptografado de leitura instantânea.
- Fila de operações offline (create/update/delete).
- Reconciliador em background ao reconectar.
- Meta de desbloqueio local < 300ms em dispositivo médio.

## 2.10 UX e produtividade

- **Acesso Rápido (Quick Access):** Atalho de teclado (`Ctrl/Cmd + Shift + Y`) para abrir o cofre instantaneamente.
- Quick search dentro do popup.
- Atalhos globais no desktop.
- Tema dark/light e acessibilidade (WCAG AA).
- Onboarding guiado com checklist de migração.

## 2.11 Compliance e observabilidade

- Telemetria opcional e anonimizada.
- Logs de segurança auditáveis localmente.
- Relatórios de incidente e trilha de eventos.

## 3) Matriz de priorização (MVP → paridade LastPass)

| Feature | MVP Extensão | Desktop | Android | Paridade avançada |
|---|---:|---:|---:|---:|
| Cofre local criptografado | ✅ | ✅ | ✅ | ✅ |
| Gerador de senha | ✅ | ✅ | ✅ | ✅ |
| Autofill básico | ✅ | ✅ | ✅ | ✅ |
| Sync Google Drive (`vault.enc`) | ✅ | ✅ | ✅ | ✅ |
| Índice no Google Sheets | ⚠️ parcial | ✅ | ✅ | ✅ |
| Snapshot CSV | ✅ | ✅ | ✅ | ✅ |
| Segurança (MFA/WebAuthn) | ❌ | ❌ | ❌ | ✅ |
| Compartilhamento de cofre | ❌ | ❌ | ❌ | ✅ |

## 4) Roadmap por fases

## Fase 0 — Fundação (Semanas 1–3)

- Definição do modelo de dados do cofre.
- Biblioteca criptográfica compartilhada (Rust/WASM).
- Estrutura monorepo e padrões de commit/release.
- POC de sincronização com Google Drive.

**Entregáveis**
- Especificação de dados v1.
- CLI de teste para criptografar/decriptar cofre.
- Documento de threat model inicial.

## Fase 1 — MVP Extensão (Semanas 4–8)

- Extensão Chrome/Firefox com:
  - login local por senha mestra
  - CRUD de credenciais
  - autofill básico
  - gerador de senha
- Cache offline criptografado.
- **Sync Manual com Google Drive e CSV (Diferencial):**
  - **Fluxo de Sincronização Detalhado:**
    1. Autenticação via `chrome.identity`.
    2. Verificação de existência do arquivo `vault.enc` no Google Drive.
    3. Se existir:
       - Download do conteúdo criptografado.
       - Decriptografia local.
       - Merge com o cofre local (união de registros, preferência por data de atualização mais recente).
    4. Geração de arquivo CSV (`passwords.csv`) com os dados do cofre (para visibilidade do usuário).
    5. Criptografia do cofre mergeado.
    6. Upload do novo `vault.enc` e `passwords.csv` para o Google Drive.
    7. Atualização do cache local.

**Critério de saída**
- Usuário consegue migrar CSV, usar offline e sincronizar manualmente.

## Fase 2 — Sync robusto e segurança (Semanas 9–12)

- Sync incremental automático.
- Resolução de conflitos e reprocessamento de fila.
- Dashboard de senhas fracas/reutilizadas.
- MFA (TOTP) e gerenciamento de sessões/dispositivos.

**Critério de saída**
- Sistema resiliente com retries, métricas e recuperação de falha.

## Fase 3 — Desktop App (Semanas 13–16)

- App desktop (Tauri) com paridade da extensão.
- Atalhos globais, desbloqueio biométrico (quando suportado).
- Import/export avançado e backups agendados.

**Critério de saída**
- Desktop pronto para uso diário como cofre principal.

## Fase 4 — Android APK (Semanas 17–22)

- App Android com:
  - cofre local
  - unlock biométrico
  - autofill service Android
  - sync em background
- Hardening para armazenamento seguro no dispositivo.

**Critério de saída**
- APK beta com autofill funcional em apps e navegador mobile.

## Fase 5 — Colaboração e escala (Semanas 23–30)

- Cofres compartilhados e permissões.
- Compartilhamento seguro e revogação.
- Observabilidade avançada + SLOs de sync.

**Critério de saída**
- Produto competitivo para famílias e pequenos times.

## 5) Backlog técnico prioritário

- Motor de matching de domínio/subdomínio para autofill.
- Criptografia de campos sensíveis por registro.
- Índice local com busca rápida e normalização de URL.
- Módulo de importadores (LastPass/1Password/Bitwarden CSV).
- Testes de compatibilidade Manifest V3 em Chrome/Firefox.

## 6) Início da implementação (status)

- ✅ `apps/extension`: popup funcional para unlock e CRUD local criptografado.
- ✅ `apps/extension`: Sincronização básica com Google Drive (vault.enc + passwords.csv).
- ✅ `scripts/package-extension.sh`: geração de `.zip` para release.
- ✅ `build-and-publish.yml`: publicação automática de artefatos por tag.
- ✅ `content_scripts`: detecção de formulário e captura de credenciais (save flow).
- ⏳ Próximo passo técnico: Melhorar autofill e implementar sync automático.

## 7) KPIs de sucesso

- Tempo médio de desbloqueio local.
- Taxa de sucesso de autofill.
- Latência média de sincronização.
- Taxa de conflitos por 1.000 operações.
- Taxa de erro de release e rollback.

## 8) Riscos e mitigação

- **Limites de API Google** → cache agressivo + retries exponenciais.
- **Conflitos de sync** → modelo de versão por item + UI de merge.
- **UX de migração complexa** → wizard guiado e validações automáticas.
- **Ataques de phishing** → validação de domínio rigorosa e alertas.
