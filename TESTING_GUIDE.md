# Release test: fresh Firefox profile

Five steps. Run them on a clean build (`npm ci && npm run build:firefox`, or the zip from `npm run package`) in a profile that has never had the extension. Each step has one pass condition. A fail on any step blocks the release.

The two Reset dialogs open with focus on Cancel, so Enter cancels; the import dialog defaults to Merge. Click the button you mean.

**Setup.** `about:profiles` > Create a New Profile > Launch profile in new browser. In that window: `about:debugging` > This Firefox > Load Temporary Add-on > `dist/manifest.json` (or the zip). A temporary load shows no install prompt. Check that site access is on: `about:addons` > Extensions > AIRedactX > Permissions > "Access your data for all websites" must be enabled (switch it on if it is not; without it neither the button nor the context menu can run).

## 1. Defaults are there

Click the toolbar icon. The options page opens in a tab.

Pass: the Rules tab shows the bundled rules grouped under dividers (Personal, Secrets and tokens, Core identifiers, Financial, ...). The broad ones (SWIFT BIC, Routing Number, VIN, URL, Bearer Token) are switched off. Drag one rule to a different spot, then reload the tab: it stays where you put it.

## 2. Local test page

Open `airedactx_test.html` from the repo (File > Open File). Settings tab > switch on "Use Anywhere" mode. Click into the first textarea and paste these three lines:

```
Hi, I'm Captain Nemo from Nautilus. Email nemo@nautilus.example or call (713) 555-0142.
SSN 123-45-6789, card 4111 1111 1111 1111, order 1234 5678 9012 3456, token ghp_abcdefghijklmnopqrstuvwxyz0123456789.
IMPORTANT: PLEASE REVIEW THE ATTACHED DOCUMENT.
```

Click the round button in the corner of the field.

Pass: the field reads exactly

```
Hi, I'm [[Name]] from [[Company]]. Email [[Email-1]] or call [[Phone-1]].
SSN [[SSN-1]], card [[Credit Card-1]], order 1234 5678 9012 3456, token [[GitHub Token-1]].
IMPORTANT: PLEASE REVIEW THE ATTACHED DOCUMENT.
```

and turns pale yellow until you click into it again. The order number stays because it fails the card checksum. Settings tab > Highlight After Redaction > No highlight, redact a second time: no tint.

## 3. Real chat composer

Switch "Use Anywhere" back off. Open claude.ai or chatgpt.com, sign in, click into the message box and paste the same three lines. Click the round button.

Pass: the placeholders from step 2 are in the box (blank-line spacing may differ, that is the editor's doing), the originals are gone, and the site's Send button is enabled. Send it: the reply quotes placeholders, not the originals. Use a throwaway chat if you mind the message being stored.

If no button ever appears, recheck the site-access permission from Setup before calling it a fail.

## 4. Context menu on a site that is not on the list

Open any page with a text field that is not in the allowed list (a GitHub issue comment box works). Type an email address, right-click inside the field, choose "Redact this field".

Pass: the address becomes `[[Email-1]]` even though the round button does not appear on this site.

## 5. No network

`about:debugging` > This Firefox > AIRedactX > Inspect. That opens the extension's own devtools (background and options page). Open its Network tab, then on the options page export the rules, import that file back (pick Merge in the dialog), change a setting, and click "Reset Rules to Default" then "Replace my rules".

Pass: the only request listed is `moz-extension://.../airedactx_rules.tsv` (from the reset). Nothing to any `http` or `https` address. The content script contains no network call at all, so there is nothing to watch on web pages.
