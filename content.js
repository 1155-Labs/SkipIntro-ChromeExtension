// ─── Skip Intro – Content Script v1.7 ───────────────────────────────────────
// Fixes:
// 1. YouTube "Hidden" clicks: Uses a full event sequence (mousedown -> mouseup -> click)
// 2. YouTube Selectors: Broadened to catch modern container structures.
// 3. Debugging: Logs truncated HTML of detected buttons to verify targets.
// 4. Force Skip: Improved to bypass all checks and try all known strategies.

const SKIP_KEYWORDS = [
  "Skip", "Sauter", "Überspringen", "Saltar", "Pomiń",
  "Preskočiť", "Пропустить", "跳过", "건너뛰기", "スキップ",
  "Doorgaan", "Overslaan", "Přeskočit", "Hopp over",
  "Hoppa över", "Ignora", "Przejdź", "Pular"
];

// Broadened YouTube selectors
const YOUTUBE_SKIP_SELECTORS = [
  ".ytp-skip-ad-button",
  ".ytp-ad-skip-button",
  ".ytp-ad-skip-button-modern",
  ".ytp-skip-intro-button",
  "[class*='skip-ad']",
  "[class*='ad-skip']",
  ".ytp-ad-skip-button-container button",
  ".ytp-ad-skip-button-slot button"
];

const PRIME_SKIP_SELECTORS = [
  ".atvwebplayersdk-skipelement-button",
  "[class*='skipelement']",
  ".fu374p9" // Common Prime Video hash-based class
];

const HOTSTAR_SKIP_SELECTORS = [
  "[class*='skip' i]",
  "[data-testid*='skip' i]",
  "[aria-label*='skip' i]",
  ".p-ad-skip-button"
];

// State
let isEnabled = true;
let devMode = true;
const lastSuccessfulClick = {};
const CLICK_COOLDOWN_MS = 5000;
let lastRunAt = 0;
const MIN_INTERVAL_MS = 300;
let ytRetryInterval = null;

function devLog(category, message) {
  if (!devMode) return;
  chrome.storage.local.get(["devLogs"], (data) => {
    const logs = data.devLogs || [];
    logs.push({
      ts: new Date().toISOString(),
      cat: category,
      msg: message,
      url: window.location.href
    });
    if (logs.length > 500) logs.splice(0, logs.length - 500);
    chrome.storage.local.set({ devLogs: logs });
  });
}

function incrementSkipCount() {
  chrome.storage.local.get(["timesSkipped"], (r) => {
    chrome.storage.local.set({ timesSkipped: (r.timesSkipped || 0) + 1 });
  });
}

function recordSuccess(host) {
  lastSuccessfulClick[host] = Date.now();
  devLog("CLICK", `Cooldown started for ${host}`);
}

/**
 * Robust click simulation
 * Dispatches a sequence of events to mimic user interaction better.
 */
function simulateClick(element) {
  if (!element) return false;

  const events = ["pointerdown", "mousedown", "pointerup", "mouseup", "click"];
  const opts = { bubbles: true, cancelable: true, view: window, buttons: 1 };

  events.forEach(type => {
    const event = type.startsWith("pointer")
      ? new PointerEvent(type, { ...opts, pointerId: 1, isPrimary: true })
      : new MouseEvent(type, opts);
    element.dispatchEvent(event);
  });

  // Native click as fallback
  if (typeof element.click === "function") {
    element.click();
  }

  return true;
}

function tryClickButton(button, force = false) {
  if (!isEnabled && !force) return false;
  if (!button || !document.body.contains(button)) return false;

  const style = window.getComputedStyle(button);
  const isVisible = style.display !== "none" && style.visibility !== "hidden";

  if (!force && !isVisible) return false;

  // Log what we're clicking
  const htmlSnippet = button.outerHTML.substring(0, 100).replace(/\n/g, "");
  devLog("CLICK", `Attempting click on: ${htmlSnippet}...`);

  const success = simulateClick(button);
  if (success) incrementSkipCount();
  return success;
}

function findYouTubeSkipButton() {
  const player = document.querySelector(".html5-video-player, #movie_player");
  const scope = player || document;

  for (const sel of YOUTUBE_SKIP_SELECTORS) {
    const btn = scope.querySelector(sel);
    if (btn) return btn;
  }
  return null;
}

function startYouTubeRetry() {
  if (ytRetryInterval) return;

  devLog("DETECTION", "YouTube skip button found — starting retry loop");

  let attempts = 0;
  const MAX_ATTEMPTS = 50;

  ytRetryInterval = setInterval(() => {
    attempts++;
    const btn = findYouTubeSkipButton();

    if (!btn) {
      devLog("DETECTION", `YT retry: button gone after ${attempts} attempts`);
      clearInterval(ytRetryInterval);
      ytRetryInterval = null;
      return;
    }

    if (attempts > MAX_ATTEMPTS) {
      devLog("ERROR", "YT retry: giving up after 50 attempts");
      clearInterval(ytRetryInterval);
      ytRetryInterval = null;
      return;
    }

    // On YouTube, we click even if it looks "hidden" (opacity < 1 or small size)
    // because that's often just the countdown state.
    const clicked = tryClickButton(btn, true);

    if (clicked) {
      // Check if it's still there after a short delay
      setTimeout(() => {
        if (!findYouTubeSkipButton()) {
          devLog("CLICK", "YouTube skip confirmed — button gone");
          clearInterval(ytRetryInterval);
          ytRetryInterval = null;
          recordSuccess("youtube.com");
        }
      }, 500);
    }
  }, 600);
}

function clickSkipButtons() {
  const now = Date.now();
  if (now - lastRunAt < MIN_INTERVAL_MS) return;
  lastRunAt = now;

  if (!isEnabled || !document.body) return;

  const host = window.location.hostname;
  const isYouTube = host.includes("youtube.com");
  const isHotstar = host.includes("hotstar.com");
  const isPrime = host.includes("primevideo.com") || host.includes("amazon.com");

  // YouTube logic
  if (isYouTube) {
    const btn = findYouTubeSkipButton();
    if (btn) {
      startYouTubeRetry();
    }
    return;
  }

  // Cooldown check for others
  const lastSuccess = lastSuccessfulClick[host] || 0;
  if (now - lastSuccess < CLICK_COOLDOWN_MS) return;

  // Prime
  if (isPrime) {
    let clicked = false;
    PRIME_SKIP_SELECTORS.forEach(sel => {
      document.querySelectorAll(sel).forEach(btn => {
        if (tryClickButton(btn)) {
          devLog("CLICK", `Prime clicked selector: ${sel}`);
          clicked = true;
        }
      });
    });
    if (clicked) { recordSuccess(host); return; }
    if (sweepByKeyword("Prime")) recordSuccess(host);
  }

  // Hotstar
  else if (isHotstar) {
    let clicked = false;
    HOTSTAR_SKIP_SELECTORS.forEach(sel => {
      document.querySelectorAll(sel).forEach(btn => {
        if (tryClickButton(btn)) {
          devLog("CLICK", `Hotstar clicked selector: ${sel}`);
          clicked = true;
        }
      });
    });
    if (clicked) { recordSuccess(host); return; }
    if (sweepByKeyword("Hotstar")) recordSuccess(host);
  }

  // Generic
  else {
    if (sweepByKeyword("Generic")) recordSuccess(host);
  }
}

function sweepByKeyword(label) {
  let found = false;
  const buttons = document.querySelectorAll("button, [role='button'], .ytp-ad-skip-button-text, .atvwebplayersdk-skipelement-button");
  buttons.forEach(btn => {
    const text = (btn.innerText || btn.textContent || "").trim();
    if (!text) return;
    const kw = SKIP_KEYWORDS.find(k => text.startsWith(k));
    if (kw) {
      if (tryClickButton(btn)) {
        devLog("CLICK", `[${label}] Keyword match "${kw}" successfully clicked`);
        found = true;
      }
    }
  });
  return found;
}

// Observer & Polling
let observer = null;
let pollTimer = null;

function startObserver() {
  if (observer) return;
  observer = new MutationObserver(() => clickSkipButtons());
  observer.observe(document.documentElement, {
    childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "aria-hidden", "data-state", "class"]
  });
  pollTimer = setInterval(clickSkipButtons, 1000);
  clickSkipButtons();
}

function stopObserver() {
  if (observer) { observer.disconnect(); observer = null; }
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
}

// Init & Settings
function sync() {
  chrome.storage.local.get(["isEnabled", "devMode"], (d) => {
    isEnabled = d.isEnabled !== false;
    devMode = d.devMode !== false;
    isEnabled ? startObserver() : stopObserver();
  });
}

chrome.storage.onChanged.addListener(() => sync());

// Force Skip from popup
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== "FORCE_SKIP") return;
  devLog("CLICK", "Force Skip triggered");

  // Bypass everything
  let clicked = false;
  const selectors = [...YOUTUBE_SKIP_SELECTORS, ...PRIME_SKIP_SELECTORS, ...HOTSTAR_SKIP_SELECTORS];
  selectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(btn => {
      if (tryClickButton(btn, true)) clicked = true;
    });
  });

  if (!clicked) clicked = sweepByKeyword("Force");

  sendResponse({ clicked });
});

// YouTube SPA Navigation
window.addEventListener("yt-navigate-finish", () => {
  devLog("OBSERVER", "YouTube SPA nav — re-scanning");
  if (ytRetryInterval) { clearInterval(ytRetryInterval); ytRetryInterval = null; }
  sync();
});

sync();
