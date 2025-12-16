# Manual Screenshot Testing Guide

This guide helps you manually test all features and capture screenshots.

## Prerequisites

1. Dev server running: `npm run dev`
2. Browser open at http://localhost:3000
3. Browser DevTools or screenshot extension

## Testing Flow

### Step 1: Home Page
1. Navigate to http://localhost:3000
2. Take screenshot: `01-home-page.png`
3. Should show: Welcome message, app description, "Create New Session" button

### Step 2: Create Session (Empty Form)
1. Click "Create New Session" button
2. Take screenshot: `02-create-session-empty.png`
3. Should show: Empty form with all fields

### Step 3: Create Session (Filled Form)
1. Fill in the form:
   - Session Name: "Friday Night Session"
   - Date: Today's date
   - Players: Alice, Bob, Charlie, Diana
   - Organizer: Select "Alice"
   - Court Cost: 14.40 (per person)
   - Bird Cost: 3.00
   - Bet Per Player: 2.00
2. Take screenshot: `02-create-session-filled.png`
3. Should show: Form with all fields filled

### Step 4: Create Session (Round Robin Enabled)
1. Check the "Generate Round Robin Schedule" checkbox
2. Enter "5" in the "Number of Games" field
3. Take screenshot: `02-create-session-round-robin.png`
4. Should show: Round robin checkbox checked, game count input visible

### Step 5: Create the Session
1. Click "Start Session" button
2. Should navigate to session page (Stats tab)

### Step 6: Session Stats Tab (Empty)
1. Wait for page to load
2. Take screenshot: `03-session-stats-empty.png`
3. Should show: Session header, empty stats cards, no games yet

### Step 7: Record Tab (Empty)
1. Click "Record" tab at bottom
2. Take screenshot: `04-session-record-empty.png`
3. Should show: Empty game entry form

### Step 8: Record a Game
1. Select Team A: Click "Alice" for Position 1, then "Bob" for Position 2
2. Scroll down
3. Select Team B: Click "Charlie" for Position 1, then "Diana" for Position 2
4. Take screenshot: `04-session-record-teams-selected.png`
5. Click "Team A" to mark them as winner
6. Take screenshot: `04-session-record-ready.png`
7. Click "Save Game" button
8. Should return to Stats tab automatically

### Step 9: Session Stats Tab (With Games)
1. Should be on Stats tab after saving game
2. Take screenshot: `03-session-stats-with-games.png`
3. Should show: Stats cards with wins/losses, gambling net, recent games list

### Step 10: Record More Games (Optional)
1. Click Record tab or FAB button
2. Record 1-2 more games with different winners
3. This will make the stats and history more interesting

### Step 11: History Tab
1. Click "History" tab at bottom
2. Take screenshot: `05-session-history.png`
3. Should show: List of all recorded games, "Undo Last Game" button

### Step 12: Summary Page
1. Click "View Summary" button in session header
2. Wait for page to load
3. Take screenshot: `06-summary-page.png`
4. Should show: Final summary table, shareable text, action buttons

## Screenshot Tips

1. Use browser DevTools (F12) → Command Palette (Cmd+Shift+P / Ctrl+Shift+P) → "Capture full size screenshot"
2. Or use browser extensions like "Full Page Screen Capture"
3. Save screenshots to `docs/screenshots/test-results/` folder
4. Use PNG format for best quality
5. Scroll to top before taking full-page screenshots
6. Wait for animations to complete

## Features to Verify

While testing, verify these features work:

- [ ] Can create session with 4-6 players
- [ ] Can select organizer
- [ ] Can set court cost (per person or total)
- [ ] Can set bird cost
- [ ] Can set bet per player
- [ ] Default values work (leave fields empty, should use 0)
- [ ] Round robin checkbox enables game count input
- [ ] Can specify number of round robin games
- [ ] Can record games with team selection
- [ ] Can mark winning team
- [ ] Stats update in real-time
- [ ] Game history shows all games
- [ ] Can undo last game
- [ ] Summary page calculates correctly
- [ ] Shareable text can be copied
- [ ] Bottom tab navigation works
- [ ] FAB button works
- [ ] Round robin games can be marked as played

