import { StatsService } from '../lib/services/statsService';

async function test() {
  const groupId = 'group-1767302687355';
  const jamesId = 'gp-1767302719038-ci3x14a6x';
  
  console.log('Testing actual StatsService.getPlayerDetailedStats...');
  
  const stats = await StatsService.getPlayerDetailedStats(groupId, jamesId);
  
  console.log('\n=== RESULT ===');
  console.log('Player:', stats?.playerName);
  console.log('Total Games:', stats?.totalGames);
  console.log('Wins:', stats?.wins);
  console.log('Losses:', stats?.losses);
  console.log('Sessions Played:', stats?.sessionsPlayed);
  console.log('Recent Form:', stats?.recentForm);
}

test().catch(console.error);
