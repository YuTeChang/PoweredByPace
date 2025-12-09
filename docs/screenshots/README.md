# VibeBadminton Screenshots

This directory contains screenshots of all pages in the VibeBadminton application, showcasing the Japandi/Scandi minimal design system.

## Screenshots

### 01-home-page.png
The home page showing:
- Welcome message and app description
- Active session card (if a session exists)
- "Create New Session" button

### 02-create-session-page.png
The session creation form showing:
- Session name input
- Date picker
- Player name inputs (4-6 players)
- Organizer selection
- Court cost configuration (per person or total)
- Bird/shuttle cost input
- Bet per player per game input
- "Start Session" button

### 03-session-page-stats.png
The live session page (Stats tab) showing:
- Session header with name, date, and player count
- Live stats cards for each player (W/L record and gambling net)
- Recent games list
- Bottom tab navigation (Stats, Record, History)
- Floating action button for quick game recording

### Additional Screenshots Needed

The following screenshots require an active session to be created:

- **04-session-page-record.png** - Record tab showing the game entry form
- **05-session-page-history.png** - History tab showing all logged games
- **06-summary-page.png** - Final summary page with settlement table and shareable text

## Design System

All pages follow the Japandi/Scandi minimal design system:
- Warm off-white background (#F7F2EA)
- Camel/wood accent color (#D3A676) for primary actions
- Rounded cards with soft shadows
- Generous whitespace and clean typography
- Mobile-first responsive design

## How to Capture Additional Screenshots

1. Start the development server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Create a session with sample data
4. Navigate through all tabs and pages
5. Take full-page screenshots using browser dev tools or a screenshot tool
6. Save screenshots in this directory with descriptive names

