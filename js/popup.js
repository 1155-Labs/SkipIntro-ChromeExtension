document.addEventListener("DOMContentLoaded", () => {
  const toggleButtonWrapper = document.getElementById("toggle-button-wrapper");
  const remoteWrapper = document.getElementById("remote-wrapper");
  const miscValue = document.getElementById("misc-value");
  const miscValueText = document.getElementById("misc-value-text");
  const mainLogo = document.getElementById("main-logo");

  // Dev tools elements
  const devToolsPanel = document.getElementById("dev-tools");
  const devModeFooter = document.getElementById("dev-mode-footer");
  const devModeIndicator = document.getElementById("dev-mode-indicator");
  const devModeLabel = document.getElementById("dev-mode-label");
  const observerStatusText = document.getElementById("observer-status-text");
  const forceSkipStatus = document.getElementById("force-skip-status");
  const btnForceSkip = document.getElementById("btn-force-skip");
  const btnOpenLogs = document.getElementById("btn-open-logs");

  // ── Skip count display ─────────────────────────────────────────────────────
  function firstLoad() {
    miscValue.innerHTML = "2,32,632+";
    miscValueText.textContent = "currently active users";
  }

  function regularLoad() {
    chrome.storage.local.get(["timesSkipped"], (data) => {
      miscValue.innerHTML = (data.timesSkipped || 0) + "+";
      miscValueText.textContent = "times skipped for you";
    });
  }

  // ── Toggle switch ──────────────────────────────────────────────────────────
  if (!toggleButtonWrapper) {
    console.error("Required elements not found in popup.html");
    return;
  }

  function applyToggleState(isEnabled) {
    toggleButtonWrapper.style.justifyContent = isEnabled ? "flex-end" : "flex-start";
  }

  chrome.storage.local.get(["isEnabled", "firstOpen", "devMode"], (data) => {
    const isEnabled = data.isEnabled !== false;

    if (data.firstOpen) {
      firstLoad();
      chrome.storage.local.set({ firstOpen: false });
    } else {
      regularLoad();
    }

    applyToggleState(isEnabled);
    applyDevMode(data.devMode !== false);
  });

  toggleButtonWrapper.addEventListener("click", () => {
    chrome.storage.local.get(["isEnabled"], (data) => {
      const newState = !data.isEnabled;
      chrome.storage.local.set({ isEnabled: newState }, () => {
        if (newState) {
          toggleButtonWrapper.style.justifyContent = "flex-end";
          remoteWrapper.style.background = "linear-gradient(180deg, #E695AB 0%, #E7B199 100%)";
          toggleButtonWrapper.style.backgroundImage = "url('../assets/remote/darkmode/switch_on_bg.png')";
        } else {
          toggleButtonWrapper.style.justifyContent = "flex-start";
          remoteWrapper.style.background = "linear-gradient(180deg, #96AFE6 0%, #9B96E6 100%)";
          toggleButtonWrapper.style.backgroundImage = "url('../assets/remote/darkmode/switch_off_bg.png')";
        }
      });
    });
  });

  // ── Dev Mode ───────────────────────────────────────────────────────────────
  function applyDevMode(enabled) {
    devModeIndicator.classList.toggle("on", enabled);
    devModeLabel.textContent = enabled ? "DEV MODE ON" : "DEV MODE OFF";
    devToolsPanel.classList.toggle("visible", enabled);

    if (enabled) {
      observerStatusText.textContent = "Observer running";
    }
  }

  devModeFooter.addEventListener("click", () => {
    chrome.storage.local.get(["devMode"], (data) => {
      const newVal = !(data.devMode !== false);
      chrome.storage.local.set({ devMode: newVal }, () => applyDevMode(newVal));
    });
  });

  // ── Force Skip ─────────────────────────────────────────────────────────────
  btnForceSkip.addEventListener("click", () => {
    forceSkipStatus.textContent = "⏳ Looking for skip button…";
    btnForceSkip.disabled = true;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || !tabs[0]) {
        forceSkipStatus.textContent = "❌ No active tab found";
        btnForceSkip.disabled = false;
        return;
      }

      chrome.tabs.sendMessage(tabs[0].id, { type: "FORCE_SKIP" }, (response) => {
        btnForceSkip.disabled = false;

        if (chrome.runtime.lastError) {
          forceSkipStatus.textContent = "❌ Content script not running on this page";
          return;
        }

        if (response?.clicked) {
          forceSkipStatus.textContent = "✅ Clicked! Check logs for details.";
        } else {
          forceSkipStatus.textContent = "⚠️ No skip button found — check logs";
        }

        setTimeout(() => { forceSkipStatus.textContent = ""; }, 4000);
      });
    });
  });

  // ── Open Logs page ─────────────────────────────────────────────────────────
  btnOpenLogs.addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("logs.html") });
  });
});
