# AIRedactX Style Guide

This describes the options page as built. Every value below is a CSS custom property in `src/ui/index.css`; change the token, not the call site. The page sets `color-scheme: light dark` and swaps the token values in a `prefers-color-scheme: dark` block, so there is no theme toggle and no second stylesheet.

## Color tokens

| Token | Light | Dark | Used for |
|---|---|---|---|
| `--color-bg` | #FAFAFA | #1C1B22 | Page background |
| `--color-surface` | #FFFFFF | #2B2A33 | Panels, table rows, inputs, dialog |
| `--color-surface-raised` | #F3F3F3 | #35343D | Divider rows, literal tag |
| `--color-border` | #E0E0E0 | #4A4955 | Borders and table rules |
| `--color-text-primary` | #212121 | #FBFBFE | Body text |
| `--color-text-secondary` | #616161 | #C8C7D0 | Labels, helper text, divider titles |
| `--color-text-disabled` | #9E9E9E | #8A8994 | Switched-off rules, rule counts, idle drag handle |
| `--color-accent` | #FF6A00 | #FF6A00 | Fills and outlines only: toggle on, focus ring, tab underline, primary dialog button |
| `--color-accent-text` | #B84A00 | #FF8A3D | Accent as text: selected tab, regex tag, Add button, snackbar action |
| `--color-accent-soft` | #FFF1E6 | #4A2A14 | Regex and flag tag background |
| `--color-info-text` | #0050B3 | #8AB4F8 | Divider tag text |
| `--color-info-soft` | #E6F0FF | #1F2E4A | Divider tag background |
| `--color-link` | #0050B3 | #8AB4F8 | Links in helper text |
| `--color-error` | #D32F2F | #FF6B6B | Validation messages, delete hover, danger dialog button |
| `--color-hover-bg` | rgba(0,0,0,.04) | rgba(255,255,255,.08) | Hover on rows, buttons, handles |
| `--color-switch-off` | #BDBDBD | #5C5B66 | Toggle track when off |
| `--color-snackbar-bg` / `-text` | #212121 / #FFFFFF | #FBFBFE / #1C1B22 | Undo snackbar |

The logo orange (#FF6A00) is about 2.9:1 against white, so it is never used for text. Text that needs the accent uses `--color-accent-text`, which clears 4.5:1 on both surfaces. If you add a text color, check it against `--color-surface` in both schemes before committing.

## Layout and type

* Base unit `--spacing-unit` = 8px. Panels pad 24px, rows pad 16px top and bottom.
* Page is a fixed 800px column (`.app-container`); the options tab is never narrower.
* System font stack. Page title 22px semibold, panel heading 18px semibold, tab 16px semibold, labels and body 14px, helper text and tags 12px to 13px, monospace at 13px for patterns and the site list.
* Form inputs and panel buttons are 40px tall; dialog buttons and the round action buttons are 36px. Radius is 4px, panels and the dialog use 8px.
* Focus is `:focus-visible` only: 3px accent outline, 2px offset. Toggles get a two-ring box shadow instead so the ring follows the pill.

## Components

* **Tabs.** Arrow keys move between tabs, roving `tabIndex`. Selected tab: accent-text color plus a 3px accent underline.
* **Toggle switch.** 36 by 20px pill, `role` from the native checkbox, track `--color-switch-off` when off and `--color-accent` when on, white thumb.
* **Rules table.** Fixed layout; columns drag 40px, status 60px, type 100px, actions 110px, find and replace share the rest. Rows are `--color-surface` with a bottom border; no zebra striping. A switched-off rule mutes its text and tag to `--color-text-disabled`. Divider rows use `--color-surface-raised` with a chevron that rotates 90 degrees when collapsed and an inline rule count.
* **Tags.** Uppercase 12px pills: `.tag-literal` (raised surface), `.tag-regex` (accent soft and accent text), `.tag-divider` (info soft and info text). `.tag-flag` is the same accent pair in monospace, used for the `i` ignore-case flag and the validator name.
* **Icons.** Inline SVG from `components/Icons.tsx`, 24px viewBox, stroked in `currentColor`, `aria-hidden`. The button that wraps an icon carries the `aria-label`. No emoji anywhere.
* **Action buttons.** 36px circular ghost buttons in `--color-text-secondary`; hover shows `--color-hover-bg`; delete hover turns `--color-error` on a 10% red wash.
* **Drag handle.** Grip icon in `--color-text-disabled`, `cursor: grab`, primary text color on hover. It is the only element that carries the dnd-kit listeners, so the row itself stays selectable and the handle works with the keyboard (space, arrows, space).
* **Dialog.** The native `<dialog>` via `components/Dialog.tsx`, 440px max, surface background, dark 45% backdrop. Buttons sit right-aligned: plain, `.primary` (accent fill, white text) and `.danger` (error border, fills on hover). Confirmations open with focus on Cancel so Enter never destroys anything.
* **Snackbar.** Fixed, bottom center, inverted surface, uppercase accent-text action. Deleting a rule always shows it with Undo.
* **Status line.** Settings feedback is a single `.status-message` line in accent text under the panel, cleared on a timer.

## Accessibility

* Every text and surface pair clears WCAG AA 4.5:1 in both schemes.
* Every control is reachable by Tab; switches and buttons answer to Space and Enter; rules edit inline with Enter to save and Escape to cancel.
* Every icon button has an `aria-label`; the enable toggle's label names the rule.
* The drag handle announces moves through dnd-kit's live region.
* Known gap: a divider collapses by clicking its title cell, which is not focusable and sets no `aria-expanded`. Fix is a button inside the cell.
