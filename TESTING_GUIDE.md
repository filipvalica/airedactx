# AIRedactX Enhanced Testing Guide

## Overview
This guide provides comprehensive testing instructions for the enhanced AIRedactX extension that now includes advanced text field detection capabilities for modern web applications.

## Key Improvements Made

### 1. Enhanced Element Detection
- **Multiple Input Types**: Now detects `input[type="text"]`, `input[type="email"]`, `input[type="password"]`, `input[type="search"]`, `input[type="tel"]`, `input[type="url"]`
- **ContentEditable Elements**: Improved detection of `contenteditable` divs and elements
- **Role-Based Detection**: Detects elements with `role="textbox"` or `role="combobox"`
- **Class Pattern Matching**: Identifies editable elements by common class patterns like `input`, `textbox`, `editor`, `composer`, `message`, `chat`, `prompt`, `query`, `search`, `form-control`

### 2. Advanced Shadow DOM Support
- **Recursive Shadow DOM Traversal**: Searches through nested Shadow DOMs
- **Event Path Analysis**: Uses `event.composedPath()` to detect elements in Shadow DOM
- **Cross-Component Detection**: Handles web components and custom elements

### 3. Iframe Support
- **Cross-Frame Detection**: Searches for editable elements within iframes
- **Cross-Origin Handling**: Gracefully handles cross-origin iframe restrictions

### 4. Dynamic Content Monitoring
- **MutationObserver**: Monitors DOM changes for dynamically added elements
- **Event Listener Attachment**: Automatically attaches listeners to new editable elements
- **Real-Time Detection**: Detects elements as they're added to the page

### 5. Improved Event Handling
- **Multiple Event Types**: Listens to `focusin`, `focusout`, and `click` events
- **Event Delegation**: Uses event delegation for better performance
- **Framework Integration**: Triggers `input` events to notify JavaScript frameworks

## Testing Instructions

### Prerequisites
1. Load the extension in your browser
2. Enable "Use Anywhere Mode" in the extension settings
3. Have some test redaction rules configured

### Test Sites and Scenarios

#### 1. ChatGPT (chat.openai.com)
**Expected Behavior**: The redaction button should appear when you click into the message input area.

**Test Steps**:
1. Go to https://chat.openai.com
2. Click into the message input area at the bottom
3. Look for the "Redact" button appearing near the input field
4. Type some text and click "Redact" to test redaction functionality

**What to Look For**:
- Button appears when focusing the input
- Button disappears when clicking elsewhere
- Redaction works on the text content

#### 2. Google Search (google.com)
**Expected Behavior**: The redaction button should appear when you click into the search box.

**Test Steps**:
1. Go to https://google.com
2. Click into the search input field
3. Look for the "Redact" button
4. Test redaction functionality

#### 3. Gmail (mail.google.com)
**Expected Behavior**: The redaction button should appear when composing emails.

**Test Steps**:
1. Go to https://mail.google.com
2. Click "Compose" to start a new email
3. Click into the "To" field or message body
4. Look for the redaction button

#### 4. GitHub (github.com)
**Expected Behavior**: The redaction button should appear in comment boxes and issue descriptions.

**Test Steps**:
1. Go to any GitHub repository
2. Click "Issues" and create a new issue
3. Click into the title or description fields
4. Look for the redaction button

#### 5. Twitter/X (x.com)
**Expected Behavior**: The redaction button should appear in the tweet composer.

**Test Steps**:
1. Go to https://x.com
2. Click into the "What's happening?" text area
3. Look for the redaction button

#### 6. Facebook (facebook.com)
**Expected Behavior**: The redaction button should appear in post composer and comment fields.

**Test Steps**:
1. Go to https://facebook.com
2. Click into the "What's on your mind?" area or any comment field
3. Look for the redaction button

### Testing Different Input Types

#### Standard HTML Inputs
Test these input types on any form:
- `<input type="text">`
- `<input type="email">`
- `<input type="password">`
- `<input type="search">`
- `<input type="tel">`
- `<input type="url">`
- `<textarea>`

#### ContentEditable Elements
Test these patterns:
- `<div contenteditable="true">`
- `<div contenteditable="">`
- Elements with `role="textbox"`
- Elements with `role="combobox"`

### Testing Shadow DOM Components

#### Web Components
Look for custom elements that might use Shadow DOM:
- Custom input components
- Rich text editors
- Chat interfaces
- Form builders

#### Testing Steps
1. Open browser developer tools
2. Look for elements with `#shadow-root` in the DOM tree
3. Try to interact with input fields within these components
4. Verify the redaction button appears

### Testing Dynamic Content

#### Single Page Applications
Test on SPAs that load content dynamically:
1. Navigate to different sections of the app
2. Look for new input fields that appear
3. Verify the redaction button works on dynamically loaded fields

#### AJAX-Loaded Forms
1. Trigger actions that load new forms
2. Test redaction on newly loaded input fields

### Debugging Tips

#### Enable Console Logging
Open browser developer tools and look for these log messages:
- "AIRedactX content script loaded."
- "AIRedactX content script initialized with enhanced detection"
- Any error messages related to element detection

#### Check Element Detection
In the console, you can test element detection:
```javascript
// This should return an array of detected editable elements
console.log(document.querySelectorAll('[contenteditable], input, textarea'));
```

#### Verify Event Listeners
Check if event listeners are properly attached:
```javascript
// Check if focusin events are being captured
document.addEventListener('focusin', (e) => console.log('Focus detected:', e.target));
```

### Common Issues and Solutions

#### Button Not Appearing
1. Check if "Use Anywhere Mode" is enabled
2. Verify the element is actually editable (not disabled/readonly)
3. Check console for error messages
4. Try clicking directly on the input field

#### Button Appears But Redaction Doesn't Work
1. Check if redaction rules are configured
2. Verify the element type is supported
3. Check console for redaction errors

#### Performance Issues
1. Check if too many elements are being monitored
2. Look for excessive DOM mutations
3. Verify MutationObserver is working efficiently

### Reporting Issues

When reporting issues, please include:
1. The website URL
2. The specific input field that's not working
3. Browser and version
4. Console error messages
5. Steps to reproduce
6. Screenshots if helpful

### Success Criteria

The extension is working correctly if:
1. Redaction buttons appear on most modern websites
2. Buttons appear for different types of input fields
3. Redaction functionality works as expected
4. No console errors during normal operation
5. Performance is acceptable (no noticeable lag)

## Next Steps

After testing, if issues are found:
1. Document the specific problems
2. Test on additional websites
3. Refine the detection algorithms
4. Add support for additional element types
5. Optimize performance if needed
