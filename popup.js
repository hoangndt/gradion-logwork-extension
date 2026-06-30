const JIRA_HOST = 'emma-sleep.atlassian.net';
const KEY_SHAPE = /^[A-Z][A-Z0-9]+-\d+$/;

function parseJiraKey(url) {
  if (typeof url !== 'string') return null;
  let u;
  try { u = new URL(url); } catch { return null; }
  if (u.host !== JIRA_HOST) return null;

  const sel = u.searchParams.get('selectedIssue');
  if (sel && KEY_SHAPE.test(sel)) return sel;

  const parts = u.pathname.split('/').filter(Boolean);
  const i = parts.indexOf('browse');
  if (i !== -1 && parts[i + 1] && KEY_SHAPE.test(parts[i + 1])) return parts[i + 1];

  return null;
}

document.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('date-input');
  const hoursInput = document.getElementById('hours-input');
  const taskInput = document.getElementById('task-input');

  if (dateInput) {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    dateInput.value = today;
  }

  if (hoursInput) {
    hoursInput.value = '8';
  }

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    const key = parseJiraKey(tab && tab.url);
    if (key && taskInput && !taskInput.value) taskInput.value = key;
  });
});
