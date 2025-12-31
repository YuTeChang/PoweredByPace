#!/usr/bin/env node

/**
 * Simple database initialization script
 * Uses Vercel Postgres directly
 */

import { sql } from '@vercel/postgres';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
const envPath = join(__dirname, '..', '.env.local');
try {
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    }
  });
} catch (error) {
  console.error('⚠️  Could not load .env.local:', error.message);
  console.error('   Make sure you have run: vercel env pull .env.local');
  process.exit(1);
}

async function initDatabase() {
  try {
    console.log('🗄️  Initializing database schema...\n');
    
    // Create sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        date TIMESTAMP NOT NULL,
        organizer_id VARCHAR(255) NOT NULL,
        court_cost_type VARCHAR(20) NOT NULL,
        court_cost_value DECIMAL(10,2) NOT NULL DEFAULT 0,
        bird_cost_total DECIMAL(10,2) NOT NULL DEFAULT 0,
        bet_per_player DECIMAL(10,2) NOT NULL DEFAULT 0,
        game_mode VARCHAR(10) NOT NULL DEFAULT 'doubles',
        round_robin_count INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Created sessions table');

    // Create players table
    await sql`
      CREATE TABLE IF NOT EXISTS players (
        id VARCHAR(255) PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Created players table');

    // Create games table
    await sql`
      CREATE TABLE IF NOT EXISTS games (
        id VARCHAR(255) PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        game_number INTEGER NOT NULL,
        team_a JSONB NOT NULL,
        team_b JSONB NOT NULL,
        winning_team VARCHAR(1),
        team_a_score INTEGER,
        team_b_score INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Created games table');

    // Create indexes for better query performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_players_session_id ON players(session_id)
    `;
    console.log('✅ Created index on players.session_id');
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_games_session_id ON games(session_id)
    `;
    console.log('✅ Created index on games.session_id');

    console.log('\n✅ Database schema initialized successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}

async function main() {
  try {
    await initDatabase();
    console.log('\n📚 Next steps:');
    console.log('   1. Your database is ready to use');
    console.log('   2. Start the app: npm run dev');
    console.log('   3. Create a session and test it');
    console.log('   4. Check Vercel Postgres dashboard to see your data');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed to initialize database');
    if (error.message) {
      console.error(`   Error: ${error.message}`);
    }
    if (error.message && (error.message.includes('relation') || error.message.includes('does not exist'))) {
      console.error('\n💡 This might be a connection issue. Check:');
      console.error('   1. Postgres database is created on Vercel');
      console.error('   2. Environment variables are set in .env.local');
      console.error('   3. Connection strings are correct');
    }
    process.exit(1);
  }
}

main();


