AIRedactX Redaction Extension

AIRedactX is a browser extension designed to help users automatically find and redact sensitive information from text fields before submission. It provides a configurable and user-friendly way to protect personally identifiable information (PII) when interacting with websites and AI chatbots.

⚠️ Current Status: Alpha - Under Active Development

## Core Features

* **Configurable Redaction Rules**: Create custom rules to find and replace sensitive text using simple literal matching or powerful regular expressions (Regex).
* **On-Page Redaction Controls**: A "Redact" button appears inside active text areas for quick, one-click redaction.
* **Context Menu Action**: Right-click any text field and select "Redact this field" for easy access.
* **Rule Management**: Enable/disable rules, drag-and-drop to reorder priority, and import/export your entire ruleset as a `.csv` file.
* **Customizable Settings**: Choose your preferred redaction style (e.g., `[[..]]`, `{{..}}`) and the position of the on-page controls.

## Technology Stack

* **Language**: TypeScript
* **Framework**: React for the options UI
* **Build Tool**: Vite
* **Browser API**: WebExtension API (Manifest V3)

## Getting Started (for Developers)

Follow these steps to set up the development environment, build the extension, and load it in your browser.

### Prerequisites

* [Node.js](https://nodejs.org/) (v20.x or later recommended)
* [npm](https://www.npmjs.com/) (usually included with Node.js)

### 1. Clone the Repository

```bash
git clone [https://github.com/filipvalica/airedactx.git](https://github.com/filipvalica/airedactx.git)
cd airedactx
````

### 2\. Install Dependencies

Install all the required packages for the project.

```bash
npm install
```

### 3\. Build the Extension

The project includes separate build commands for Firefox and Chrome. The build artifacts will be generated in the `dist/` directory.

  * **To build for Firefox:**

    ```bash
    npm run build:firefox
    ```

  * **To build for Chrome:**

    ```bash
    npm run build:chrome
    ```

### 4\. Load the Extension in Your Browser

#### For Firefox

1.  Navigate to `about:debugging` in the address bar.
2.  Click on **"This Firefox"** in the left-hand sidebar.
3.  Click the **"Load Temporary Add-on..."** button.
4.  Select the `manifest.json` file from within the `dist` directory in your project folder.

#### For Chrome

1.  Navigate to `chrome://extensions` in the address bar.
2.  Enable **"Developer mode"** using the toggle in the top-right corner.
3.  Click the **"Load unpacked"** button.
4.  Select the entire `dist` directory from your project folder.

### Development Workflow

After making changes to the source code, simply run the appropriate build command (`npm run build:firefox` or `npm run build:chrome`) and then click the **Reload** button next to the extension's entry in `about:debugging` (Firefox) or `chrome://extensions` (Chrome). You do not need to remove and re-add the extension each time.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
