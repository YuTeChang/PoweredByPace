# Screenshot Test Results

This folder contains screenshots from automated and manual testing of all VibeBadminton features.

## How to Generate Screenshots

### Automated Method (Recommended)

1. Make sure dev server is running:
   ```bash
   npm run dev
   ```

2. Run the screenshot script:
   ```bash
   npm run test:screenshots
   ```

   This will automatically:
   - Navigate through all pages
   - Fill out forms
   - Record games
   - Capture screenshots of each feature
   - Save screenshots to `docs/screenshots/test-results/`

### Manual Method

See [MANUAL_TEST_GUIDE.md](./MANUAL_TEST_GUIDE.md) for step-by-step instructions.

## Screenshots Generated

The script captures the following screenshots:

1. `01-home-page.png` - Home page
2. `02-create-session-empty.png` - Create session form (empty)
3. `02-create-session-filled.png` - Create session form (filled)
4. `02-create-session-round-robin.png` - Create session with round robin enabled
5. `03-session-stats-empty.png` - Session stats tab (no games)
6. `03-session-stats-with-games.png` - Session stats tab (with games)
7. `04-session-record-empty.png` - Record tab (empty form)
8. `04-session-record-teams-selected.png` - Record tab (teams selected)
9. `04-session-record-ready.png` - Record tab (ready to save)
10. `05-session-history.png` - History tab
11. `06-summary-page.png` - Summary page

## Features Tested

- ✅ Session creation with defaults (all financial fields default to 0)
- ✅ Round robin game generation with custom count
- ✅ Game recording with team selection
- ✅ Live stats updates
- ✅ Game history display
- ✅ Final summary calculation
- ✅ Shareable text generation

