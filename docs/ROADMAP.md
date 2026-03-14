# Roadmap do BunkerPass

Este documento descreve o plano de desenvolvimento do BunkerPass para se tornar uma alternativa completa ao LastPass, com foco em privacidade, controle de dados (Google Drive) e suporte multiplataforma.

## Visão Geral

O objetivo é fornecer uma experiência similar ao LastPass, mas onde o usuário possui total controle sobre seus dados, armazenados no seu próprio Google Drive.
**O grande diferencial** é o armazenamento híbrido que garante interoperabilidade e backup legível:

1.  **Planilha CSV (`passwords.csv`):** O usuário pode visualizar e editar suas senhas diretamente no Google Drive (via Google Sheets ou download). O BunkerPass mantém esse arquivo sincronizado bidirecionalmente.
    - *Nota:* O CSV pode ser visualizado como texto plano para facilidade de uso, ou conter campos criptografados dependendo da configuração de segurança do usuário (Fase 2).
2.  **Cofre Criptografado (`vault.enc`):** Fonte da verdade para a segurança (criptografia ponta a ponta), garantindo que metadados sensíveis não fiquem expostos e servindo como cache principal.

## Fases de Desenvolvimento

### Fase 1: Fundação e Extensão MVP (Atual)
Foco nas funcionalidades essenciais de um gerenciador de senhas.
- [x] **Cofre Local Seguro:** Criptografia AES-GCM (PBKDF2/Argon2 para derivação de chave), garantindo acesso offline rápido.
- [x] **Integração Google Drive:** Autenticação OAuth 2.0 e acesso ao escopo de arquivos.
- [x] **Sincronização Bidirecional com Planilha CSV:**
  - Exportação automática para `passwords.csv` no Drive.
  - Importação de alterações do CSV (adições, edições e exclusões com "Soft Delete").
  - Estratégia de resolução de conflitos baseada em carimbo de data/hora (`modifiedTime`).
- [x] **Popup de Gerenciamento:** Interface básica para listar, adicionar, editar (v0.1.0) e remover senhas.
- [x] **Gerador de Senhas:** Algoritmo seguro (CSPRNG) implementado.
- [x] **Persistência do Gerador:** Salvar preferências de geração (tamanho, caracteres) do usuário.
- [x] **Autofill Básico:** Detecção de campos de login e preenchimento via menu de contexto ou atalho.
- [x] **CI/CD:** Pipelines de release automatizados (GitHub Actions) e versionamento semântico.
  - [x] Geração automática de releases e tags (`release-please`).
  - [x] Atualização automática do README com a versão atual.
- [x] **Tipos de Item:** Suporte inicial para "Senhas" e "Notas Seguras".
- [x] **Infraestrutura de Testes:** Testes unitários configurados para lógica de CSV e Criptografia.

### Fase 2: Paridade de Features (LastPass Replacement)
Foco em igualar as funcionalidades de conveniência e organização.
- [x] **Organização por Pastas/Grupos:**
  - Implementar campo `grouping` no schema e UI.
  - Visualização hierárquica no Popup.
- [x] **Gerador de nome de usuário:** Gerar nomes de usuário aleatórios e exclusivos.
- [ ] **Tipos de Itens Distintos:**
  - **Notas Seguras:** Suporte dedicado para notas criptografadas (não apenas campo extra).
  - [x] **Endereços e Cartões:** Perfis de preenchimento de formulários (Form Fills).
  - [x] **Cartões de Pagamento:** Armazenamento seguro de CVV e dados bancários.
- [ ] **Chaves de Acesso (Passkeys):** Suporte nativo para criar, armazenar e gerenciar passkeys (WebAuthn).
- [ ] **UX Aprimorada:**
  - [x] **Ícone In-Field:** Botão do BunkerPass dentro dos inputs de login para preenchimento com um clique.
  - [x] **Detector de Mudança de Senha:** Pop-up perguntando "Deseja atualizar esta senha?" ao submeter formulários.
- [~] **Segurança Avançada:**
  - [x] **Logout Automático:** Configuração de timeout por inatividade.
  - [ ] **Desbloqueio com PIN/Biometria:** Opção de PIN curto para acesso rápido (se suportado pelo navegador/OS).

### Fase 3: Auditoria e Monitoramento (Security Dashboard & Dark Web)
Foco na proatividade da segurança.
- [x] **Painel de Segurança (Security Score):**
  - Análise de força das senhas (fracas, antigas).
  - Identificação de senhas reutilizadas.
- [ ] **Monitoramento da Dark Web:**
  - Alertas se informações ou senhas do usuário forem encontradas em vazamentos conhecidos na dark web.
- [ ] **Histórico de Senhas:** Manter histórico de alterações para permitir reversão.
- [ ] **Testamento Digital (Digital Will):** Preparar uma cópia segura dos acessos.
- [ ] **Compartilhe credenciais com segurança:** Compartilhe credenciais com segurança.
- [ ] **Sincronização automática de dispositivos:** Sincronização constante de cofres através de multiplos dispositivos.
- [x] **Notas seguras:** Armazenamento seguro de anotações confidenciais.
- [ ] **Login sem senha no cofre:** Passkeys ou FIDO2 para acesso ao cofre.
- [x] **Salvar e preencher automaticamente no Google Chrome:** Extensão compatível com Chrome.
- [ ] **Salvar e preencher automaticamente no Android:** Autopreenchimento no Android via Accessibility ou Autofill API.
- [ ] **Salvar e preencher automaticamente no iPhone e no iPad:** Autopreenchimento no iOS via Credential Provider Extension.
- [ ] **Salvar e preencher automaticamente no Safari:** Extensão compatível com Safari.
- [x] **Salvar e preencher automaticamente no Mozilla Firefox:** Extensão compatível com Firefox.
- [x] **Painel de Segurança (Security Dashboard):** Avaliação de score de segurança, senhas fracas, reutilizadas ou antigas.

### Fase 4: Compartilhamento, Teams & Emergência
Foco em funcionalidades colaborativas usando a infraestrutura do Google Drive.
- [ ] **Compartilhamento de Senhas Pessoais e Empresariais:**
  - Compartilhamento de senhas pessoais.
  - Compartilhamento de senhas empresariais.
  - Compartilhar item específico criando um arquivo criptografado separado e compartilhando via permissões do Drive.
  - Pastas Compartilhadas: Sincronização de arquivos CSV específicos de pastas do Drive (ex: `family-passwords.csv`, `team-passwords.csv`).
- [ ] **Acesso de Emergência:** Acesso de emergência.
  - Configurar contatos de confiança (entes queridos) que podem solicitar acesso ao cofre de senhas em caso de emergência.
- [ ] **Gerenciamento de Usuários e Integração de Diretórios (Business):**
  - Controle centralizado de políticas, integração com Active Directory/LDAP e Logon Único (SSO Federado).
- [ ] **Workstation MFA:** Expansão da autenticação multifatorial para estações de trabalho (Login seguro no Windows/Mac).
- [ ] **SaaS Protect:** Monitoramento e restrição a aplicativos SaaS perigosos ou não homologados.
- [ ] **Acesso Seguro:** VPN corporativa ou proxy de autenticação integrado.
- [ ] **Autenticação multifatorial (MFA):** Suporte nativo a 2FA (TOTP, YubiKey) e chaves de segurança.
- [ ] **Login sem senha no cofre:** Acessar facilmente o cofre sem precisar digitar a senha mestre (via dispositivo móvel ou biometria).

### Fase 5: Expansão Multiplataforma
Levar o cofre para fora do navegador com experiência nativa.
- [~] **App Desktop (Electron/Tauri):**
  - [x] Estrutura inicial (Electron) e build automatizado.
  - [ ] Wrapper da lógica da extensão.
  - [ ] Atalho global para preenchimento em apps nativos.
  - [ ] Funcionamento offline robusto com `file://` ou SQLite local.
- [ ] **App Android (React Native):**
  - Integração com Autofill Framework do Android.
  - Acesso biométrico (Fingerprint/FaceID) para desbloqueio.
  - Sincronização direta com o arquivo `passwords.csv` e `vault.enc` no Google Drive.
  - **APK:** Geração automatizada de APK via GitHub Actions.
- [ ] **App iOS:** Portabilidade da versão React Native para iOS.

## Detalhes Técnicos

### Estratégia de Sync com CSV
O arquivo `passwords.csv` no Google Drive atua como uma interface de usuário secundária.
1. **Leitura:** O usuário pode abrir o CSV no Google Sheets para ver suas senhas (útil em dispositivos onde não tem a extensão instalada).
2. **Escrita:** O usuário pode adicionar uma linha no Sheets (ex: `facebook.com, user, pass123, note, , Social`).
3. **Sincronização:** O BunkerPass verifica periodicamente o `modifiedTime` do arquivo CSV. Se for mais recente que a última sincronização local, o app baixa o CSV, faz o parse e atualiza o cofre local (`vault.enc` é atualizado em seguida).
4. **Soft Deletes:** Itens excluídos são mantidos no CSV com `Grouping='Deleted'` para permitir restauração e sincronização correta entre dispositivos.

### Tipos de Dados no CSV
Para manter compatibilidade com importadores (LastPass CSV), usamos convenções:
- **Senhas:** `url`, `username`, `password`, `extra`, `name`, `grouping`, `fav`.
- **Notas Seguras:** `url` é definido como `http://sn`. O Título vai em `username` e o conteúdo em `extra` (notas). `grouping` define a pasta.

### Segurança do CSV
Por padrão, para conveniência (como solicitado), o CSV contém as senhas em texto plano.
- **Aviso:** O usuário será alertado sobre os riscos de manter o CSV em texto plano.
- **Opção Segura:** Implementar uma configuração "Criptografar CSV" onde o conteúdo das células sensíveis é cifrado, mantendo a estrutura de linhas/colunas para organização, mas ocultando os segredos.

### Stack Tecnológica
- **Extensão:** JavaScript (ES Modules), HTML, CSS, Web Crypto API.
- **Desktop:** Electron (Node.js).
- **Mobile:** React Native (Expo).
- **CI/CD:** GitHub Actions, Release Please.

### DevOps e Release Automático
O projeto utiliza GitHub Actions para automatizar o ciclo de vida do software:
- **Build e Teste:** Validação contínua a cada push (Testes Unitários).
- **Versionamento Semântico:** `release-please` analisa commits convencionais para determinar a próxima versão (patch, minor, major).
- **Tags e Releases:** Gera tags git e GitHub Releases automaticamente.
- **Artefatos:**
  - Extensão (`.zip`)
  - Desktop (`.zip` / `.dmg` / `.exe` futuramente)
  - Android (`.apk`)
