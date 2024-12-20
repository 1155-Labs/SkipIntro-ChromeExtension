console.log("Skip Intro content script loaded!");

// List of "Skip" keywords in multiple languages
const skipKeywords = [
  "Skip", // English
  "Sauter", // French
  "Überspringen", // German
  "Saltar", // Spanish/Portuguese
  "Pomiń", // Polish
  "Preskočiť", // Slovak
  "Пропустить", // Russian
  "跳过", // Chinese
  "건너뛰기", // Korean
  "スキップ", // Japanese
  "Doorgaan", // Dutch
  "Overslaan", // Dutch (alternate)
  "Přeskočit", // Czech
  "Hopp over", // Norwegian
  "Hoppa över", // Swedish
  "Ignora", // Italian
  "Przejdź", // Polish (alternate)
  "Pular" // Portuguese (alternate)
];

// Add these utility functions at the top
function incrementSkipCount() {
  // update count
  chrome.storage.local.get(['timesSkipped'], function(result) {
    const currentCount = result.timesSkipped || 0;
    chrome.storage.local.set({ 'timesSkipped': currentCount + 1 }, function() {
      console.log('Skip count updated to:', currentCount + 1);
    });
  });
}

function addShowToHistory(showInfo) {
  chrome.storage.local.get(['skipIntroHistory'], function(result) {
    const history = result.skipIntroHistory || [];
    const domain = window.location.hostname;
    
    const entry = {
      show: showInfo,
      domain: domain,
      timestamp: new Date().toISOString()
    };
    
    // Add entry if it doesn't exist
    if (!history.some(h => h.show === showInfo && h.domain === domain)) {
      history.push(entry);
      chrome.storage.local.set({ 'skipIntroHistory': history }, function() {
        console.log('Show history updated:', entry);
      });
    }
  });
}

// Function to check and click "Skip" buttons
function clickSkipButtons() {
  if (!document.body) return;
  
  const buttons = document.querySelectorAll("button");
  buttons.forEach((button) => {
    const buttonText = button.innerText.trim();
    if (skipKeywords.some((keyword) => buttonText.includes(keyword))) {
      button.click();
      incrementSkipCount();



      console.log(`Clicked: ${buttonText}`);

      const titleElement = document.querySelector('div[data-uia="video-title"]');
      
      if (titleElement) {
        const showName = titleElement.querySelector('h4')?.textContent || '';
        const episodeNumber = titleElement.querySelector('span:first-of-type')?.textContent || '';
        const episodeTitle = titleElement.querySelector('span:last-of-type')?.textContent || '';

        const videoInfo = {
          show: showName,
          episode: episodeNumber,
          title: episodeTitle,
          fullTitle: `${showName} - ${episodeNumber} - ${episodeTitle}`.trim()
        };

        addShowToHistory(videoInfo);

        console.log('Captured show details:', videoInfo);

      } else {
        // Fallback to existing method if new structure isn't found
        const showTitle = document.querySelector('h1')?.textContent || 
                          document.querySelector('.video-title')?.textContent ||
                          document.title.split('-')[0].trim();
        
        if (showTitle && showTitle !== 'Netflix') {
          addShowToHistory(showTitle);
          console.log('Captured show title:', showTitle);
        }
      }
      
    }
  });
}

// Function to initialize the observer with retry mechanism
function initializeObserver(retryCount = 0) {
  const maxRetries = 10;
  const retryInterval = 100; // 100ms between retries

  if (!document.body && retryCount < maxRetries) {
    console.log(`Attempt ${retryCount + 1}: Body not ready, retrying in ${retryInterval}ms...`);
    setTimeout(() => initializeObserver(retryCount + 1), retryInterval);
    return;
  }

  // Start observing the body for DOM changes
  const observer = new MutationObserver(() => {
    clickSkipButtons();
  });

  try {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true, // Added to catch more changes
      characterData: true // Added to catch text changes
    });

    // Initial check for buttons
    clickSkipButtons();
    console.log("MutationObserver started successfully");
  } catch (error) {
    console.error("Error starting observer:", error);
    if (retryCount < maxRetries) {
      setTimeout(() => initializeObserver(retryCount + 1), retryInterval);
    }
  }
}

// Modified initialization
(function() {
  console.log("Skip Intro initialization starting...");
  
  // Force immediate execution
  try {
    console.log("Attempting immediate initialization");
    initializeObserver();
  } catch (e) {
    console.error("Immediate initialization failed:", e);
  }

  // More robust event listeners with logging
  const initEvents = ['load', 'DOMContentLoaded'];
  initEvents.forEach(event => {
    window.addEventListener(event, () => {
      console.log(`Initializing on ${event} event`);
      initializeObserver();
    }, { once: true }); // Ensure each event only fires once
  });
  
  // Document ready state handling
  const handleReadyState = () => {
    console.log(`Document readyState: ${document.readyState}`);
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
      initializeObserver();
    }
  };

  // Check ready state immediately
  handleReadyState();
  
  // Listen for ready state changes
  document.addEventListener('readystatechange', handleReadyState);

  console.log("Skip Intro initialization handlers set up complete");
})();

// function getVideoDetails() {
//     const targetNode = document.querySelector('div[data-uia="video-title"]');
    
//     const observer = new MutationObserver((mutations) => {
//         const titleElement = document.querySelector('div[data-uia="video-title"]');
//         if (titleElement) {
//             const showName = titleElement.querySelector('h4')?.textContent || '';
//             const episodeNumber = titleElement.querySelector('span:first-of-type')?.textContent || '';
//             const episodeTitle = titleElement.querySelector('span:last-of-type')?.textContent || '';

//             const videoInfo = {
//                 show: showName,         // "The Office (U.S.)"
//                 episode: episodeNumber, // "E1"
//                 title: episodeTitle     // "The Dundies"
//             };

//             console.log(videoInfo);
//             // Do something with the videoInfo here
            
//             // If you only need to capture once, disconnect
//             observer.disconnect();
//         }
//     });

//     // Start observing with these options
//     observer.observe(document.body, {
//         childList: true,
//         subtree: true,
//         attributes: true
//     });
// }

// // Call the function to start observing
// getVideoDetails();