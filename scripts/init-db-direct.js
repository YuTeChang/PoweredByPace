#!/usr/bin/env node

/**
 * Direct database initialization script
 * Uses Next.js runtime to execute the database init function
 */

// Load environment variables
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

// Use dynamic import for ES modules
async function main() {
  console.log('🗄️  Initializing database schema...\n');
  
  try {
    // Import the database module (ES module)
    const { initDatabase } = await import('../lib/db.ts');
    await initDatabase();
    console.log('\n✅ Database initialized successfully!');
    console.log('\n📚 Next steps:');
    console.log('   1. Your database is ready to use');
    console.log('   2. Start the app: npm run dev');
    console.log('   3. Create a session and test it');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error initializing database:');
    console.error(error.message || error);
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

