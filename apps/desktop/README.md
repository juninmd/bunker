# DrivePass Desktop (Electron)

Este é o aplicativo Desktop do DrivePass, construído com Electron para suportar Windows, macOS e Linux.

## Arquitetura

O App Desktop visa replicar a funcionalidade da extensão do navegador, mas operando de forma independente no sistema operacional.

### Estrutura
- `src/main.js`: Processo principal do Electron (Janela, Menus).
- `src/index.html`: Interface do usuário (Renderer).
- `src/`: Lógica compartilhada (planejado).


## Autenticação com Google Drive

Para que a sincronização com o Google Drive funcione no App Desktop, você precisa de um `Client ID` do Google Cloud Console configurado para "Desktop App" ou com loopback URI (e.g. `http://localhost/callback`).

Execute o aplicativo com a variável de ambiente:
```bash
GOOGLE_CLIENT_ID="seu-client-id.apps.googleusercontent.com" npm start
```

## Desenvolvimento

1. Instalar dependências:
   ```bash
   npm install
   ```

2. Executar em modo de desenvolvimento:
   ```bash
   npm start
   ```

## Roadmap Desktop

- [x] Estrutura Inicial (Electron Boilerplate).
- [x] Portar lógica de Criptografia (`crypto.js`) para Node.js (WebCrypto é suportado no Node 20+).
- [x] Implementar Camada de Armazenamento Local (substituindo `chrome.storage.local` usando custom filesystem JSON via IPC).
- [x] Implementar Autenticação Google Drive (substituindo `chrome.identity` por fluxo OAuth2 Node.js).
- [ ] Reutilizar componentes de UI da extensão (React/HTML).
