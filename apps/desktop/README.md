# BunkerPass Desktop (Electron)

Este é o aplicativo Desktop do BunkerPass, construído com Electron para suportar Windows, macOS e Linux.

## Arquitetura

O App Desktop visa replicar a funcionalidade da extensão do navegador, mas operando de forma independente no sistema operacional.

### Estrutura
- `src/main.js`: Processo principal do Electron (Janela, Menus).
- `src/index.html`: Interface do usuário (Renderer).
- `src/`: Lógica compartilhada (planejado).

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
- [ ] Portar lógica de Criptografia (`crypto.js`) para Node.js (WebCrypto é suportado no Node 20+).
- [ ] Implementar Camada de Armazenamento Local (substituindo `chrome.storage.local` por `electron-store` ou SQLite).
- [ ] Implementar Autenticação Google Drive (substituindo `chrome.identity` por fluxo OAuth2 Node.js).
- [ ] Reutilizar componentes de UI da extensão (React/HTML).
