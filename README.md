AIRedactX Redaction Extension

AIRedactX is a browser extension designed to help users automatically find and redact sensitive information from text fields before submission. It provides a configurable and user-friendly way to protect personally identifiable information (PII) when interacting with websites and AI chatbots.
⚠️ Current Status: Alpha - Under Active Development

This extension is currently not functional and is undergoing active development and troubleshooting.

The core user interface and redaction engine have been built, but a significant bug is preventing the extension from reliably detecting and interacting with text fields on modern websites. This is a known issue that is the current focus of development. The project is not yet ready for general use or testing.
Core Features (MVP Goals)

    Configurable Redaction Rules: Create custom rules to find and replace sensitive text.

        Literal Rules: Simple word-for-word replacement (e.g., "John Doe" → "REDACTED_NAME").

        Regex Rules: Powerful pattern-based matching for data like phone numbers, emails, and API keys.

    On-Page Redaction Controls: A "Redact" button appears inside active text areas for quick, one-click redaction.

    Context Menu Action: Right-click any text field and select "Redact this field" for easy access.

    Rule Management:

        Enable and disable rules with a toggle.

        Drag-and-drop reordering to control rule priority ("first match wins").

        Import and export your entire ruleset as a .csv file.

    Customizable Settings:

        Choose your preferred redaction style (e.g., [[..]], {{..}}).

        Select the position of the on-page controls.

        Enable "Use Anywhere Mode" to run the extension on any website.

Technology Stack

    Language: TypeScript

    Framework: React for the options UI

    Build Tool: Vite

    Browser API: WebExtension API (Manifest V3)

Getting Started (for Developers)

To set up the development environment, follow these steps:

    Clone the repository:

    git clone [https://github.com/your-username/airedactx.git](https://github.com/your-username/airedactx.git)
    cd airedactx

    Install dependencies:

    npm install

    Build the extension:

        To build for Firefox:

        npm run build:firefox

        To build for Chrome:

        npm run build:chrome

    This will create a dist directory containing the unpacked extension files.

    Load the extension in your browser:

        Firefox: Navigate to about:debugging, click "This Firefox," and load the dist/manifest.json file as a temporary add-on.

        Chrome: Navigate to chrome://extensions, enable "Developer mode," and load the dist directory as an unpacked extension.

How to Contribute

Once the core functionality is stable, contributions will be welcome. The immediate goal is to resolve the content script injection and detection issues. If you have expertise in this area, feel free to open an issue to discuss potential solutions.
License

This project is licensed under the MIT License. See the LICENSE file for details.
