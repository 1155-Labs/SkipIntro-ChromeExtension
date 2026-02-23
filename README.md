# 🚀 Universal Skip Intro (Chrome Extension)

![GitHub License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.9.1-green.svg)
![Chrome Web Store](https://img.shields.io/badge/platform-Chrome%20Web%20Store-orange.svg)

A powerful, multi-language Chrome extension that automatically skips intros, recaps, and ads across major streaming platforms. Built for speed, privacy, and seamless viewing.

---

## 🌟 Why Universal Skip Intro?

Unlike many basic extensions, **Universal Skip Intro** uses advanced DOM observation and deep event simulation to bypass "unclickable" buttons and handle complex Single Page Application (SPA) navigations.

### Key Features:
- **⚡ Pro-Active Detection**: Uses `MutationObserver` with specialized attribute filtering for zero-latency detection.
- **🛡️ Anti-Detection Bypass**: Simulates deep pointer events (`composed: true`) to penetrate Shadow DOM boundaries and bypass transparent overlays.
- **📍 Coordinate-Based Interaction**: Calculates element midpoints for precision clicks, avoiding common "phantom click" bugs.
- **🌍 Multi-Language Support**: Matches "Skip" keywords in over 18 languages.
- **📊 Real-time Dashboard**: Built-in developer tools with live logs and a global "Force Skip" button.

---

## 📺 Supported Services & Status

| Platform | Status | Features |
| :--- | :--- | :--- |
| **YouTube** | ✅ Stable | Ad-skip, Intro-skip, SPA Support, Overlay Bypass |
| **Prime Video** | ✅ Stable | Intro/Recap Skip, UI Freeze Prevention |
| **Netflix** | ✅ Stable | Automatic Intro/Recap/Next Episode |
| **Hotstar** | ✅ Stable | Ad-skip, Keyword fallback |
| **Amazon** | ✅ Stable | Video Ad-skipping |

---

## 🛠️ Installation

### Developer Mode (Local Load)
1.  Clone this repository:
    ```bash
    git clone https://github.com/saatvik-labs/UniversalSkipIntro.git
    ```
2.  Open Chrome and navigate to `chrome://extensions/`.
3.  Enable **Developer mode** in the top right corner.
4.  Click **Load unpacked** and select the extension folder.

---

## 🧪 Advanced Developer Tools

This extension includes a dedicated **Developer Dashboard** for debugging and performance monitoring.

- **📜 Live Logs**: Categorized logging (`OBSERVER`, `DETECTION`, `CLICK`, `ERROR`) to track script behavior in real-time.
- **🆘 Force Skip**: A manual override button in the popup that triggers an exhaustive sweep of all known selectors.
- **🕹️ Dev Mode Toggle**: Enable/Disable verbose logging and reporting with a single switch.

To access logs, right-click the extension icon and select **Developer Logs** (if enabled).

---

## 🧱 Technical Deep Dive

### High-Performance Observer
The extension uses a refined `MutationObserver` that only reacts to relevant UI changes:
```javascript
observer.observe(document.documentElement, {
  childList: true, 
  subtree: true, 
  attributes: true, 
  attributeFilter: ["class", "style", "hidden", "aria-hidden"]
});
```

### Deep Event Simulation
To handle modern players like YouTube's, we dispatch a sequence of pointer and mouse events:
```javascript
const events = ["pointerdown", "mousedown", "pointerup", "mouseup", "click"];
// Fires events at the exact midpoint of the detected element
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. My aim is to make this the most robust skip-intro tool on the market.

## 📄 License
MIT License - Copyright (c) 2026 Saatvik Shukla