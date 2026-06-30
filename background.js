chrome.runtime.onInstalled.addListener(() => {});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_ENTRIES') {
    fetch(message.url, { headers: { Authorization: message.token } })
      .then(res => {
        if (!res.ok) { sendResponse({ entries: [] }); return; }
        return res.json().then(data => {
          const entries = Array.isArray(data) ? data : (data.entries || []);
          sendResponse({ entries });
        });
      })
      .catch(() => sendResponse({ entries: [] }));
    return true;
  }
});

chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    const headers = details.requestHeaders || [];
    const auth = headers.find((h) => h.name.toLowerCase() === "authorization");
    if (auth && auth.value && auth.value.startsWith("Bearer ") && auth.value.trim() !== "Bearer") {
      chrome.storage.local.set({ token: auth.value, capturedAt: Date.now() });
    }
  },
  { urls: ["https://ts-prod.gradion.com/*"] },
  ["requestHeaders", "extraHeaders"]
);
