console.log("Background script loaded");

// Set default settings when the extension is first installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    globalToggle: true,
    settings: {
      allMessages: true,
      lastPreview: false,
      mediaPreview: true,
      mediaGallery: true,
      textInput: true,
      profilePictures: false,
      groupNames: false,
      noTransition: false,
      unblurOnHover: false,
      blurOnIdle: false
    },
     blurValues: {
      'blur amount': 8,
      'idle timeout': 10
    }
  });
});



// Handle long-lived connection from content script
chrome.runtime.onConnect.addListener((port) => {
  console.assert(port.name === 'whatsapp-privacy');

  port.onMessage.addListener((msg) => {
    if (msg.type === 'init') {
      // Send current settings when content script connects
      chrome.storage.sync.get(['globalToggle', 'settings'], (data) => {
        port.postMessage({
          type: 'INIT_SETTINGS',
          ...data
        });
      });
    }
  });
});

// Handle one-time messages (from popup or elsewhere)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'UPDATE_SETTINGS') {
    chrome.storage.sync.set({ settings: request.settings }, () => {
      notifyAllTabs(); // Notify all open WhatsApp tabs
      sendResponse({ success: true });
    });
    return true; // Required for async sendResponse
  }

  if (request.type === 'TOGGLE_GLOBAL') {
    chrome.storage.sync.set({ globalToggle: request.value }, () => {
      notifyAllTabs(); // Notify all open WhatsApp tabs
      sendResponse({ success: true });
    });
    return true;
  }
  if (request.type === 'UPDATE_BLUR_VALUES') {
  chrome.storage.sync.set({ blurValues: request.blurValues }, () => {
    notifyAllTabs(); // Reapply blurs with new values
    sendResponse({ success: true });
  });
  return true;
}
});

//  Notify all open WhatsApp tabs of setting changes
function notifyAllTabs() {
  chrome.tabs.query({ url: "*://web.whatsapp.com/*" }, (tabs) => {
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, { type: 'EXTENSION_UPDATED' });
    });
  });
}
