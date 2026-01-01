# Product Overview

## Problem Statement

Casual badminton groups constantly forget:
- Who won how many games
- Who owes what money
- The breakdown of costs (court, birds, bets)
- Final settlement amounts
- Player performance over time

This leads to confusion, forgotten debts, and awkward money conversations at the end of sessions.

## Solution

A simple web app that:
1. Lets you organize recurring playing groups
2. Logs games during play (select teams, mark winner)
3. Tracks player performance across sessions with ELO ratings
4. Shows partner synergy and opponent matchups
5. Automatically calculates final money settlement
6. Generates shareable text for easy distribution
7. Works with or without betting

## Target Users

- Casual badminton groups (4-6 players typically for doubles, 2-6 for singles)
- Friends who play doubles or singles regularly
- Groups that want to track stats over time
- Groups that bet small amounts per game (optional)
- Groups that just want to track games without betting

## Key Features

### Core Features
- ✅ Create session with players and financial settings
- ✅ Support for both doubles and singles game modes
- ✅ Log games with team/player selection
- ✅ Real-time stats (wins/losses, gambling net)
- ✅ Round robin scheduling (optional)
- ✅ Multiple session management
- ✅ Automatic final settlement calculation
- ✅ Shareable summary text

### Groups Feature
- ✅ Create and manage recurring badminton groups
- ✅ Shareable links (no accounts required)
- ✅ Player pool management per group
- ✅ Track all sessions within a group
- ✅ Link players across sessions for stats tracking

### Leaderboard & Player Stats
- ✅ **ELO Rating System**: Players start at 1500, ratings update after each game
- ✅ **Leaderboard Tab**: Ranked view of all group players by ELO
- ✅ **Player Profiles**: Click any player to see detailed statistics
- ✅ **Partner Synergy**: Win rates with each partner (for doubles)
- ✅ **Opponent Matchups**: Win rates against each opponent
- ✅ **Recent Form**: Last 5 games shown as W/L indicators
- ✅ **Streak Tracking**: Current win/loss streak displayed
- ✅ **Trend Indicators**: Up/down arrows showing if player is improving

### Optional Betting
- ✅ Per-session betting toggle
- ✅ Universal stats always shown (win rate, points)
- ✅ Conditional betting UI (only shown when enabled)
- ✅ Stats-only mode for non-betting groups

## How ELO Works

The ELO system tracks player skill:

1. **Starting Rating**: All players begin at 1500
2. **After Each Game**: Winners gain points, losers lose points
3. **Point Calculation**: Based on expected outcome vs actual
   - Upset win (lower ELO beats higher) = more points gained
   - Expected win (higher ELO beats lower) = fewer points gained
4. **Doubles**: Team rating = average of both players' ELO

**Example:**
- Player A (1600 ELO) beats Player B (1400 ELO): Small gain/loss (~12 points)
- Player B (1400 ELO) beats Player A (1600 ELO): Large gain/loss (~20 points)

## Future Features (Post-MVP)

- ELO history and trend graphs
- Team suggestion AI (balance teams based on ELO)
- Flexible settlement (multiple prepayers)
- Multi-sport support
- User authentication (optional)
- AI helper layer (auto-summaries, matchup predictions)
- Advanced analytics and visualizations
- Push notifications for game invites

## Success Metrics

- **MVP Success**: Users can complete a full session without confusion
- **User Satisfaction**: Groups use it consistently for their sessions
- **Time Saved**: Reduces end-of-night calculation time from minutes to seconds
- **Group Engagement**: Groups use it to track performance over time
- **Competitive Fun**: Leaderboard motivates players to improve
