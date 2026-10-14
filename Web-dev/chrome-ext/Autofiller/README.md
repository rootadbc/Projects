# Autofiller

**Author:** rootadbc  
**Version:** 1.0.0

Autofiller is a Manifest V3 Chrome extension for manually filling up to five user-selected, non-sensitive form fields from a basic local profile. Field selection and filling are explicit user actions; Autofiller never submits a form.

## Features

- Save, edit, and delete first name, last name, email, phone, and address in Chrome's local extension storage.
- Start field selection from the toolbar popup, then click up to five visible form fields on the current page.
- Assign each selected field one saved profile value and press **Fill fields** to apply it.
- Supports text/email/telephone inputs, textareas, and select menus when a matching option exists.
- Uses native value setters and bubbling input/change events for common React/Vue-style controlled forms.
- Works with dynamically rendered fields because selection happens when the user clicks them; composed click events support many open Shadow DOM fields.
- Follows the operating system/browser light or dark theme.
- No automatic form submission, cloud sync, analytics, external requests, or AI field detection.

## Install in Chrome (Developer Mode)

1. Download and unzip the `autofiller` folder, keeping its `assets`, `background`, `content`, `options`, and `popup` directories together.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode**.
4. Choose **Load unpacked** and select the `autofiller` folder containing `manifest.json`.
5. Optionally pin Autofiller from Chrome's Extensions menu.

No build step or external dependencies are required.

## Use Autofiller

1. Open **Your profile** from the Autofiller popup and save only the profile values you want to reuse. Values stay in this browser's `chrome.storage.local`.
2. Visit a regular website with a form and open the Autofiller toolbar popup.
3. Choose **Select fields on page**. The popup closes so you can click form fields. The page shows a small selection hint; press **Escape** to stop selecting.
4. Select up to five visible text, email, phone, textarea, or select fields. Password, hidden, payment, credential, identity-number, and other likely sensitive fields are excluded.
5. Reopen the popup and choose a saved profile value for each selected field.
6. Choose **Fill fields**. Autofiller fills only the selected, mapped fields, shows brief visual feedback, and does **not** submit the form.
7. Use **Clear** to remove the current page's field mapping. The profile can be edited or deleted in profile settings.

For a select menu, Autofiller fills only if a non-disabled option's visible label or option value exactly matches the saved profile text (case-insensitively). Otherwise it skips that field and reports the count.

## Permissions

- `activeTab`: act on the current tab only after the user invokes Autofiller.
- `scripting`: inject the page helper after the user starts selection, requests state, or fills fields.
- `storage`: store the user-entered profile locally in Chrome extension storage.

Autofiller does not request broad host permissions such as `<all_urls>`. Chrome does not allow injection on some protected/internal pages; those pages are unsupported.

## Security and privacy

Autofiller stores the five profile values the user enters in `chrome.storage.local` on the device. The extension does not send profile data, page content, field values, or browsing history to any server. It does not use analytics, telemetry, ads, third-party scripts, or external fonts.

During manual field selection, Autofiller reads only a field's element type and descriptive metadata needed to show its label (for example, associated label, placeholder, or input name). It does not read existing field values. It stores selected DOM element references and display labels in the active tab's in-memory content-script session only; mappings are not synced or persisted. On an explicit Fill action, only the mapped profile value is passed to the selected element. Forms are never submitted.

Autofiller refuses password, hidden, file, and other non-supported input types. It also screens field names, labels, IDs, placeholders, and autocomplete hints for likely passwords, credentials, payment-card details, security codes, identity numbers, bank-account values, one-time codes, and similar sensitive information. This heuristic errs on the side of skipping fields, but no heuristic can identify every sensitive field; do not use Autofiller on sensitive or high-risk forms.

Profile values are sensitive personal information. Use a trusted, secured device; do not save information you do not want available to someone with access to your browser profile. Delete the saved profile in **Your profile** whenever you no longer need it. Removing the extension also removes its extension storage when Chrome completes the uninstall.

## Limitations

- Autofiller does not fill passwords, payment details, credentials, identity numbers, or hidden fields.
- The five-field cap is per page session. Selection mappings clear on navigation or reload.
- Closed Shadow DOM, cross-origin iframe contents, and Chrome-protected pages cannot be reliably accessed.
- Unusual site-specific controlled inputs may reject programmatic changes; review every filled field before continuing.
- Autofiller never clicks submit, applies for jobs, or sends a form.
- No automatic label-based detection or cross-site mapping is included.

## Project structure

```text
autofiller/
├── manifest.json
├── background/
│   └── service-worker.js
├── content/
│   └── content.js
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── options/
│   ├── options.html
│   ├── options.css
│   └── options.js
├── assets/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## Troubleshooting

- **Cannot start selection:** Try a regular website. Chrome blocks extensions on some internal, store, and protected pages.
- **A field will not select:** It may be hidden, disabled, read-only, unsupported, or classified as sensitive. Try clicking directly inside the field.
- **A field is missing after reopening the popup:** Reloads and navigation start a fresh page session; select fields again.
- **A select menu is unchanged:** The saved value may not match an enabled option's value or visible label exactly.
- **A site does not recognize a filled value:** Some pages use custom controls. Review the field and enter the value manually if necessary.
- **Profile is not saved:** Open profile settings and check `chrome://extensions` for extension errors. Do not store sensitive credentials there.

## Future roadmap

- Optional encrypted local export/backup with explicit user control.
- More accessible hints for duplicate field labels.
- User-reviewed per-domain mapping templates saved locally.
- Additional sensitive-field detection tests and browser compatibility coverage.

## Author profiles

[LinkedIn](https://www.linkedin.com/in/rootadbc/) · [GitHub](https://github.com/rootadbc) · [X](https://x.com/rootadbc) · [Instagram](https://www.instagram.com/rootadbc/) · [YouTube](https://www.youtube.com/@rootadbc)
