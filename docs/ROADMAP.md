# Roadmap do BunkerPass

Este documento descreve o plano de desenvolvimento do BunkerPass para se tornar uma alternativa completa ao LastPass, com foco em privacidade, controle de dados (Google Drive) e suporte multiplataforma.

## Visão Geral

O objetivo é fornecer uma experiência similar ao LastPass, mas onde o usuário possui total controle sobre seus dados, armazenados no seu próprio Google Drive.
**O grande diferencial** é o armazenamento híbrido:
1.  **Cofre Criptografado (`vault.enc`):** Fonte da verdade, seguro.
2.  **Planilha CSV (`passwords.csv`):** Espelho legível (opcionalmente) para fácil acesso e edição em massa, sincronizado bidirecionalmente.

## Fases de Desenvolvimento

### Fase 1: Fundação e Extensão MVP (Atual)
- [x] Criação do Cofre Local (Criptografia AES-GCM).
- [x] Integração com Google Drive API (OAuth 2.0).
- [x] **Sincronização Manual Híbrida:**
  - Leitura/Escrita de `vault.enc` (segurança).
  - Leitura/Escrita de `passwords.csv` (acessibilidade).
- [x] Popup Básico (Listagem/Adição/Remoção).
- [x] Script de Content Básico (Captura/Preenchimento simples).
- [x] CI/CD com GitHub Actions e Release Please.

### Fase 2: Experiência do Usuário (Extensão v1.0)
Foco em igualar as funcionalidades essenciais do dia-a-dia do LastPass.
- [ ] **Notas Seguras:** Campo "Notes" nos itens e mapeamento para a coluna `extra` no CSV.
- [ ] **Gerador de Senhas Seguro:** Interface no popup para criar senhas fortes customizáveis (já implementado, falta persistência de opções).
- [ ] **Autopreenchimento Aprimorado:** Ícone do BunkerPass dentro dos campos de login para seleção rápida de contas múltiplas.
- [ ] **Busca e Filtragem:** Busca instantânea no popup por nome ou site (Já implementado).
- [ ] **Detector de Login Aprimorado:** Melhorar a heurística para detectar novos logins e atualizações de senha.
- [ ] **Sincronização Automática:** Sync em background periódico e ao detectar alterações no CSV remoto.

### Fase 3: Expansão Multiplataforma
Levar o cofre para fora do navegador.
- [ ] **App Desktop (Electron/Tauri):**
  - Wrapper da lógica da extensão.
  - Atalho global para preenchimento em apps nativos.
  - Funcionamento offline robusto com `file://` ou SQLite local.
- [ ] **App Android (React Native):**
  - Integração com Autofill Framework do Android.
  - Acesso biométrico (Fingerprint/FaceID) para desbloqueio.
  - Sincronização direta com o arquivo `vault.enc` no Google Drive.

### Fase 4: Funcionalidades Avançadas
- [ ] **Compartilhamento Seguro:** Mecanismo para compartilhar senhas criptografadas com outros usuários (via link ou email).
- [ ] **Auditoria de Segurança:** Painel que identifica senhas fracas, reutilizadas ou vazadas (HaveIBeenPwned).
- [ ] **Acesso de Emergência:** Permitir que uma conta confiável solicite acesso após período de inatividade.
- [ ] **Histórico de Senhas:** Manter versões anteriores de senhas no `vault.enc` (e talvez uma aba extra no CSV).

## Detalhes Técnicos Importantes

- **Armazenamento:** A "fonte da verdade" é o arquivo `vault.enc` no Google Drive.
- **CSV:** Um arquivo `.csv` legível é mantido sincronizado para permitir backup fácil e interoperabilidade.
  - *Fluxo de Sync:* Ao sincronizar, o app baixa o CSV, compara timestamps ou hashes, mescla com o cofre local e envia de volta as atualizações.
- **Criptografia:** Tudo ocorre no cliente (End-to-End Encryption). A chave nunca sai do dispositivo.
- **Offline First:** O app funciona 100% offline usando o cache local (`chrome.storage.local`). A sincronização ocorre quando há conexão.
