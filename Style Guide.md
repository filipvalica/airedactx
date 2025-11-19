# AIRedactX Style Guide

## Layout

* **Grid:** 8px base unit
* **Section padding:** 24px top/bottom, 16px sides
* **Row height:**

  * Table rows: 40–44px
  * Form inputs/buttons: 40px
* **Interactive target:** Minimum 44px
* **Cards/containers:** Rounded corners (8px), subtle shadow (Material 3 style)

---

## Typography

* **Font family:** System sans-serif

  * macOS: SF Pro
  * Windows: Segoe UI
  * Linux: Ubuntu/Cantarell

**Hierarchy**

* **App Title / Page Title:** 20–22px, semibold, #212121
* **Section Titles:** 16–18px, semibold, #212121
* **Group Headers (collapsible dividers):** 14px, semibold, #616161
* **Field Labels:** 14px, medium, #616161
* **Body Text (instructions, table content):** 14px, regular, #212121
* **Secondary / Helper Text:** 13–14px, regular, #616161
* **Disabled Text:** 14px, #9E9E9E

---

## Colors

* **Background:** #FAFAFA
* **Card/Table:** #FFFFFF
* **Dividers:** #E0E0E0
* **Primary Accent:** #FF6A00 (orange from logo, used for toggles ON, buttons, focus outlines)
* **Secondary Accent:** #0060DF (blue, reserved for links or less frequent states)
* **Hover State:** rgba(0,0,0,0.04)
* **Focus Outline:** 2px solid #FF6A00
* **Error:** #D32F2F

---

## Components

### Buttons

* **Primary:** background #FF6A00, text #FFFFFF
* **Secondary:** transparent background, border #E0E0E0, text #212121
* **Hover:** background darkens by 10%

### Inputs

* Height: 40px
* Border: 1px solid #E0E0E0
* Focus: 2px solid #FF6A00, outline none
* Label: 14px medium #616161 above field
* Helper text (optional): 13px #616161 below

### Tables (Rules List)

* Row height: 40–44px
* Row background: #FFFFFF
* Zebra striping: alternate row #F9F9F9
* Hover: background rgba(0,0,0,0.04)
* Column alignment: left for labels, right for actions
* Header row: sticky, with bottom border #E0E0E0

### Toggles

* Role: switch, aria-checked true/false
* **ON:** track #FF6A00, white thumb
* **OFF:** #E0E0E0 track, gray thumb

### Group Dividers (Collapsible Sections)

* Background: #F9F9F9
* Label: 14px, semibold, #616161
* Chevron icon left, rotates on expand/collapse
* Accent color: #FF6A00 on active state
* Optional rule count displayed inline, gray (#616161)

### Tags for Rule Type

* **Literal:** neutral gray pill (#F0F0F0 background, #212121 text)
* **Regex:** orange pill (#FFF1E6 background, #FF6A00 text)
* **Divider:** neutral blue pill (#E6F0FF background, #0060DF text)

### Actions

* Edit: pencil icon, ghost style (gray until hover)
* Delete: trash icon, red hover (#D32F2F)
* On delete: snackbar with undo (bottom left, dark background #333, white text, action #FF6A00)

---

## Accessibility

* Contrast: all text ≥ 4.5:1 against background
* Keyboard: tab through inputs, space/enter toggles switches
* Screen reader labels for all controls (“Toggle rule on/off”, “Edit rule”, etc.)
* Collapsible groups announce expand/collapse state

---

## Micro-Interactions

* Drag handle (⋮⋮) for reordering rules and groups, cursor changes to grab.
* Smooth hover highlight on rows.
* Collapsed groups hide children but preserve order/state.
* Deletion always triggers snackbar with undo.