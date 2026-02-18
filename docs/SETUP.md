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

### 4. Criar Credenciais (Client ID)

1. Vá em **APIs e Serviços** > **Credenciais**.
2. Clique em **Criar Credenciais** > **ID do cliente OAuth**.
3. Em **Tipo de aplicativo**, selecione **Extensão do Chrome**.
4. (Opcional) Se pedir o ID da extensão, você precisará instalar a extensão no Chrome primeiro (em modo desenvolvedor) para obter o ID (ex: `abcdefghijklmn...`).
   - Para desenvolvimento local, você pode deixar um ID temporário ou usar o ID gerado pelo Chrome ao carregar a pasta `apps/extension`.
5. Ao finalizar, copie o **ID do cliente** gerado (algo como `123456-abcdefg.apps.googleusercontent.com`).

### 5. Configurar o Projeto Local

1. Abra o arquivo `apps/extension/manifest.json`.
2. Localize a seção `oauth2` e substitua `YOUR_CLIENT_ID` pelo ID copiado.

```json
  "oauth2": {
    "client_id": "SEU_CLIENT_ID_AQUI.apps.googleusercontent.com",
    "scopes": [
      "https://www.googleapis.com/auth/drive.file"
    ]
  },
```

### 6. Instalar e Rodar

1. No Chrome, vá em `chrome://extensions`.
2. Ative o **Modo do desenvolvedor** (canto superior direito).
3. Clique em **Carregar sem compactação**.
4. Selecione a pasta `apps/extension` deste repositório.
5. A extensão deve aparecer na barra de ferramentas.

## Resolução de Problemas

- **Erro "client_id not found"**: Verifique se você colou o ID corretamente no `manifest.json` e recarregou a extensão.
- **Erro de permissão no login**: Verifique se seu email está adicionado como usuário de teste na tela de consentimento OAuth.
