# DrivePass Desktop (Electron)

Este é o aplicativo Desktop do DrivePass, construído com Electron para suportar Windows, macOS e Linux.

## Arquitetura

O App Desktop visa replicar a funcionalidade da extensão do navegador, mas operando de forma independente no sistema operacional.

### Estrutura
- `src/main.ts` e `src/preload.ts`: processo principal do Electron (janela, IPC, Google Drive) e ponte segura com o renderer.
- `src/index.html`: só marcação, com CSP estrita (sem estilos, scripts ou eventos inline).
- `src/styles/`: CSS do tema escuro "Bunker Midnight" (`tokens.css` é a cópia local dos tokens de `docs/DESIGN.md`; o restante se divide em `fonts`, `base`, `components`, `fields`, `layout`, `lock`, `sidebar`, `list`, `detail`, `states`, `toast` e `responsive`).
- `src/renderer/`: lógica da interface em TypeScript, uma responsabilidade por arquivo (CSV, modelo e busca, lista e detalhes, sincronização, cópia com limpeza em 30 s, toasts). São scripts clássicos (sem `import`/`export`) que compartilham o `namespace Bunker`, porque o sandbox do Electron não carrega módulos via `file://`.
- `src/assets/`: ícone do app, logo e fontes Inter e JetBrains Mono embutidas (licenças OFL ao lado).
- `scripts/copy-assets.js`: copia `index.html`, `styles/` e `assets/` para `dist/` (multiplataforma, no lugar do `cp`).
- `dist/`: saída do `npm run build` (`tsc` + cópia dos estáticos); não é versionada.

Regras do monorepo: no máximo 150 linhas por arquivo, sem `any` no renderer e nenhuma dependência de `apps/extension` ou `apps/mobile`.


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
