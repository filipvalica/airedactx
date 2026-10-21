# AIRedactX

A Firefox (and Chrome) extension that redacts personal data and secrets from a text field before you send it. Built for AI chat windows: paste the log, the email or the contract, click the redact button, then send.

Status: release candidate, not yet on addons.mozilla.org.

## What it does

* **One click.** A small button appears inside the text field on supported sites (ChatGPT, Claude, Gemini, Copilot, Perplexity, Grok, DeepSeek and others you add). Click it and every match is replaced with a placeholder such as `[[Email-1]]` or `[[Name]]`.
* **Right-click anywhere.** "Redact this field" in the context menu works on every site, whatever the allowed list says.
* **Your rules.** Literal rules (find this exact text) and regex rules, ordered by drag and drop, grouped by collapsible dividers, with notes. Import and export the whole set as a TSV file you can edit in Excel or Google Sheets; an import can merge into your current rules or replace them.
* **Bundled defaults.** Email, phone, SSN, card numbers, IP and MAC addresses, API keys and tokens for GitHub, AWS, Google, OpenAI, Anthropic, Slack, Stripe and Square, JWTs, private keys, IBAN. Broad patterns (9 digit numbers, uppercase codes, URLs) ship disabled so they do not mangle ordinary text; switch them on when you need them.
* **Settings.** Delimiter Style (`[[..]]`, `{{..}}`, `((..))`, `<<..>>`), Button Position, Allowed Websites, Highlight After Redaction (amber background, orange outline, or none), and a "Use Anywhere" mode that shows the button on every site. Settings export and import as a TSV too. The options page follows your browser's light or dark theme.

## Privacy

Everything happens inside your browser.

* **No network.** The extension makes no requests. The only `fetch` in the code reads its own bundled `airedactx_rules.tsv` from the extension package, on first install and when you click "Reset Rules to Default".
* **No telemetry, no accounts, no remote config.** The manifest declares `data_collection_permissions: none`.
* **Local storage only.** Rules and settings live in `browser.storage.local` on your machine. They are never synced or uploaded.
* **Passive until you act.** The content script reads a text field only when you press the redact button or choose the context menu item. It does not watch keystrokes, and it does not read fields on its own.
* **Password fields are ignored** on purpose.

Permissions and why they are needed:

| Permission | Used for |
|---|---|
| `storage` | Saving your rules and settings locally |
| `contextMenus` | The "Redact this field" right-click item |
| `scripting` | Injecting the content script into a tab that was already open when the extension was installed, so the context menu works there without a reload |
| `<all_urls>` | The button and context menu must be able to run on whichever site you are typing into, including sites you add to the allowed list after install |

The build is reproducible from source (see below). The packaged `dist/` contains three scripts (`background.js`, `content.js`, the options page bundle), the stylesheet for the redacted-field highlight, the icon, the manifest and the default rules TSV. Nothing is loaded from a remote URL.

## How redaction works

1. Enabled **literal** rules run first, top to bottom. Every occurrence of the text becomes `[[Label]]`.
2. Enabled **regex** rules run next, top to bottom, on the output of step 1. Each distinct match becomes a numbered placeholder, `[[Label-1]]`, `[[Label-2]]`, and the same string gets the same number wherever it recurs.
3. Replacement is sequential: a later rule sees the output of earlier rules. Put specific patterns (a GitHub token) above generic ones (any 10 digit number) so the specific rule wins. The bundled set is ordered that way.

Regex rules use JavaScript syntax. Tick "Ignore case" in the options page, or put `(?i)` at the front of the pattern in the TSV, to match regardless of case.

A regex rule can carry a validator: a match that fails the check is left alone. The only validator today is `luhn`, the checksum payment cards use, and the bundled Credit Card rule uses it so a 16 digit order number is not mistaken for a card. It is set in the TSV's `Validate` column; an install from before this column existed keeps its stored rules until you choose "Reset Rules to Default".

### The rules TSV

Tab separated, header row `type find replace Active Note Validate`, one rule per line. `type` is `literal`, `regex` or `divider`; `Active` is `Y` or `N`; a divider's title goes in `Note`; `Validate` is optional. Blank lines and lines starting with `#` are skipped. Import rejects the whole file on the first bad row and tells you which one.

## Install from source

Requires Node.js 24 or later (22.13 and 20.19 also work; Vite 7 and ESLint 10 set the floor).

```bash
git clone https://github.com/filipvalica/airedactx.git
cd airedactx
npm ci
npm run build:firefox   # or build:chrome
```

Then load `dist/`:

* **Firefox:** `about:debugging` > This Firefox > Load Temporary Add-on > pick `dist/manifest.json`.
* **Chrome:** `chrome://extensions` > Developer mode > Load unpacked > pick the `dist` folder.

After a code change, rebuild and press Reload next to the extension.

## Develop

```bash
npm run typecheck     # tsc, strict
npm run lint:code     # eslint: typescript-eslint recommended plus the React hooks rules
npm run format        # prettier, writes; format:check only reports
npm test              # vitest: engine, TSV parser, rule merge and import, settings normaliser and legacy keys, default ruleset
npm run lint          # web-ext lint against dist/ (what AMO runs); its two innerHTML warnings are inside React DOM, not this code
npm run check         # all of the above plus a Firefox build; run it before every commit
npm run package       # zip dist/ into web-ext-artifacts/ for upload
```

Layout:

```
src/types.ts   shared data shapes: RedactionRule, AppSettings and their allowed values
src/core/      engine.ts (pure text transform), tsv.ts (one parser for defaults, import, export),
               ruleset.ts (ids, merge, import), siteAllow.ts (allowed-site check)
src/storage/   storageManager.ts: browser.storage.local, settings validation, legacy key migration
src/background/ event page: seeds default rules, owns the context menu, opens options
src/content/   injector.ts (field detection and write-back), ui-injector.ts (the button, in a shadow root),
               injected-styles.css (the redacted-field highlight)
src/ui/        React options page. App.tsx is the shell and owns the rules; components/ holds
               Tabs, Settings, AddRuleForm, RuleList (RuleRow, DividerRow, RowParts, useRuleEdit),
               Dialog (one modal for every confirm and notice), Icons (inline SVG); index.css holds the theme tokens
public/        manifest.firefox.json, manifest.chrome.json, icon
airedactx_rules.tsv   the bundled default ruleset
*.test.ts      next to the code they test (src/core, src/storage)
eslint.config.js, .prettierrc   lint and formatting rules; both run in `npm run check`
```

Conventions: Prettier formats everything (single quotes, trailing commas, 120 columns), so there is nothing to argue about. ESLint runs typescript-eslint recommended plus the React hooks rules; type-aware rules are off because `tsc` already covers them. Logic that does not need the DOM lives in `src/core` with a test next to it. The options page never calls `prompt`, `alert` or `confirm`; it uses the `Dialog` component. Rule ids are UUIDs and never appear in the TSV.

The manifest version is set from `package.json` at build time; bump it there.

Adding a setting touches five places, in this order: the type and its allowed values in `src/types.ts`, the default and the validation in `normalizeSettings` (`src/storage/storageManager.ts`), the control in `src/ui/components/Settings.tsx`, the `settings` fixture in `engine.test.ts` and `settings.test.ts`, and the README. Export and import pick it up on their own. A setting missing from `normalizeSettings` is silently dropped on import. Setting keys are named after their label in the Settings tab; if you rename one, add the old name to `LEGACY_SETTING_KEYS` so existing installs carry over, and never delete an entry from that map.

Adding a rule field is the same shape: `src/types.ts`, the parser and serializer in `src/core/tsv.ts` (append a column, never reorder), whatever the engine does with it in `src/core/engine.ts`, the tag in `src/ui/components/RuleRow.tsx`, and a round-trip test in `engine.test.ts`.

Manual test script for a release build: `TESTING_GUIDE.md`. Its step 2 sample is pinned by a test, so change both together. `Style Guide.md` documents the theme tokens; `Specification.md` is the original spec, kept for the record.

## License

MIT. See `LICENSE`.
