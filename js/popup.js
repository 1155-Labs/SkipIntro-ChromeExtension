document.addEventListener("DOMContentLoaded", () => {
  const toggleButtonWrapper = document.getElementById("toggle-button-wrapper");
  const remoteWrapper = document.getElementById("remote-wrapper");
  const miscValue = document.getElementById("misc-value");
  const miscValueText = document.getElementById("misc-value-text");
  const mainLogo = document.getElementById("main-logo");
  

  
  
  
  
  
  // const videosOdometer = document.querySelector(".videos-odometer");
  // createOdometer(videosOdometer, 790);
  
  // const projectsOdometer = document.querySelector(".projects-odometer");
  // createOdometer(projectsOdometer, 89);

  
function firstLoad(){
  console.log("first user");
  miscValue.innerHTML = '2,32,632' + "+";

    miscValueText.textContent = "currently active users";

  // actives users
  
  // remoteWrapper.style.background = "linear-gradient(180deg, #C8D9AF 0%, #F1E6BA 100%)";
  // toggleButtonWrapper.style.justifyContent = "flex-start";
}
// } 
// const createOdometer = (el, value) => {
//   const odometer = new Odometer({
//     el: el,
//     value: 0,
//   });

//   let hasRun = false;

//   const options = {
//     threshold: [0, 0.9],
//   };

//   const callback = (entries, observer) => {
//     entries.forEach((entry) => {
//       if (entry.isIntersecting) {
//         if (!hasRun) {
//           odometer.update(value);
//           hasRun = true;
//         }
//       }
//     });
//   };

//   const observer = new IntersectionObserver(callback, options);
//   observer.observe(el);
// };

function regularLoad(){
  console.log("recurring user");

  
  
  chrome.storage.local.get(["timesSkipped"], (data) => {
    console.log(data);
    // createOdometer(miscValue, data.timesSkipped);
    // miscValue.textContent = "+"+ data.timesSkipped;
    miscValue.innerHTML = data.timesSkipped + "+";

    miscValueText.textContent = "times skipped for you";
  });
} 

  // Check if elements exist
  if (!toggleButtonWrapper) {
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
          if(newState) { //on
            toggleButtonWrapper.style.justifyContent = "flex-end";
            remoteWrapper.style.background = "linear-gradient(180deg, #E695AB 0%, #E7B199 100%)";
            mainLogo.style.background = "./assets/remote/darkmode/logo_dark_mode_on.png";
            toggleButtonWrapper.style.backgroundImage = "url('../assets/remote/darkmode/switch_on_bg.png')";
          } else { // off
            toggleButtonWrapper.style.justifyContent = "flex-start";
            remoteWrapper.style.background = "linear-gradient(180deg, #96AFE6 0%, #9B96E6 100%)";
            mainLogo.style.background = "../assets/remote/darkmode/logo_dark_mode.png";
            toggleButtonWrapper.style.backgroundImage = "url('../assets/remote/darkmode/switch_off_bg.png')";
          }
          
        });

      });

    
   }
});

