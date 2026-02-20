# Roadmap do BunkerPass

Este documento descreve o plano de desenvolvimento do BunkerPass para se tornar uma alternativa completa ao LastPass, com foco em privacidade, controle de dados (Google Drive) e suporte multiplataforma.

## Visão Geral

O objetivo é fornecer uma experiência similar ao LastPass, mas onde o usuário possui total controle sobre seus dados, armazenados no seu próprio Google Drive.

## Fases de Desenvolvimento

### Fase 1: Fundação e Extensão MVP (Atual)
- [x] Criação do Cofre Local (Criptografia AES-GCM).
- [x] Integração com Google Drive API.
- [x] Sincronização Manual (`vault.enc` e `passwords.csv`).
- [x] Popup Básico (Listagem/Adição).
- [x] Script de Content Básico (Captura/Preenchimento simples).
- [x] CI/CD com GitHub Actions e Release Please.

### Fase 2: Experiência do Usuário (Extensão v1.0)
Foco em igualar as funcionalidades essenciais do dia-a-dia do LastPass.
- [ ] **Gerador de Senhas Seguro:** Interface no popup para criar senhas fortes customizáveis.
- [ ] **Autopreenchimento Aprimorado:** Ícone do BunkerPass dentro dos campos de login para seleção rápida de contas múltiplas.
- [ ] **Notas Seguras:** Tipo de item para guardar textos sensíveis (chaves SSH, anotações).
- [ ] **Busca e Filtragem:** Busca instantânea no popup por nome ou site.
- [ ] **Detector de Login Aprimorado:** Melhorar a heurística para detectar novos logins e atualizações de senha.
- [ ] **Sincronização Automática:** Sync em background periódico e ao detectar alterações.

### Fase 3: Expansão Multiplataforma
Levar o cofre para fora do navegador.
- [ ] **App Desktop (Electron/Tauri):**
  - Wrapper da lógica da extensão.
  - Atalho global para preenchimento em apps nativos.
  - Funcionamento offline robusto.
- [ ] **App Android (React Native):**
  - Integração com Autofill Framework do Android.
  - Acesso biométrico (Fingerprint/FaceID) para desbloqueio.
  - Sincronização com o mesmo arquivo no Google Drive.

### Fase 4: Funcionalidades Avançadas
- [ ] **Compartilhamento Seguro:** Mecanismo para compartilhar senhas criptografadas com outros usuários (via link ou email).
- [ ] **Auditoria de Segurança:** Painel que identifica senhas fracas, reutilizadas ou vazadas (HaveIBeenPwned).
- [ ] **Acesso de Emergência:** Permitir que uma conta confiável solicite acesso após período de inatividade.
- [ ] **Importação/Exportação:** Ferramentas para migrar do LastPass/Bitwarden facilmente.

## Detalhes Técnicos Importantes

- **Armazenamento:** A "fonte da verdade" é o arquivo `vault.enc` no Google Drive.
- **CSV:** Um arquivo `.csv` legível (mas com senhas protegidas ou opção de plaintext sob risco do usuário) é mantido sincronizado para permitir backup fácil e interoperabilidade, conforme requisito do projeto.
- **Criptografia:** Tudo ocorre no cliente (End-to-End Encryption). A chave nunca sai do dispositivo.

