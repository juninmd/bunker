# Homologação de segurança da extensão Bunker

Data: 2026-09-19 · Escopo: `apps/extension` (Chrome MV3) · Como repetir: `cd apps/extension && npm test && npm run e2e && npm run e2e:security`

## Modelo de ameaça

| Atacante | Pode | Não pode |
|---|---|---|
| Página hostil (ou site legítimo com XSS) | Ler e alterar todo o DOM, disparar eventos sintéticos, estilizar os elementos injetados | Acessar o mundo isolado do content script ou chamar `chrome.runtime` da extensão |
| Rede (http) | Alterar páginas sem TLS | Nada: o autofill só responde em https (http apenas em loopback) |
| Ladrão do disco com o navegador fechado | Copiar o perfil do Chrome | Ler `chrome.storage.session` (só existe em memória) |
| Quem tem a conta Google | Ler e trocar o `vault.enc` | Decifrar ou forjar itens sem a senha mestra (AES-GCM autenticado) |
| Quem recebe um código de compartilhamento | Abrir aquele item com a senha do código | Injetar registros internos (política, testamento) |

## Controles verificados

- Cofre local e remoto em AES-256-GCM com IV aleatório de 96 bits a cada cifragem; chave PBKDF2-SHA256 com 600.000 iterações.
- A chave da sessão fica só em `chrome.storage.session`; bloqueio automático em 15 min, ao bloquear o computador e ao fechar o navegador.
- Nenhum segredo em texto puro no perfil do Chrome depois de fechado (varredura byte a byte em UTF-8 e UTF-16).
- Páginas recebem apenas os nomes de usuário do próprio site; a senha de um item só sai do service worker depois de um clique real, visível e não encoberto.
- Mensagens de página exigem remetente da própria extensão, frame principal e origem https (ou loopback).
- Verificação de vazamentos envia só os 5 primeiros caracteres do SHA-1 (k-anonimato).

## Achados e correções

| # | Severidade | Achado | Status | Prova |
|---|---|---|---|---|
| 1 | Crítica | Script da página clicava no ícone e no seletor e lia a senha preenchida | Corrigido: clique precisa ser `isTrusted`, com o ícone visível (opacidade, clip-path, tamanho) e sem sobreposição | `security-probe`: cliques sintéticos, clickjacking |
| 2 | Alta | Todas as senhas do site iam para a página no carregamento | Corrigido: `LIST_ACCOUNTS` só com usuários; `FILL_CREDENTIAL` por item | `test_security`: listagem sem senha, ref de outro site recusada |
| 3 | Alta | Custo PBKDF2 local sem limite: storage adulterado travava o desbloqueio | Corrigido: aceito só entre 250 mil e 5 milhões | `test_hardening`, `security-probe`: custo adulterado recusado em < 5 s |
| 4 | Alta | Importar CSV sobrescrevia senhas e apagava itens sem aviso | Corrigido: importação nunca apaga, guarda a senha anterior no histórico e pede confirmação | `test_csv_sync`, `test_hardening` |
| 5 | Alta | Exportação CSV permitia fórmulas do Excel | Corrigido: células de texto iniciadas por `= + - @` recebem `'`; senha e TOTP ficam exatos para migração | `test_hardening` |
| 6 | Alta | Token OAuth revogado nunca era descartado | Corrigido: 401 descarta o token e tenta uma vez | `test_hardening` |
| 7 | Média | Oferta de salvar login visível para outro site na mesma aba | Corrigido (entrega anterior) | `test_save_offer` |
| 8 | Média | Entrada `github.io`, `com.br` etc. cobria subdomínios de estranhos | Corrigido: sufixos compartilhados só casam exatamente | `test_hardening` |
| 9 | Média | Compartilhamento aceitava registros internos (política de bloqueio) | Corrigido: só login, nota, cartão e endereço | `test_hardening` |
| 10 | Média | PIN de 4 dígitos | Corrigido: mínimo de 6 dígitos | `test_security` |
| 11 | Baixa | Popup bloqueado mantinha senha e lista no DOM | Corrigido: formulários, listas, painéis e diálogos são limpos | `security-probe` |
| 12 | Baixa | Viés de módulo no gerador | Corrigido: amostragem por rejeição | `test_hardening` |
| 13 | Baixa | Permissões `scripting`, `activeTab` e `<all_urls>` sem uso | Corrigido: removidas; hosts só Google APIs e HIBP | `security-probe`: HIBP funciona com a permissão reduzida |
| 14 | Baixa | `GET_POLICIES` entregava a política inteira a qualquer página | Corrigido: `IS_BLOCKED` responde só sim/não para o próprio site | `test_security` |

## Riscos residuais aceitos

- Uma página pode sobrepor um elemento com `pointer-events: none` ao ícone e induzir o clique; é o limite conhecido de ícones injetados. O preenchimento continua restrito ao próprio site.
- Um estilo que mude a opacidade no exato instante do clique pode escapar da checagem de visibilidade (corrida de animação).
- Uma página com XSS pode enviar formulários com senhas chutadas e perceber pelo aviso de salvar se acertou; cada tentativa mostra o aviso ao usuário.
- Ativação por teclado é aceita sem teste de posição (acessibilidade); uma página com XSS que roube o foco ainda precisa de dois Enter do usuário.
- Metadados do envelope remoto (sal, custo) não entram como AAD; adulterá-los só causa falha na sincronização (o GCM falha fechado).
- Códigos de compartilhamento antigos (250 mil iterações) continuam abrindo.
- A senha mestra fica em memória enquanto o cofre está aberto (necessária para gerar o código de recuperação).
- No Windows, o modo `0600` da chave do `setup-drive-oauth` não se aplica; guarde `~/.bunker` em pasta só sua.
- Senha e TOTP saem sem neutralização no CSV exportado; não abra esse arquivo em planilha.
