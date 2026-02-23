# Universal Skip Intro (Chrome Extension)

Professional version: 1.9.1
License: MIT

A robust Chrome extension designed to automatically skip intros, recaps, and ads across major streaming platforms. This version implements advanced DOM observation and deep event simulation to improve interaction reliability on complex players.

---

## Core Features

- **Pro-Active Detection**: Utilizes specialized `MutationObserver` filtering to detect buttons with minimal performance overhead.
- **Deep Event Simulation**: Dispatches composed pointer events to penetrate Shadow DOM boundaries.
- **Coordinate-Based Clicks**: Calculates element midpoints for precise interaction, bypassing certain anti-bot protections.
- **Multi-Language Support**: Matches "Skip" keywords in over 18 languages.
- **Developer Dashboard**: Includes live logs and manual override (Force Skip) capabilities.

---

## Service Status and Stability

| Platform | Status | Notes |
| :--- | :--- | :--- |
| **Prime Video** | Stable | Fully verified. Cooldowns prevent UI freezes. |
| **Netflix** | Stable | Fully verified. Handles intros and next episode triggers. |
| **YouTube** | Unstable | In development. Handling SPA transitions and modern mini-player ads. |
| **Hotstar** | Pending | Awaiting final end-to-end verification. |
| **Amazon** | Stable | Verified for standard video ad-skipping. |

---

## Installation

### Developer Mode (Local Load)
1. Clone this repository to your local machine.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top right corner.
4. Click **Load unpacked** and select the extension folder.

---

## Technical Implementation

### Shadow DOM Integration
To handle players that encapsulate controls within Shadow Roots, the extension dispatches events with the `composed` flag:
```javascript
const opts = {
  bubbles: true,
  cancelable: true,
  composed: true, // Allows event to cross shadow boundaries
  view: window,
  // ... coordinates
};
```

### Overlay Bypass
Using `document.elementFromPoint`, the extension can identify and click through transparent blocking layers that streaming platforms occasionally use to prevent programmatic skips.

---

## License
MIT License - Copyright (c) 2026 Saatvik Shukla