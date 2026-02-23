// ─── Skip Intro – Content Script v1.9 ───────────────────────────────────────
// Fixes for YouTube "Unresponsive" buttons:
// 1. Interactive Check: Refined isElementVisible to handle pointer-events: none.
// 2. Overlay Bypass: Uses elementFromPoint to find and click whatever is blocking the button.
// 3. Composed Events: Ensures events reach inside Shadow DOM boundaries.
// 4. Modern Selectors: Added support for dynamic IDs like [id^='skip-button'].

const SKIP_KEYWORDS = [
  "Skip", "Sauter", "Überspringen", "Saltar", "Pomiń",
  "Preskočiť", "Пропустить", "跳过", "건너뛰기", "スキップ",
  "Doorgaan", "Overslaan", "Přeskočit", "Hopp over",
  "Hoppa över", "Ignora", "Przejdź", "Pular"
];

const YOUTUBE_SKIP_SELECTORS = [
  ".ytp-skip-ad-button",
  ".ytp-ad-skip-button",
  ".ytp-ad-skip-button-modern",
  ".ytp-skip-intro-button",
  "[class*='skip-ad']",
  "[class*='ad-skip']",
  ".ytp-ad-skip-button-container button",
  ".ytp-ad-skip-button-slot button",
  "[id^='skip-button']",
  ".ytp-ad-skip-button-text"
];

const PRIME_SKIP_SELECTORS = [
  ".atvwebplayersdk-skipelement-button",
  "[class*='skipelement']",
  ".fu374p9"
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
 * Checks if an element is actually visible and interactable
 */
function isElementVisible(el) {
  if (!el) return false;
  const style = window.getComputedStyle(el);

  // Basic visibility
  if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;

  // Interaction block check
  if (style.pointerEvents === "none") return false;

  // ARIA check
  if (el.getAttribute("aria-disabled") === "true") return false;

  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

/**
 * Deep click simulation + Overlay Bypass
 */
function simulateClick(element) {
  if (!element) return false;

  const rect = element.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  // Safety: ensure point is within viewport
  if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) {
    devLog("ERROR", `Click point (${x}, ${y}) is out of viewport`);
    return false;
  }

  const events = ["pointerdown", "mousedown", "pointerup", "mouseup", "click"];
  const opts = {
    bubbles: true,
    cancelable: true,
    composed: true, // Crucial for Shadow DOM
    view: window,
    clientX: x,
    clientY: y,
    screenX: x,
    screenY: y,
    buttons: 1,
    detail: 1
  };

  const dispatch = (target, type) => {
    const event = type.startsWith("pointer")
      ? new PointerEvent(type, { ...opts, pointerId: 1, isPrimary: true, pressure: 0.5 })
      : new MouseEvent(type, opts);
    target.dispatchEvent(event);
  };

  // Path 1: Targeted click on the element itself
  events.forEach(type => dispatch(element, type));

  // Path 2: Overlay Bypass - click whatever is AT that point (if it's not the button)
  const topElement = document.elementFromPoint(x, y);
  if (topElement && topElement !== element && !element.contains(topElement)) {
    devLog("CLICK", `Overlay detected: ${topElement.tagName.toLowerCase()} at (${Math.round(x)}, ${Math.round(y)}). Clicking overlay path too.`);
    events.forEach(type => dispatch(topElement, type));
  }

  // Path 3: Native click fallback
  if (typeof element.click === "function") {
    element.click();
  }

  return true;
}

function tryClickButton(button, force = false) {
  if (!isEnabled && !force) return false;
  if (!button || !document.body.contains(button)) return false;

  if (!force && !isElementVisible(button)) {
    return false;
  }

  const htmlSnippet = button.outerHTML.substring(0, 100).replace(/\n/g, "");
  devLog("CLICK", `Attempting deep click on: ${htmlSnippet}...`);

  const success = simulateClick(button);
  if (success) incrementSkipCount();
  return success;
}

function findYouTubeSkipButton() {
  const player = document.querySelector(".html5-video-player, #movie_player");
  const scope = player || document;

  for (const sel of YOUTUBE_SKIP_SELECTORS) {
    const buttons = scope.querySelectorAll(sel);
    for (const btn of buttons) {
      if (isElementVisible(btn)) return btn;
    }
  }
  return null;
}

function startYouTubeRetry() {
  if (ytRetryInterval) return;

  devLog("DETECTION", "YouTube skip button found (visible/interactive) — starting retry loop");

  let attempts = 0;
  const MAX_ATTEMPTS = 50;

  ytRetryInterval = setInterval(() => {
    attempts++;
    const btn = findYouTubeSkipButton();

    if (!btn) {
      devLog("DETECTION", `YT retry: no visible/interactive button found after ${attempts} attempts`);
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

    // Attempt the click
    const clicked = tryClickButton(btn, true);

    if (clicked) {
      // Check for success soon after
      setTimeout(() => {
        if (!findYouTubeSkipButton()) {
          devLog("CLICK", "YouTube skip confirmed — button gone");
          clearInterval(ytRetryInterval);
          ytRetryInterval = null;
          recordSuccess("youtube.com");
        }
      }, 600);
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

  if (isYouTube) {
    const btn = findYouTubeSkipButton();
    if (btn) {
      startYouTubeRetry();
    }
    return;
  }

  const lastSuccess = lastSuccessfulClick[host] || 0;
  if (now - lastSuccess < CLICK_COOLDOWN_MS) return;

  if (isPrime) {
    let clicked = false;
    PRIME_SKIP_SELECTORS.forEach(sel => {
      document.querySelectorAll(sel).forEach(btn => {
        if (isElementVisible(btn) && tryClickButton(btn)) {
          devLog("CLICK", `Prime clicked selector: ${sel}`);
          clicked = true;
        }
      });
    });
    if (clicked) { recordSuccess(host); return; }
    if (sweepByKeyword("Prime")) recordSuccess(host);
  } else if (isHotstar) {
    let clicked = false;
    HOTSTAR_SKIP_SELECTORS.forEach(sel => {
      document.querySelectorAll(sel).forEach(btn => {
        if (isElementVisible(btn) && tryClickButton(btn)) {
          devLog("CLICK", `Hotstar clicked selector: ${sel}`);
          clicked = true;
        }
      });
    });
    if (clicked) { recordSuccess(host); return; }
    if (sweepByKeyword("Hotstar")) recordSuccess(host);
  } else {
    if (sweepByKeyword("Generic")) recordSuccess(host);
  }
}

function sweepByKeyword(label) {
  let found = false;
  const buttons = document.querySelectorAll("button, [role='button'], .ytp-ad-skip-button-text");
  buttons.forEach(btn => {
    if (!isElementVisible(btn)) return;
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

let observer = null;
let pollTimer = null;

function startObserver() {
  if (observer) return;
  observer = new MutationObserver(() => clickSkipButtons());
  observer.observe(document.documentElement, {
    childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "aria-hidden", "data-state", "class", "style"]
  });
  pollTimer = setInterval(clickSkipButtons, 1000);
  clickSkipButtons();
}

function stopObserver() {
  if (observer) { observer.disconnect(); observer = null; }
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
}

function sync() {
  chrome.storage.local.get(["isEnabled", "devMode"], (d) => {
    isEnabled = d.isEnabled !== false;
    devMode = d.devMode !== false;
    isEnabled ? startObserver() : stopObserver();
  });
}

chrome.storage.onChanged.addListener(() => sync());

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== "FORCE_SKIP") return;
  devLog("CLICK", "Force Skip triggered");

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

window.addEventListener("yt-navigate-finish", () => {
  devLog("OBSERVER", "YouTube SPA nav — re-scanning");
  if (ytRetryInterval) { clearInterval(ytRetryInterval); ytRetryInterval = null; }
  sync();
});

sync();
