// Background Script for Intelligent Cache
// Monitors web requests to determine if they were served from cache.

const cacheStatus = {}; // TabId -> URL -> { fromCache: boolean }

// Chrome WebRequest API (MV3)
chrome.webRequest.onResponseStarted.addListener(
  (details) => {
    if (details.tabId === -1) return;

    // In MV3, we can check details.fromCache
    // Note: This requires the "webRequest" permission.
    const status = details.fromCache ? 'local' : 'live';
    
    if (!cacheStatus[details.tabId]) {
      cacheStatus[details.tabId] = {};
    }
    
    cacheStatus[details.tabId][details.url] = status;

    // Send update to content script if tab is active
    chrome.tabs.sendMessage(details.tabId, {
      type: 'CACHE_UPDATE',
      url: details.url,
      status: status
    }).catch(err => {
        // Content script might not be ready yet, ignore
    });
  },
  { urls: ["<all_urls>"] }
);

// Listener for content script requests (when it first loads)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_TAB_CACHE_STATUS' && sender.tab) {
    sendResponse(cacheStatus[sender.tab.id] || {});
  }
});

// Periodic cleanup of old tab data
chrome.tabs.onRemoved.addListener((tabId) => {
  delete cacheStatus[tabId];
});
