### **Product Specification: AIRedactX Redaction Extension**

  * **Version:** 1.3
  * **Date:** September 6, 2025
  * **Status:** Finalized for Development

### 1\. Overview

This document outlines the requirements for the AIRedactX Redaction Extension MVP (v1.3).
The extension is a browser tool designed to help users automatically redact sensitive information from text fields before submission.

### 2\. Core User-Facing Features

#### 2.1. On-Page Controls

The primary user interaction occurs via a button group that appears as a small overlay inside the active, multi-line text area.

  * **Button Placement:** The position of this button group is determined by the `AIRedactX hover area` setting (see Section 4.2).
  * **Contextual Button Visibility:**
      * **On Supported Platforms** (via Site Adapters for ChatGPT, Claude, Grok, Gemini): Two buttons are displayed: `Redact and Submit` and `Redact`.
  * **On Unsupported Websites** (via Universal Injection with `Use Anywhere` mode active): Only the `Redact` button is displayed.

#### 2.2. Extension Toolbar Menu

Clicking the extension's icon in the browser toolbar reveals a menu:

  * `Rules`: Opens the Rules configuration tab.
  * `Settings`: Opens the Settings configuration tab.
  * `Turn on/off on this site`: Toggles the extension's active state for the current domain by managing a blacklist.
  * `Report an Issue`: A quick link to the project's GitHub Issues page.

#### 2.3. Context Menu Integration

When `Use Anywhere` mode is active, a right-click context menu option, `Redact this field`, will be available for all detected text areas.

### 3\. Redaction Engine & Logic

#### 3.1. Execution Order

The engine processes rules in a strict sequence.

1.  **Literal Rules (Find/Replace):** All literal string replacement rules are executed first, in the priority order set by the user.
2.  **Regex Rules:** All regular expression rules are executed on the text resulting from the first stage, in their user-defined priority order.

#### 3.2. Conflict Resolution: First Match Wins

Conflict resolution is determined by user-defined rule priority.

  * The engine processes rules from top to bottom as ordered in the `Rules` tab.
  * The first rule that successfully finds a match will perform its redaction.
    That segment of text is then considered final and will be ignored by all subsequent rules, even if another rule represents a longer potential match.

#### 3.3. Regex Numbering Logic

The engine identifies unique PII instances and assigns a persistent number.

  * The `Replacement` field in a Regex Rule defines the base placeholder (e.g., "Phone").
  * If the same string (e.g., the same phone number) appears multiple times, it will be assigned the same placeholder number each time (e.g., `[[Phone 1]]... [[Phone 1]]`).

### 4\. Configuration Tabs

#### 4.1. Rules Tab

  * **Structure:** Two sections for rule management: "Literal Rules (Find/Replace)" and "Regex Rules". Both rule types are supported in the MVP.
  * **Rule Management:**
      * Users can add (`+`) or remove (`-`) rules.
  * Users can reorder rules using `↑` and `↓` arrow buttons to control execution priority.
  * **Default Rules:** The MVP will ship with preloaded regex rules for: Email, Phone (US), SSN, Credit Card (with Luhn validation), Generic API key, IPv4, IPv6, AWS key, GitHub token, and MAC address.
  * **Data Management:** Users can `Import` and `Export` the entire ruleset. The format is `TSV` (UTF-8 with BOM), allowing users to edit rules in spreadsheet software like Excel.
    The TSV schema will be a flat table with columns: `type` (`literal` or `regex`), `find`, `replace`.

#### 4.2. Settings Tab

  * **`Require redaction before submit`:** Global toggle (`On`/`Off`), default `Off`.
  * When `On`, the native submit button on **supported sites only** will be programmatically disabled until a redaction action (`Redact` or `Redact and Submit`) is performed by the user.
  * **`Replace text using`:** Dropdown menu for selecting the delimiter style.
  * **Options:** `[[..]]`, `{{..}}`, `((..))`, `<<..>>`
      * **Default:** `[[..]]`
  * **`AIRedactX hover area`:** Dropdown menu that defines the corner within the text area where the button group will appear.
  * **Options:** `top-left`, `top-right`, `bottom-left`, `bottom-right`
      * **Default:** `bottom-right`
  * **`Highlight Redactions`:** Dropdown menu for selecting a visual style.
  * **Options:** A list of pre-defined, high-contrast styles (e.g., "Blackout") and a "No Style" option.
  * **Default:** "No Style"
  * **`Use Anywhere Mode`:** Toggle (`On`/`Off`) to enable functionality on unsupported websites.
  * **Default:** `Off`

### 5\. Technical Architecture

  * **Interaction Layer:** The extension operates in two modes:
    1.  **Site Adapters:** Custom, reliable integrations for officially supported platforms (ChatGPT, Claude, Gemini, Grok) that can safely interact with native submit buttons.

<!-- end list -->

2.  **Universal Injection:** A generic approach for `Use Anywhere` mode that uses the context menu and heuristic DOM traversal to find textareas and contenteditable elements on unsupported sites.

### 6\. Scope & Limitations for MVP

  * **Dynamic Content:** The extension **supports** the detection of buttons and input fields that are loaded dynamically after the initial page render through the use of a `MutationObserver`.
  * **Preview Modal:** A dedicated modal window to preview changes before applying them is deferred to a future release.

#### 1\. Recommended Technology Stack (Confirmed)

  * **Languages:** **TypeScript**, HTML, and CSS. TypeScript will ensure code quality and reduce runtime errors.
  * **Framework:** **React**. This will be used for building all user interface components, including the `Rules` and `Settings` pages.
  * **Build Tool:** **Vite**. It will be configured to compile the TypeScript/React source code into optimized, browser-ready packages.

#### 2\. Cross-Browser Development Strategy (Confirmed)

  * **Core API:** The extension will be built using the **WebExtension API** and the **Manifest V3** standard to ensure maximum code reuse and forward compatibility.
  * **Process:** The single TypeScript/React codebase will be compiled into distinct packages for each target browser (Chrome, Firefox, Edge). Browser-specific manifest keys will be handled during the automated build process.

#### 3\. Data Storage (Confirmed)

  * **API:** All user data (rules and settings) will be stored using the **`browser.storage.local`** API. This ensures data is stored securely and locally on the user's machine, sandboxed from websites.
  * **Future Scope:** Data synchronization via `browser.storage.sync` and centralized rule management for business users are designated as potential premium features for post-MVP releases.

#### 4\. Data Management & Validation (Updated Requirement)

  * **Format:** The import/export format for rules will be `TSV` (UTF-8 with BOM).
  * **TSV Import Validation:** The extension **must** perform basic validation on any imported TSV file. If any error is detected, the import process must be halted, and a clear error message must be displayed to the user. The validation checks will include:
      * **Header Validation:** The TSV must contain the header row with the exact columns: `type`, `find`, `replace`, `Active`, `Note`.
  * **Row Structure Validation:** Each row must have a value for the required columns.
  * **Type Column Validation:** The value in the `type` column must be either `literal`, `regex`, or `divider`.
  * **Regex Syntax Validation:** For rows where `type` is `regex`, the value in the `find` column must be a valid regular expression.

#### 5\. Development Environment & Version Control (Confirmed)

  * **Local Environment (Windows):** The recommended toolchain includes **VS Code**, **Node.js**, and **Git**.
  * **Version Control:** **GitHub** will be used for source code management. For ease of use, **GitHub Desktop** is the recommended client for managing commits and synchronization with the online repository.

### Product Specification: AIRedactX Redaction Extension

  * **Version:** 1.4
  * **Date:** October 4, 2025
  * **Status:** Finalized for Development

### 1\. Summary of Changes in v1.4

Version 1.4 focuses on foundational improvements to data management and user experience, enhancing rule organization and providing more robust settings control. This update establishes a stable base for future feature development, including the switch to a TSV data format, the addition of rule dividers and notes, enhanced import logic, and settings reset functionality.

### 2\. Rule Management & Data I/O

This section details the functionalities related to creating, managing, and transferring user-defined redaction rules.

#### 2.1. Data Management Format

  * **Format:** The import/export format for rules is now **TSV (Tab-Separated Values)**, encoded in UTF-8.
  * **TSV Header:** The TSV file must contain a header row with the exact columns in this order: `type`, `find`, `replace`, `Active`, `Note`.
  * **TSV Import Validation:** The extension will validate any imported TSV file. The import will halt with a clear error message if:
      * The header is missing or incorrect.
  * Any row does not have the required number of columns.
  * The `type` column contains a value other than `literal`, `regex`, or `divider`.

#### 2.2. Rule Structure and Elements

  * **Rule Dividers:** A new `divider` type is available for organizing rules. In the UI, this renders as a non-functional, titled separator. The title is derived from the `find` column. Dividers can be added, edited, and repositioned via drag-and-drop.
  * **Note Column:** An optional `Note` field has been added to each rule, with a maximum length of **255 characters**. In the UI, a note icon will appear next to any rule with a note; hovering over this icon will display