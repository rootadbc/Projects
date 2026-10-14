# www2CLI

**Author:** rootadbc  
**Version:** 1.0.0

www2CLI adds an optional Linux-inspired terminal overlay to the current website. Click the extension action or press **Ctrl+Shift+K** to toggle it. The underlying website remains visible and interactive outside the terminal window. The terminal UI is isolated in an open Shadow DOM.

## Install in Chrome (Developer Mode)

1. Download and unzip the `www2cli` project folder, preserving the `background`, `commands`, `content`, `icons`, and `styles` directories.
2. Open `chrome://extensions`.
3. Turn on **Developer mode**.
4. Select **Load unpacked** and choose the `www2cli` folder containing `manifest.json`.
5. Pin the extension if desired. On ordinary HTTP/HTTPS pages, click its toolbar icon or press **Ctrl+Shift+K**.

Chrome may reserve or remap a keyboard shortcut. If the shortcut does not open the terminal, visit `chrome://extensions/shortcuts` to set an available key combination. Chrome-internal pages, the Web Store, and some protected pages do not allow script injection; the extension shows a red `!` toolbar badge and an explanatory tooltip when possible.

## Terminal controls

- Drag the title bar to move the terminal.
- Use the lower-right resize handle to resize it.
- Use `−` to minimize to the title bar and `□` to restore.
- Use `×` or the `close` command to close the overlay.
- The output area scrolls independently of the page. Press Up/Down in the command line to recall command history.
- The dark theme is the default. Theme, position, dimensions, and a capped command history are saved locally.

## Commands

Commands are explicit and do not run arbitrary JavaScript. CSS selectors with spaces should be enclosed in quotes. Arguments containing spaces should also be quoted.

| Command | Description | Example |
|---|---|---|
| `help` | Show commands and examples. | `help` |
| `clear` | Clear terminal output. | `clear` |
| `meta` | Show title, URL, description, canonical URL, language, and Open Graph title/description. | `meta` |
| `links` | List up to 200 visible links with numbers, text, and destination. | `links` |
| `headings` | List visible H1–H6 headings in document order. | `headings` |
| `images` | List up to 100 visible images with alt text and source. | `images` |
| `find <text>` | Find up to 30 visible text snippets. | `find pricing` |
| `goto <url\|number>` | Navigate to an HTTP(S) URL or numbered link from the latest `links` listing. | `goto 3` · `goto example.com/pricing` |
| `back` | Go back one page in this tab's history. | `back` |
| `forward` | Go forward one page in history. | `forward` |
| `reload` | Reload the current page. | `reload` |
| `scroll <direction>` | Scroll `up`, `down`, `top`, or `bottom`. | `scroll bottom` |
| `click <selector\|number>` | Click one visible element matching a selector, or a numbered link. Selector must be unique. | `click "button.more"` · `click 2` |
| `type <selector> <text>` | Set a visible, supported, non-sensitive input/textarea/contenteditable and dispatch input/change events. | `type "input[name=email]" "name@example.com"` |
| `submit <form-selector>` | Explicitly submit one matching form using native validation. | `submit "form#contact"` |
| `extract <selector>` | Display visible text from matching elements (bounded output). | `extract "main h2"` |
| `copy <selector\|title\|url>` | Copy the page title, URL, or visible selector text after an explicit command. | `copy title` · `copy "main h1"` |
| `theme <dark\|light>` | Change terminal theme. | `theme light` |
| `position <preset>` | Move to `center`, `bottom`, or `top-left`. | `position top-left` |
| `close` | Close the terminal overlay. | `close` |

### Example interaction

```text
@rootadbc:~$ links
1  Home
   https://example.com/

2  Pricing
   https://example.com/pricing

@rootadbc:~$ goto 2
Navigating to: https://example.com/pricing
```

## Permissions

- **`activeTab`** — grants temporary access to the tab after you click the extension action or invoke its shortcut.
- **`scripting`** — injects the terminal and its commands into the active page only after your activation.
- **`storage`** — saves terminal preferences and a limited command history locally.
- **`clipboardWrite`** — used only when you explicitly run the `copy` command.

There are no broad host permissions. The packaged terminal stylesheet is listed as a web-accessible resource so it can load inside the Shadow DOM; this does not grant the extension access to websites. Page inspection and interaction are local.

## Security and privacy

The extension does not use `eval`, execute shell commands, or interpret user input as JavaScript. Selectors are passed to `querySelectorAll` and invalid selectors are reported. `goto` accepts only HTTP(S) URLs, including numbered links. Extraction and inspection commands read page metadata/text only when explicitly requested. `click`, `type`, and `submit` cause page interactions only when the matching command is explicitly entered; `submit` invokes native browser form validation and never runs automatically.

`type` is limited to visible text-like inputs, textareas, and contenteditable elements. Password, hidden, file, payment, credential, authentication, identity-number, bank-account, OTP, and similar fields are excluded by type and metadata heuristics. This is a safeguard, not a guarantee that every sensitive field can be recognized. Avoid using `type` or `submit` on sensitive forms, and review effects before continuing.

Theme, size, position, and the last 50 commands are stored in `chrome.storage.local`. To reduce exposure, persisted history omits arguments for `type`, `find`, `goto`, and `copy`; those command arguments are available only in the current open terminal session. Do not assume the local browser profile is encrypted against other users with access to the same OS account. No page or terminal data is sent to a third-party server. Clipboard access occurs only after `copy` is explicitly run.

## Limitations

- The terminal works on normal `http://` and `https://` pages where Chrome permits extension injection.
- Closed Shadow DOM and cross-origin iframe contents cannot be inspected from the top-level page.
- Only visible links/headings/images and visible selector matches are listed by the relevant commands.
- `goto` and page actions may unload the terminal as the website navigates or reloads.
- A site may reject programmatic typing or handle controls in a custom way; inspect the result yourself.
- `submit` can send data to the website. It is only performed after you manually type the command. Do not run it unless you intend to submit that form.

## Project structure

```text
www2cli/
├── manifest.json
├── background/
│   └── service-worker.js
├── content/
│   ├── content.js
│   └── terminal.js
├── commands/
│   ├── index.js
│   ├── navigation.js
│   ├── dom.js
│   ├── extraction.js
│   └── forms.js
├── styles/
│   └── terminal.css
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## Future ideas

- Optional, user-reviewed saved command scripts.
- Explicit page-data export with a preview step.
- Optional AI-assisted commands, disabled by default and requiring a separate privacy review.
- More accessible command completions and a command palette.
