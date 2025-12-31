#!/usr/bin/env node

/**
 * Initialize database schema using Node.js and pg library
 * This works better with Supabase connections than @vercel/postgres
 */

import { Client } from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
const envPath = join(__dirname, '..', '.env.local');
let postgresUrl = null;
let postgresHost = null;
let postgresUser = null;
let postgresPassword = null;
let postgresDatabase = null;

try {
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      // Try to get connection URL first
      let match = trimmed.match(/^POSTGRES_URL_NON_POOLING=(.*)$/);
      if (match && !postgresUrl) {
        let value = match[1].trim();
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        postgresUrl = value;
      }
      
      // Also get individual components as fallback
      match = trimmed.match(/^POSTGRES_HOST=(.*)$/);
      if (match) {
        let value = match[1].trim();
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        postgresHost = value;
      }
      
      match = trimmed.match(/^POSTGRES_USER=(.*)$/);
      if (match) {
        let value = match[1].trim();
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        postgresUser = value;
      }
      
      match = trimmed.match(/^POSTGRES_PASSWORD=(.*)$/);
      if (match) {
        let value = match[1].trim();
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        postgresPassword = value;
      }
      
      match = trimmed.match(/^POSTGRES_DATABASE=(.*)$/);
      if (match) {
        let value = match[1].trim();
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        postgresDatabase = value;
      }
    }
  });
  
  // Use NON_POOLING URL if available (better for schema operations)
  // The pooler might have restrictions, but it's what we have access to
  if (postgresUrl && postgresUrl.includes('pooler')) {
    console.log('ℹ️  Using pooler connection (direct host not accessible)');
  }
} catch (error) {
  console.error('❌ Could not load .env.local:', error.message);
  console.error('   Make sure you have run: vercel env pull .env.local');
  process.exit(1);
}

if (!postgresUrl) {
  console.error('❌ Could not find Postgres connection details in .env.local');
  process.exit(1);
}

// Load SQL schema
const sqlPath = join(__dirname, 'init-db-schema.sql');
let sqlContent;
try {
  sqlContent = readFileSync(sqlPath, 'utf8');
} catch (error) {
  console.error('❌ Could not load SQL schema file:', error.message);
  process.exit(1);
}

async function initDatabase() {
  console.log('🔗 Using connection string:', postgresUrl.replace(/:[^:@]+@/, ':****@')); // Hide password
  
  // Parse the connection string to handle Supabase's format
  const url = new URL(postgresUrl);
  const client = new Client({
    host: url.hostname,
    port: parseInt(url.port) || 5432,
    database: url.pathname.slice(1).split('?')[0] || 'postgres',
    user: url.username,
    password: url.password,
    ssl: url.searchParams.get('sslmode') === 'require' ? {
      rejectUnauthorized: false,
      require: true
    } : false,
    connectionTimeoutMillis: 60000, // 60 second timeout
    query_timeout: 60000,
  });

  try {
    console.log('🗄️  Initializing database schema...');
    console.log('📡 Connecting to database...\n');
    
    await client.connect();
    console.log('✅ Connected to database\n');
    
    // Split SQL by semicolons and execute each statement
    // Remove comments and empty lines
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
      .filter(s => !s.match(/^\s*$/));

    for (const statement of statements) {
      if (statement.length > 0) {
        try {
          await client.query(statement);
          // Extract table/policy name for logging
          const match = statement.match(/(?:CREATE|ALTER|CREATE POLICY).*?(?:TABLE|POLICY)\s+(?:IF NOT EXISTS\s+)?(?:public\.)?(\w+)/i);
          if (match) {
            console.log(`✅ Executed: ${match[1]}`);
          } else if (statement.includes('CREATE INDEX')) {
            const idxMatch = statement.match(/idx_\w+/i);
            console.log(`✅ Created index: ${idxMatch ? idxMatch[0] : 'index'}`);
          } else {
            console.log(`✅ Executed statement`);
          }
        } catch (error) {
          // Ignore "already exists" errors
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate') ||
              error.code === '42P07' || // duplicate_table
              error.code === '42710') { // duplicate_object
            console.log(`ℹ️  Already exists (skipping)`);
          } else {
            throw error;
          }
        }
      }
    }

    console.log('\n✅ Database schema initialized successfully!');
    console.log('\n📚 Next steps:');
    console.log('   1. Your database is ready to use');
    console.log('   2. Start the app: npm run dev');
    console.log('   3. Create a session and test it');
    
  } catch (error) {
    console.error('\n❌ Error initializing database:');
    console.error(`   ${error.message}`);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

initDatabase();

