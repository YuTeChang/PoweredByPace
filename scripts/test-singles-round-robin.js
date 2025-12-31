#!/usr/bin/env node
/**
 * Test singles round robin generation
 */

const { generateRoundRobinGames } = require('../lib/roundRobin.ts');

// Test with 3 players requesting 5 games
const players = [
  { id: 'player-1', name: 'Player 1' },
  { id: 'player-2', name: 'Player 2' },
  { id: 'player-3', name: 'Player 3' },
];

console.log('Testing singles round robin with 3 players, requesting 5 games:');
const games = generateRoundRobinGames(players, 5, 'singles');
console.log(`Generated ${games.length} games:`);
games.forEach((game, index) => {
  console.log(`  Game ${index + 1}: ${game.teamA[0]} vs ${game.teamB[0]}`);
});

console.log('\nExpected: 5 games (3 unique + 2 repeats)');
console.log(`Actual: ${games.length} games`);
console.log(games.length === 5 ? '✓ PASS' : '✗ FAIL');

