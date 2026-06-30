chrome.runtime.onInstalled.addListener(() => {});

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
