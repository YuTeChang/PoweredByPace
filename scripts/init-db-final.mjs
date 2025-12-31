#!/usr/bin/env node

/**
 * Initialize database schema - Final attempt with better connection handling
 * Falls back to providing SQL for manual execution if connection fails
 */

import { Client } from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '..', '.env.local');
let postgresUrl = null;

try {
  const envContent = readFileSync(envPath, 'utf8');
  // Prefer NON_POOLING for schema operations
  const nonPoolingMatch = envContent.match(/POSTGRES_URL_NON_POOLING="([^"]+)"/);
  if (nonPoolingMatch) {
    postgresUrl = nonPoolingMatch[1];
  } else {
    const urlMatch = envContent.match(/POSTGRES_URL="([^"]+)"/);
    if (urlMatch) {
      postgresUrl = urlMatch[1];
    }
  }
} catch (error) {
  console.error('❌ Could not load .env.local');
  process.exit(1);
}

if (!postgresUrl) {
  console.error('❌ POSTGRES_URL not found');
  process.exit(1);
}

// Load SQL schema
const sqlPath = join(__dirname, 'init-db-schema.sql');
let sqlContent;
try {
  sqlContent = readFileSync(sqlPath, 'utf8');
} catch (error) {
  console.error('❌ Could not load SQL schema');
  process.exit(1);
}

async function initDatabase() {
  console.log('🗄️  Attempting to initialize database schema...\n');
  console.log('📡 Connecting to:', postgresUrl.replace(/:[^:@]+@/, ':****@'));
  
  const client = new Client({
    connectionString: postgresUrl,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 15000,
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully!\n');
    
    // Split and execute SQL statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.match(/^\s*$/));

    for (const statement of statements) {
      try {
        await client.query(statement);
        const tableMatch = statement.match(/(?:CREATE|ALTER|CREATE POLICY).*?(?:TABLE|POLICY)\s+(?:IF NOT EXISTS\s+)?(?:public\.)?(\w+)/i);
        const indexMatch = statement.match(/CREATE INDEX.*?ON\s+(\w+)/i);
        if (tableMatch) {
          console.log(`✅ ${tableMatch[1]}`);
        } else if (indexMatch) {
          console.log(`✅ Index on ${indexMatch[1]}`);
        } else {
          console.log(`✅ Executed`);
        }
      } catch (error) {
        if (error.code === '42P07' || error.code === '42710' || error.message.includes('already exists')) {
          console.log(`ℹ️  Already exists (skipped)`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n✅ Database schema initialized successfully!');
    console.log('\n📚 Next steps:');
    console.log('   1. Start the app: npm run dev');
    console.log('   2. Create a session and test it');
    
    await client.end();
    process.exit(0);
    
  } catch (error) {
    await client.end().catch(() => {});
    
    console.log('\n❌ Connection failed:', error.message);
    console.log('\n📋 Manual Setup Required:');
    console.log('─'.repeat(60));
    console.log('Since direct connection is not available, please run this SQL');
    console.log('in the Supabase Dashboard SQL Editor:\n');
    console.log('1. Go to: https://supabase.com/dashboard/project/mcqnzuurqhiatpizzfnw');
    console.log('2. Click "SQL Editor" → "New query"');
    console.log('3. Copy and paste the SQL below:\n');
    console.log('─'.repeat(60));
    console.log(sqlContent);
    console.log('─'.repeat(60));
    console.log('\n4. Click "Run" (Cmd/Ctrl + Enter)');
    console.log('5. Verify tables were created in "Table Editor"\n');
    
    process.exit(1);
  }
}

initDatabase();


