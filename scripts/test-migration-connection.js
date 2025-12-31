#!/usr/bin/env node
/**
 * Test script to verify database connection and SSL configuration
 * Run with: node scripts/test-migration-connection.js
 */

require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');

async function testConnection() {
  const connectionString = 
    process.env.POSTGRES_URL || 
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL ||
    process.env.VERCEL_POSTGRES_URL ||
    process.env.VERCEL_POSTGRES_URL_NON_POOLING;

  if (!connectionString) {
    console.error('❌ No connection string found');
    console.error('Set one of: POSTGRES_URL, POSTGRES_URL_NON_POOLING, DATABASE_URL');
    process.exit(1);
  }

  console.log('🔍 Testing connection...');
  console.log(`   Connection string: ${connectionString.substring(0, 30)}...`);
  
  const isLocalhost = connectionString.includes('localhost') || 
                     connectionString.includes('127.0.0.1');
  console.log(`   Is localhost: ${isLocalhost}`);

  // Test 1: Without SSL config
  console.log('\n📝 Test 1: Without SSL config');
  try {
    const pool1 = new Pool({ connectionString });
    const client1 = await pool1.connect();
    await client1.query('SELECT 1');
    client1.release();
    await pool1.end();
    console.log('   ✅ Success (no SSL needed or auto-detected)');
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
  }

  // Test 2: With SSL rejectUnauthorized: false
  console.log('\n📝 Test 2: With SSL { rejectUnauthorized: false }');
  try {
    const pool2 = new Pool({
      connectionString,
      ssl: !isLocalhost ? { rejectUnauthorized: false } : undefined,
    });
    const client2 = await pool2.connect();
    await client2.query('SELECT 1');
    client2.release();
    await pool2.end();
    console.log('   ✅ Success');
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
  }

  // Test 3: With sslmode in connection string
  console.log('\n📝 Test 3: With sslmode=require in connection string');
  try {
    let connStr = connectionString;
    if (!isLocalhost) {
      connStr = connStr.replace(/[?&]sslmode=[^&]*/g, '');
      const separator = connStr.includes('?') ? '&' : '?';
      connStr = `${connStr}${separator}sslmode=require`;
    }
    const pool3 = new Pool({
      connectionString: connStr,
      ssl: !isLocalhost ? { rejectUnauthorized: false } : undefined,
    });
    const client3 = await pool3.connect();
    await client3.query('SELECT 1');
    client3.release();
    await pool3.end();
    console.log('   ✅ Success');
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
  }

  // Test 4: With sslmode=no-verify (if require fails)
  if (!isLocalhost) {
    console.log('\n📝 Test 4: With sslmode=no-verify in connection string');
    try {
      let connStr = connectionString.replace(/[?&]sslmode=[^&]*/g, '');
      const separator = connStr.includes('?') ? '&' : '?';
      connStr = `${connStr}${separator}sslmode=no-verify`;
      const pool4 = new Pool({ connectionString: connStr });
      const client4 = await pool4.connect();
      await client4.query('SELECT 1');
      client4.release();
      await pool4.end();
      console.log('   ✅ Success');
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
  }
}

testConnection().catch(console.error);

