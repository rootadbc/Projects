# Autofiller

Autofiller is a Chrome extension that turns repetitive form filling into a simple, repeatable workflow.

Instead of retyping the same details across sign-ups, applications, and checkout forms, Autofiller detects fields, applies your saved profile, and lets you review before submitting.

## Workflow

```text
1. Detect form fields
        ↓
2. Save your profile
        ↓
3. Autofill with one click
        ↓
4. Review and submit
```

## Screenshots

<table>
  <tr>
    <td align="center" valign="top">
      <img src="screenshot/form-detect.png" alt="Form detection" width="270"><br>
      <sub><strong>1. Detect</strong></sub>
    </td>
    <td align="center" valign="middle">
      <img src="screenshot/autofill.png" alt="Autofill form" width="270"><br>
      <sub><strong>2. Autofill</strong></sub>
    </td>
    <td align="center" valign="bottom">
      <img src="screenshot/image.png" alt="Autofiller interface" width="270"><br>
      <sub><strong>3. Manage</strong></sub>
    </td>
  </tr>
</table>

## Features

- Detects common form fields automatically
- Saves reusable profile details
- Fills forms with one click
- Supports name, email, phone, address, and custom fields
- Manage profiles from the options page
- Works locally in the browser
- Does not store passwords

## Installation

1. Download or clone this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select the `Autofiller` folder.

## Project Structure

```text
Autofiller/
├── README.md
├── assets/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── background/
│   └── service-worker.js
├── content/
│   └── content.js
├── options/
│   ├── options.css
│   ├── options.html
│   └── options.js
├── popup/
│   ├── popup.css
│   ├── popup.html
│   └── popup.js
├── screenshot/
│   ├── form-detect.png
│   ├── autofill.png
│   └── image.png
├── autofiller_project_document.pdf
└── manifest.json
```

## Privacy

Autofiller does not store passwords. Form data is handled locally in your browser and is used only to autofill forms at your request.

## Author

Created by [@rootadbc](https://github.com/rootadbc)
