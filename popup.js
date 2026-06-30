const JIRA_HOST = 'emma-sleep.atlassian.net';
const KEY_SHAPE = /^[A-Z][A-Z0-9]+-\d+$/;

const API_ENTRIES = 'https://ts-prod.gradion.com/api/entries';
const CLASSIFICATION_ID = '3832f75f-64c0-4fd7-8cc5-24593382c5af';
const MORNING = { start: '09:00', end: '12:00' };

function splitDuration(totalHours) {
  if (totalHours <= 0) throw new Error('totalHours must be > 0');
  if (totalHours <= 3) {
    const endMinutes = 9 * 60 + totalHours * 60;
    const h = Math.floor(endMinutes / 60);
    const m = Math.round(endMinutes % 60);
    return [{ start: '09:00', end: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` }];
  }
  const afternoonMinutes = 13 * 60 + 30 + (totalHours - 3) * 60;
  const h = Math.floor(afternoonMinutes / 60);
  const m = Math.round(afternoonMinutes % 60);
  const afternoonEnd = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  return [
    { start: '09:00', end: '12:00' },
    { start: '13:30', end: afternoonEnd },
  ];
}

function buildEntry(date, block, desc, task) {
  return {
    date,
    startTime: block.start,
    endTime: block.end,
    classificationId: CLASSIFICATION_ID,
    description: desc,
    task,
  };
}

async function postEntry(payload, token) {
  return fetch(API_ENTRIES, {
    method: 'POST',
    headers: {
      'Authorization': token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

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

function currentMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return {
    dateFrom: `${year}-${month}-01`,
    dateTo: `${year}-${month}-${day}`,
  };
}

function getDuration(entry) {
  if (entry.durationMinutes != null) {
    const h = Math.round((entry.durationMinutes / 60) * 10) / 10;
    return `${h}h`;
  }
  if (entry.startTime && entry.endTime) {
    const [sh, sm] = entry.startTime.split(':').map(Number);
    const [eh, em] = entry.endTime.split(':').map(Number);
    const mins = (eh * 60 + em) - (sh * 60 + sm);
    const h = Math.round((mins / 60) * 10) / 10;
    return `${h}h`;
  }
  return '—';
}

async function fetchEntries(token) {
  const { dateFrom, dateTo } = currentMonthRange();
  const params = new URLSearchParams({ limit: 20, offset: 0, dateFrom, dateTo });
  const url = `${API_ENTRIES}?${params}`;
  try {
    let res;
    try {
      res = await fetch(url, { headers: { Authorization: token } });
    } catch {
      const msg = await chrome.runtime.sendMessage({ type: 'GET_ENTRIES', url, token });
      if (!msg || msg.error) return [];
      return msg.entries || [];
    }
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data.entries || []);
  } catch {
    return [];
  }
}

function renderEntries(entries) {
  const list = document.getElementById('entries-list');
  if (!list) return;
  list.textContent = '';

  if (!entries.length) {
    const li = document.createElement('li');
    li.className = 'entry-empty';
    li.textContent = 'No entries this month';
    list.appendChild(li);
    return;
  }

  for (const entry of entries) {
    const li = document.createElement('li');
    li.className = 'entry-row';

    const date = entry.date || '';
    const start = entry.startTime || '';
    const end = entry.endTime || '';
    const timeRange = start && end ? `${start}–${end}` : (start || end || '');
    const duration = getDuration(entry);
    const task = entry.task || '';
    const description = entry.description || '';
    const status = entry.status || '';

    const parts = [date, timeRange, duration, task, description, status].filter(Boolean);
    li.textContent = parts.join(' · ');
    list.appendChild(li);
  }
}

async function refreshEntries() {
  const { token } = await chrome.storage.local.get('token');
  if (!token) return;
  const entries = await fetchEntries(token);
  renderEntries(entries);
}

document.addEventListener('DOMContentLoaded', async () => {
  const { token } = await chrome.storage.local.get('token');
  if (!token) {
    chrome.tabs.create({ url: 'https://workspace.gradion.com/app/timesheet' });
    return;
  }

  refreshEntries();

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

  const descriptionInput = document.getElementById('description-input');

  const submitBtn = document.getElementById('submit-btn');
  const messageArea = document.getElementById('message-area');

  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      const date = dateInput ? dateInput.value : '';
      const hours = hoursInput ? parseFloat(hoursInput.value) : NaN;
      const task = taskInput ? taskInput.value : '';
      const description = descriptionInput ? descriptionInput.value : '';

      const { token } = await chrome.storage.local.get('token');
      if (!token) {
        messageArea.textContent = 'No auth token found. Please visit Gradion to capture your session.';
        return;
      }

      if (isNaN(hours) || hours <= 0) {
        messageArea.textContent = 'Please enter a valid number of hours greater than 0.';
        return;
      }

      messageArea.textContent = '';
      const blocks = splitDuration(hours);

      for (const block of blocks) {
        const res = await postEntry(buildEntry(date, block, description, task), token);
        if (!res.ok) {
          let msg = 'Submit failed. Please try again.';
          try {
            const data = await res.json();
            if (data && data.error) msg = data.error;
          } catch {}
          messageArea.textContent = msg;
          return;
        }
      }

      messageArea.textContent = 'Logwork submitted successfully.';
      refreshEntries();
    });
  }

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    const key = parseJiraKey(tab && tab.url);
    if (key && taskInput && !taskInput.value) taskInput.value = key;

    if (!tab || tab.id === undefined) return;
    let u;
    try { u = new URL(tab.url); } catch { return; }
    if (u.host !== JIRA_HOST) return;

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractTitle,
    }).then((results) => {
      if (
        results &&
        results.length > 0 &&
        typeof results[0].result === 'string' &&
        results[0].result.trim() !== '' &&
        descriptionInput &&
        !descriptionInput.value
      ) {
        descriptionInput.value = results[0].result.trim();
      }
    }).catch(() => {});
  });
});

function extractTitle() {
  const node =
    document.querySelector('h1[data-testid="issue.views.issue-base.foundation.summary.heading"]') ||
    document.querySelector('h1[data-testid*="summary.heading"]');
  const fromDom = node && node.textContent ? node.textContent.trim() : '';
  if (fromDom) return fromDom;

  let t = document.title || '';
  t = t.replace(/^\s*\[[A-Z][A-Z0-9]+-\d+\]\s*/, '');
  t = t.replace(/\s*-\s*Jira.*$/i, '');
  return t.trim();
}
