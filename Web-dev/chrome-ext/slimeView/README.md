# slimeView

**Author:** rootadbc  
**Version:** 1.2.2

**Author profiles:** [LinkedIn](https://www.linkedin.com/in/rootadbc/) · [GitHub](https://github.com/rootadbc) · [X](https://x.com/rootadbc) · [Instagram](https://www.instagram.com/rootadbc/) · [YouTube](https://www.youtube.com/@rootadbc)

slimeView is a lightweight Chrome extension for local page cleanup and readability. Its toolbar popup has independent **Remove pop-ups** and **Remove blur** ON/OFF switches, plus appearance controls that follow the system theme by default. It uses deterministic DOM/CSS inspection and browser APIs only—no AI, remote services, analytics, external fonts, or trackers.

## Features

- Large, clear ON/OFF switches for popup and blur cleanup, with animated switch indicators and a visible ON state.
- When enabled, a cleanup applies to the current page and watches for newly added matching content until switched OFF.
- Handles common single-page-app updates too: it watches relevant DOM attributes as well as inserted nodes, and searches open Shadow DOM roots.
- Find likely modal, popup, overlay, dialog, subscription, email-capture, consent, and fixed-banner elements; hide candidates with `display: none` rather than deleting them.
- Ask for confirmation before an initial cleanup would affect more than 25 elements.
- Switch each cleanup off to restore its captured page styling; **Turn both off & undo** restores both cleanup types.
- Detect CSS blur, selected low-opacity fixed/absolute obscuring layers, and multiple text shadows; apply local overrides with `!important` only to affected properties.
- Reset the current tab by reloading it.
- Popup appearance defaults to **System** and tracks live operating-system/browser light/dark changes. Optional Light and Dark overrides are available.
- Conservative protection for hostnames that appear to be banking, government, health, medical, or hospital sites.

**There is no floating or injected dashboard.** slimeView operates from its Chrome toolbar popup; it does not place a control bubble or panel over the webpage.

## Install in Chrome (Developer Mode)

1. Download and unzip the `slimeView` project folder, keeping its `icons` directory and all files together.
2. In Chrome, open `chrome://extensions`.
3. Turn on **Developer mode**.
4. Select **Load unpacked** and choose the `slimeView` folder containing `manifest.json`.
5. Optionally pin slimeView using the puzzle-piece Extensions menu.

No build step or dependency installation is required. The extension requests only `activeTab`, `scripting`, and `storage`; it does not request broad host permissions. The page controller is injected only after the popup is opened or the user changes a switch. Storage is used only for the popup's appearance preference.

## Usage and testing

1. Open a regular website (not a Chrome internal page such as `chrome://extensions`) and select the slimeView toolbar icon.
2. The two switches show their state for the active tab. Click **Remove pop-ups** to turn popup cleanup ON. Existing candidates are hidden; newly added matching overlays are handled while ON. Click the switch again to turn it OFF and restore the captured display styles.
3. Click **Remove blur** to turn blur cleanup ON. It handles current and newly added blur/obscuring styles. Click it again to turn it OFF and restore captured inline styles.
4. If a first cleanup finds more than 25 candidates, the popup shows the count and asks you to choose **Confirm cleanup** before turning that switch ON.
5. Close and reopen the toolbar popup: each switch continues to show the current state for that tab. The state is tab-local and temporary; reloading or navigating to a new page starts with both switches OFF.
6. Select **Turn both off & undo** to turn off both cleanups and restore captured styles. **Reset page** reloads the current tab and also clears the temporary state.
7. Under **Appearance**, choose **System**, **Light**, or **Dark**. System is the default and updates live when the OS/browser color preference changes. Light or Dark forces the popup appearance and remains selected across popup openings.

## Appearance

System mode uses `prefers-color-scheme` and the browser's current light/dark setting. The selected appearance preference is stored locally in `chrome.storage.local`; System is used if no saved choice exists. The selected theme changes only slimeView's popup UI and does not affect the website.

## Dynamic website support

When a cleanup switch is ON, slimeView observes the current page for inserted elements and relevant attribute changes such as classes, IDs, visibility, and inline styles. This covers many client-rendered and single-page-app interfaces, including popup elements that are mounted later or revealed by a class/style change. It also searches and observes **open** Shadow DOM roots. If a dynamic update introduces more than 25 candidates at once, slimeView leaves those candidates untouched and asks for confirmation the next time you open its popup.

Browser security boundaries still apply: closed Shadow DOM and cross-origin iframe contents are not inspected. A page that continuously replaces its elements or uses unusual custom rendering may need a future site-specific rule.

## Privacy

slimeView does not store page text, credentials, form values, browsing history, or personal data. It stores only the popup appearance choice (System, Light, or Dark). Temporary cleanup state and undo records exist only in the active tab's content-script session. The extension makes no automatic network requests and uses no trackers, analytics, ads, external scripts, or external fonts. The author profile links in the popup open only when selected; cleanup runs locally after a user action.

## Ethical-use limitations

> slimeView modifies only the appearance of pages in your own browser. It does not unlock paid, private, or restricted content.

slimeView is not intended to bypass paywalls, subscriptions, authentication, DRM, or access controls, and it does not scrape or exfiltrate website data. Cleanup is disabled on hostnames recognized as banking, government, medical, health, or hospital sites. This hostname heuristic cannot identify every sensitive website; avoid cleanup on sensitive pages.

## File structure

```text
slimeView/
├── manifest.json
├── background.js
├── content.js
├── popup.html
├── popup.css
├── popup.js
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## Troubleshooting

- **Extension could not run:** Chrome restricts extensions on some internal, Web Store, and protected pages. Try a regular `https://` page.
- **A switch is unavailable:** The active tab may be a Chrome internal or otherwise restricted page. Check `chrome://extensions` for service-worker errors.
- **No candidates found:** The extension intentionally uses a conservative selector list and CSS inspection; a site's implementation may not match it.
- **Cleanup hid something useful:** Turn that switch OFF to restore its captured styles, use **Turn both off & undo**, or reload the page.
- **Switch shows OFF after navigation or reload:** Cleanup switches intentionally reset per page load. Re-enable them on the new page if needed.
- **Appearance choice is not retained:** Confirm Chrome has not cleared the extension's local storage and that slimeView remains enabled.

## Future improvement ideas

- Let users review a candidate list before enabling a cleanup.
- Add a bounded per-tab cleanup history with a one-click restore.
- Improve accessibility audits and automated test coverage across representative page fixtures.
- Add optional, user-controlled per-site presets stored only locally.
