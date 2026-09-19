# Guia de Configuração e Instalação

O BunkerPass utiliza a API do Google Drive para sincronização. Para que a extensão funcione corretamente, você precisa configurar um projeto no Google Cloud Console e obter um OAuth 2.0 Client ID.

## Pré-requisitos

- Uma conta Google.
- Acesso ao [Google Cloud Console](https://console.cloud.google.com/).
- Node.js instalado (para desenvolvimento).

## Passo a Passo

### 1. Criar Projeto no Google Cloud

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. Crie um novo projeto (ex: `bunkerpass-user`).
3. Selecione o projeto recém-criado.

### 2. Ativar a API do Google Drive

1. No menu lateral, vá em **APIs e Serviços** > **Biblioteca**.
2. Pesquise por "Google Drive API".
3. Clique em **Ativar**.

### 3. Configurar a Tela de Consentimento OAuth

1. Vá em **APIs e Serviços** > **Tela de permissão OAuth**.
2. Selecione **Externo** (ou Interno se tiver uma organização Google Workspace) e clique em **Criar**.
3. Preencha as informações obrigatórias (Nome do App, Email de suporte, etc.).
4. Clique em **Salvar e Continuar**.
5. Em **Escopos**, adicione o escopo: `https://www.googleapis.com/auth/drive.file`.
   - *Este escopo permite que o app acesse apenas os arquivos criados por ele mesmo, garantindo mais segurança.*
6. Adicione seu próprio email como **Usuário de Teste**.

### 4. Fixar o ID da extensão

O Google amarra o Client ID ao ID da extensão, então ele precisa ser o mesmo em todo computador:

```bash
cd apps/extension && npm ci && npm run build && cd ../..
node scripts/setup-drive-oauth.mjs
```

O script cria uma chave privada em `~/.bunker/extension-key.pem` (fora do repositório; guarde uma cópia no próprio cofre), grava a chave pública em `manifest.json` e mostra o ID da extensão.

### 5. Criar o Client ID

1. Vá em **APIs e Serviços** > **Credenciais** > **Criar Credenciais** > **ID do cliente OAuth**.
2. Em **Tipo de aplicativo**, escolha **Extensão do Chrome** e cole o ID mostrado pelo script.
3. Copie o **ID do cliente** gerado e grave no manifest:

```bash
node scripts/setup-drive-oauth.mjs --client-id 1234567890-abc123.apps.googleusercontent.com
```

### 6. Instalar e Rodar

1. No Chrome, vá em `chrome://extensions` e ative o **Modo do desenvolvedor**.
2. Clique em **Carregar sem compactação** e selecione `apps/extension`.
3. Abra o Bunker, crie o cofre e use **Ajustes > Sincronizar com o Google Drive**.

No Drive fica só `vault.enc`: o cofre cifrado com AES-256-GCM e a chave derivada da senha mestra (PBKDF2-SHA256, 600 mil iterações). Nenhuma senha sai do navegador em texto puro.

## Resolução de Problemas

- **Erro "client_id not found" ou "bad client id"**: rode o script de novo com `--client-id` e confira se o ID da extensão em `chrome://extensions` é o mesmo que o script mostrou.
- **Erro de permissão no login**: Verifique se seu email está adicionado como usuário de teste na tela de consentimento OAuth.
