document.addEventListener("DOMContentLoaded", () => {
  const statusText = document.getElementById("toggle-status");
  const toggleButton = document.getElementById("toggle-button");
  const toggleButtonWrapper = document.getElementById("toggle-button-wrapper");
  const remoteWrapper = document.getElementById("remote-wrapper");
  const miscValue = document.getElementById("misc-value");
  const miscValueText = document.getElementById("misc-value-text");

function firstLoad(){
  console.log("first user");

  // actives users
  
  // remoteWrapper.style.background = "linear-gradient(180deg, #C8D9AF 0%, #F1E6BA 100%)";
  // toggleButtonWrapper.style.justifyContent = "flex-start";
} 

function regularLoad(){
  console.log("recurring user");
  
  chrome.storage.local.get(["timesSkipped"], (data) => {
    console.log(data);
    miscValue.textContent = "+"+ data.timesSkipped;

    miscValueText.textContent = "times skipped for you";
  });
} 

  // Check if elements exist
  if (!statusText || !toggleButton || !toggleButtonWrapper) {
    console.error("Required elements not found in popup.html");
    return;
  }

  // Load both isEnabled and firstOpen states with isEnabled defaulting to true
  chrome.storage.local.get(["isEnabled", "firstOpen"], (data) => {
    const isEnabled = !!data.isEnabled;
    
    if (data.firstOpen) {
      firstLoad();
      chrome.storage.local.set({ firstOpen: false });
    } else {
      regularLoad();
    }


    toggleButtonWrapper.style.justifyContent = isEnabled ? "flex-end" : "flex-start";
  });

  
  
  // Add event listener to toggle-button-wrapper
  toggleButtonWrapper.addEventListener("click", toggleSwitch);
  // Define the toggleSwitch function
  function toggleSwitch() {
    console.log("Toggle switch function called");
    console.log(toggleButtonWrapper.style.justifyContent);
    
    // Toggle state on button click
      chrome.storage.local.get(["isEnabled"], (data) => {
        const newState = !data.isEnabled;
        chrome.storage.local.set({ isEnabled: newState }, () => {
          // statusText.textContent = newState ? "Enabled" : "Disabled";
          // toggleButton.textContent = newState ? "Disable" : "Enable";
          toggleButtonWrapper.style.justifyContent = newState ? "flex-end" : "flex-start";
          remoteWrapper.style.background = newState ? "linear-gradient(180deg, #E695AB 0%, #E7B199 100%)" : "linear-gradient(180deg, #96AFE6 0%, #9B96E6 100%)";
          
        });

      });

    
  }
});

