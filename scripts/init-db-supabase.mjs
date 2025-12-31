#!/usr/bin/env node

/**
 * Initialize database schema using Supabase REST API + PostgREST
 * This uses the Supabase service role to execute SQL via their API
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '..', '.env.local');
let supabaseUrl = null;
let supabaseServiceKey = null;

try {
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      let match = trimmed.match(/^SUPABASE_URL=(.*)$/);
      if (match) {
        let value = match[1].trim();
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        supabaseUrl = value;
      }
      
      match = trimmed.match(/^SUPABASE_SERVICE_ROLE_KEY=(.*)$/);
      if (match) {
        let value = match[1].trim();
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        supabaseServiceKey = value;
      }
    }
  });
} catch (error) {
  console.error('❌ Could not load .env.local:', error.message);
  process.exit(1);
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
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

async function executeSQL(sql) {
  // Supabase doesn't have a direct SQL execution API
  // We need to use the PostgREST RPC endpoint or direct connection
  // For now, let's try using the Supabase SQL API if available
  // Otherwise, we'll provide instructions
  
  console.log('⚠️  Supabase REST API cannot execute arbitrary SQL');
  console.log('   You need to use one of these methods:\n');
  console.log('   1. Supabase Dashboard SQL Editor (recommended)');
  console.log('   2. Direct PostgreSQL connection (if accessible)');
  console.log('   3. Supabase CLI (if installed)\n');
  
  console.log('📋 SQL to execute:\n');
  console.log('─'.repeat(60));
  console.log(sql);
  console.log('─'.repeat(60));
  console.log('\n💡 Quick steps:');
  console.log('   1. Go to: https://supabase.com/dashboard/project/mcqnzuurqhiatpizzfnw');
  console.log('   2. Click "SQL Editor" in the sidebar');
  console.log('   3. Click "New query"');
  console.log('   4. Paste the SQL above');
  console.log('   5. Click "Run" (or Cmd/Ctrl + Enter)\n');
  
  return false;
}

async function initDatabase() {
  console.log('🗄️  Initializing database schema via Supabase...\n');
  
  // Try to execute via API (will likely fail, but provides fallback)
  const result = await executeSQL(sqlContent);
  
  if (!result) {
    console.log('✅ Instructions provided above');
    console.log('   After running the SQL in Supabase Dashboard, your database will be ready!\n');
  }
}

initDatabase();


