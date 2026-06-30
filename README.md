# Gradion Logwork Extension

A Chrome extension that logs work to [Gradion Timesheet](https://workspace.gradion.com/app/timesheet) without leaving Jira.

**Features:**

- Auto-captures your Bearer token from Gradion Timesheet
- Auto-fills Task ID from the active Jira tab URL
- Auto-fills Description from the Jira ticket title
- Configurable Start time and derived End time with fixed 12:00–13:00 lunch break
- Submits timesheet entries as one or two time blocks (splits around lunch automatically)
- Shows current-month entries list in the popup
- Sends a daily push notification at **11:00 AM (Mon–Fri)** to remind you to log work

---

## Requirements

- Google Chrome (or any Chromium-based browser that supports MV3 extensions)
- Git

No build step — the extension is plain HTML/CSS/JS loaded directly.

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/hoangndt/gradion-logwork-extension
cd gradion-logwork-extension
```

### 2. Load as an unpacked extension in Chrome

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `gradion-logwork-extension` folder (the root of this repo)

The extension icon will appear in your Chrome toolbar. Pin it for easy access.

### 3. Capture your auth token

The extension needs your Gradion Bearer token to submit entries:

1. **Click the extension icon** — if no token is stored yet, it automatically opens [Gradion Timesheet](https://workspace.gradion.com/app/timesheet) in a new tab
2. **Log in and browse any timesheet page** — the extension intercepts the `Authorization` header from network requests and stores the token automatically
3. **Click the extension icon again** — the popup now opens normally

> The token is captured once and persisted. You only need to repeat this if you log out of Gradion or clear extension storage.

---

## Usage

1. **Navigate to a Jira ticket** in Chrome (e.g. `emma-sleep.atlassian.net/browse/PROJ-123`)
2. **Click the extension icon** — the popup opens with:
   - **Date** — defaults to today
   - **Total Hours** — defaults to `8`
   - **Start** — defaults to `09:00` (editable)
   - **End** — auto-calculated, read-only (updates as you change Start or Total Hours)
   - **Task** — auto-filled from the Jira URL (e.g. `PROJ-123`)
   - **Description** — auto-filled from the Jira ticket title
3. **Adjust fields** as needed
4. **Click Submit** — the extension posts one or two time-block entries to Gradion:
   - Single block if your window does not span 12:00–13:00
   - Two blocks (`Start–12:00` and `13:00–End`) if it spans lunch
5. A success message appears and the entries list refreshes

### Time calculation example

| Start | Total Hours | End   | Blocks submitted         |
| ----- | ----------- | ----- | ------------------------ |
| 09:00 | 8           | 18:00 | 09:00–12:00, 13:00–18:00 |
| 09:00 | 6           | 16:00 | 09:00–12:00, 13:00–16:00 |
| 09:00 | 2           | 11:00 | 09:00–11:00              |
| 14:00 | 4           | 18:00 | 14:00–18:00              |

Lunch break is fixed at **12:00–13:00** and is always excluded from Total Hours.

---

## Daily reminder

The extension sends a Chrome push notification at **11:00 AM every weekday** reminding you to log your work. No configuration needed — the alarm is registered automatically when the extension is installed or Chrome starts.

---

## Updating the extension

After pulling new changes:

1. Go to `chrome://extensions`
2. Find **Gradion Logwork** and click the refresh icon (or **Update** if available)

---

## Project structure

```
gradion-logwork-extension/
├── manifest.json       # MV3 manifest — permissions, background, popup
├── background.js       # Service worker — token capture, daily alarm, notifications
├── popup.html          # Popup markup
├── popup.js            # Popup logic — form, time calc, submission
├── popup.css           # Popup styles
└── icons/              # Extension icons (16, 48, 128px)
```
