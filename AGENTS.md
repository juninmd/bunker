# AGENTS.md

Bunker: a password manager monorepo (pnpm workspace) with a browser extension (Chrome, Firefox, Edge), an Electron desktop app and an Expo / React Native mobile app. Vault encryption and secret handling are the highest-risk code: review them first.

## Stack

- pnpm workspace (`apps/*`), TypeScript, Electron (desktop), Expo / React Native (mobile), Manifest V3 extension built with `tsc`.
- Versions and changelogs are managed by Release Please.

## Commands

```bash
pnpm install
pnpm run build                                          # root: build every app that has a build script
pnpm run test                                           # root: test every app that has a test script
pnpm --filter ./apps/extension run test                 # unit suite (node tests/*.mjs)
pnpm --filter ./apps/extension run typecheck
pnpm --filter ./apps/extension run build:firefox        # also: build:edge
pnpm --filter ./apps/extension run e2e                  # homologation e2e (tests/e2e/homologation.mjs)
pnpm --filter ./apps/mobile run test                    # tsc --noEmit
python3 verification/verify_popup_layout.py             # required for every change; run from repo root
```

`apps/desktop` has no tests yet; its `test` script is a placeholder.

## Structure

- `apps/extension/`: MV3 extension. `src/background.ts`, `content*.ts`, `services/` (vault, sync, passkeys, PIN lock, recovery, Google Drive), `ui/`, `utils/` (crypto, TOTP, CSV). Tests in `tests/`.
- `apps/desktop/`: Electron app (`src/main.ts`, `preload.ts`, `renderer/`).
- `apps/mobile/`: Expo app (`App.tsx`, `src/` components, `src/core/`, `plugins/` for autofill).
- `verification/`: the popup layout verification suite that every change must pass.
- `scripts/`: packaging (`package-extension.sh`, `bunker.sh`), README updater, Drive OAuth setup.
- `docs/`: `SECURITY.md`, `SETUP.md`, `DESIGN.md`, `ROADMAP.md`.

## Conventions

- Max 150 lines per file. Split core scripts into modules.
- No cross-app dependencies unless they are documented.
- No `any` in TypeScript apps.
- Every change passes the `verification/` suite. Each new sub-application follows Plan, then Act, then Validate.
- Version bumps only through Release Please. Do not hand-edit versions or `CHANGELOG.md`.
- Review lenses: architecture (structure and boundaries), audit (line limits, dependency safety), release (build and release scripts).
- GitHub Actions: <!-- base-actions-main-policy -->
  - Reference internal actions by branch, never by SHA: `uses: juninmd/base-actions/<action>@main` and `uses: juninmd/base-actions/.github/workflows/<file>.yml@main`.
  - Do not pin `@<sha>` for `juninmd/base-actions`; updates are centralized on `main`.
  - PRs whose checks do not start because of billing or spending limits are auto-merged by `juninmd/base-actions/.github/workflows/auto-merge-billing-blocked.yml`. Apply the `do-not-merge` label to block that.

## Gotchas

- Keep secrets out of commits. `.env*` is git-ignored except `.env.example`. Never paste credentials into logs or PRs.
- `apps/extension/src/**/*.js` is git-ignored build output. Edit the `.ts` source.
- Homologation results (`results.json`, `security-results.json`, `firefox-results.json` under `docs/screenshots/`) are git-ignored. Do not commit them.
- The root `build` and `test` scripts run over every app with `--if-present`, so a missing script in an app is skipped silently.
