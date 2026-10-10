# Bunker Midnight — linguagem visual (tema escuro)

Fonte única de verdade para extensão, desktop e mobile. Cada app guarda a sua própria cópia dos tokens
(regra de isolamento do monorepo): `apps/extension/src/styles/tokens.css`, `apps/desktop/src/styles/tokens.css`
e `apps/mobile/src/theme.ts`. Os **nomes** são os mesmos nas três.

## Princípios
- Tela quase preta com brilho dourado discreto, bordas de 1 px translúcidas, superfícies em camadas.
- Um único acento (ouro). Verde/laranja/vermelho só para estado (ok/atenção/erro).
- Raios generosos, números tabulares, movimento curto (150–300 ms) e sem animação com `prefers-reduced-motion`.
- Marca: o mostrador de cofre com buraco de fechadura (`apps/*/…/icons`, `assets/logo.svg`). Nome exibido: **Bunker**.
- Textos da interface em pt-BR.

## Tokens
| Token | Valor | Uso |
| --- | --- | --- |
| `bg` | `#07080c` | fundo do app |
| `bg-2` | `#0b0d13` | barras, sidebar, tab bar |
| `surface` | `#10131a` | cartões, campos |
| `surface-2` | `#161a23` | hover, selecionado |
| `surface-3` | `#1d222d` | pressionado |
| `line` | `rgba(255,255,255,.07)` | bordas |
| `line-2` | `rgba(255,255,255,.13)` | bordas em foco/hover |
| `text` | `#edeff5` | texto principal |
| `muted` | `#8d95a6` | texto secundário (6,3:1 sobre `bg`) |
| `faint` | `#5d6475` | só decorativo/desabilitado |
| `accent` | `#f3bc4e` | ouro |
| `accent-hi` / `accent-lo` | `#ffe3a0` / `#cf8e20` | pontas do degradê |
| `accent-ink` | `#1b1304` | texto sobre ouro |
| `ok` / `warn` / `danger` / `info` | `#4ade9e` / `#ffa04d` / `#ff6b7a` / `#7aa7ff` | estados |

Tema claro: existe só como opt-in (`data-theme="light"` no `<html>` da extensão, sem seletor na interface); o padrão é sempre escuro, mesmo com o sistema em modo claro.

Degradê do botão primário: `linear-gradient(180deg,#fbd57f,#f0b543)` + realce interno `inset 0 1px 0 rgba(255,255,255,.35)`.
Brilho do primário: `0 10px 28px -10px rgba(243,188,78,.55)`. Foco: borda `accent` + anel `0 0 0 3px rgba(243,188,78,.22)`.
Brilho de fundo (topo da tela): `radial-gradient(120% 60% at 50% -12%, rgba(243,188,78,.10), transparent 58%)`.
Sombra de cartão: `inset 0 1px 0 rgba(255,255,255,.04), 0 8px 24px -10px rgba(0,0,0,.65)`.

Raios: `8 / 12 / 16 / 22` e pílula (`999`). Espaços em múltiplos de 4.

## Tipografia
Inter (variável, embutida) com fallback de sistema; JetBrains Mono para senhas, códigos e chaves.
Escala: 12 · 13 · 14,5 · 17 · 22 · 32. Títulos com `letter-spacing: -0.01em`. Use `font-variant-numeric: tabular-nums` em contagens e códigos 2FA.

## Componentes
- **Botão primário**: degradê ouro, texto `accent-ink` peso 600, raio 12, brilho; hover clareia; pressionado desce 1 px e perde o brilho. Secundário: `surface-2` + borda `line`. Fantasma: transparente. Perigo: contorno `danger`.
- **Campo**: altura 44, fundo `rgba(255,255,255,.04)`, borda `line`, raio 12; foco com ouro.
- **Cartão**: degradê `rgba(255,255,255,.05)→.025`, borda `line`, raio 16, sombra de cartão.
- **Linha de item**: avatar 36–40 px (squircle) com degradê por matiz do título — `linear-gradient(145deg, hsl(H 72% 62%), hsl(H+28 66% 44%))`, letra branca; título peso 600; subtítulo `muted`.
- **Chip**: pílula; selecionado = ouro (degradê + texto `accent-ink`). **Selo de tipo**: Senha `info`, Nota `accent`, Cartão `#a78bfa`, Endereço `#5eead4`, Passkey `#f472b6` (fundo a 14 %, texto cheio, borda a 30 %).
- **Toast**: pílula de vidro (`rgba(22,26,35,.82)` + blur), ícone de estado à esquerda; erro com borda `danger`.
- **Estado vazio**: ícone grande num disco com brilho dourado, título, texto `muted`, botões.
- **Rolagem**: barra fina, polegar `rgba(255,255,255,.12)`.

## Ativos
- Marca (mostrador de cofre): `apps/extension/src/icons/icon.svg` (fonte) e PNGs 16/32/48/128; desktop em `apps/desktop/src/assets`; mobile em `apps/mobile/assets` (ícone iOS sem cantos, adaptativo Android, monocromático e splash).
- Fontes embutidas (SIL OFL, licenças ao lado dos arquivos): Inter e JetBrains Mono, subconjunto latino, em `fonts/` de cada app web.
- Mobile: fontes do sistema; ícones como PNGs tingíveis (máscaras brancas) rasterizados do Ionicons, MIT (`apps/mobile/assets/icons/LICENSE`).

## Não fazer
Superfícies claras, sombras pretas duras, neon, mais de um acento por tela, texto `faint` para informação, ícones coloridos sem função.
