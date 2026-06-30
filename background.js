const ALARM_NAME = 'logwork-reminder';
const REMINDER_HOUR = 11;
const REMINDER_MINUTE = 0;

function scheduleReminder() {
  const now = new Date();
  const next = new Date(now);
  next.setSeconds(0, 0);
  next.setHours(REMINDER_HOUR, REMINDER_MINUTE);
  if (next <= now) next.setDate(next.getDate() + 1);
  chrome.alarms.create(ALARM_NAME, {
    when: next.getTime(),
    periodInMinutes: 24 * 60,
  });
}

chrome.runtime.onInstalled.addListener(scheduleReminder);
chrome.runtime.onStartup.addListener(scheduleReminder);

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== ALARM_NAME) return;
  const day = new Date().getDay(); // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return;
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'Log your work',
    message: "Don't forget to log your work for today in Gradion Timesheet.",
    priority: 1,
  });
});

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
