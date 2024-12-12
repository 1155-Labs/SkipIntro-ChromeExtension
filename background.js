chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    // Initialize storage variables with isEnabled = true
    chrome.storage.local.set({
      isEnabled: true,
      firstOpen: true,
      timesSkipped: 0,
    }, () => {
      console.log("Storage initialized on first install");
    });
  }
});

// chrome.action.onClicked.addListener(() => {
//   chrome.storage.local.get("isEnabled", (data) => {
//     chrome.storage.local.set({ isEnabled: !data.isEnabled });
//   });
// });
