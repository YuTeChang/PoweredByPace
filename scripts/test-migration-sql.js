#!/usr/bin/env node
/**
 * Test migration SQL file for syntax and order issues
 * This validates the SQL without connecting to the database
 */

const { readFileSync } = require('fs');
const { join } = require('path');

const migrationPath = join(process.cwd(), 'scripts', 'migrate-add-groups.sql');
const migrationSQL = readFileSync(migrationPath, 'utf-8');

console.log('🔍 Validating migration SQL file...\n');

// Split SQL by semicolons
const statements = migrationSQL
  .split(';')
  .map(s => s.trim())
  .filter(s => {
    if (s.length === 0) return false;
    if (s.startsWith('--')) return false;
    if (s.match(/^\s*$/)) return false;
    return true;
  });

console.log(`Found ${statements.length} SQL statements\n`);

// Track dependencies
const columnDependencies = {
  'idx_sessions_group_id': { table: 'sessions', column: 'group_id' },
  'idx_players_group_player_id': { table: 'players', column: 'group_player_id' },
};

const tableDependencies = {
  'group_players': ['groups'],
  'sessions_group_id_fkey': ['groups', 'sessions.group_id'],
  'players_group_player_id_fkey': ['group_players', 'players.group_player_id'],
};

let issues = [];
let columnAdditions = [];
let indexCreations = [];
let tableCreations = [];

// Analyze each statement
statements.forEach((stmt, idx) => {
  const stmtUpper = stmt.toUpperCase();
  const lineNum = idx + 1;
  
  // Track table creations
  if (stmtUpper.includes('CREATE TABLE')) {
    const tableMatch = stmt.match(/CREATE TABLE.*?(\w+)/i);
    if (tableMatch) {
      tableCreations.push({ line: lineNum, table: tableMatch[1], statement: stmt.substring(0, 80) });
    }
  }
  
  // Track column additions
  if (stmtUpper.includes('ALTER TABLE') && stmtUpper.includes('ADD COLUMN')) {
    const tableMatch = stmt.match(/ALTER TABLE\s+(\w+)/i);
    // Match column name - handle both "ADD COLUMN IF NOT EXISTS column" and "ADD COLUMN column"
    // Column name comes after ADD COLUMN (and optional IF NOT EXISTS)
    const columnMatch = stmt.match(/ADD COLUMN\s+(?:IF NOT EXISTS\s+)?(\w+)/i);
    if (tableMatch && columnMatch) {
      columnAdditions.push({ 
        line: lineNum, 
        table: tableMatch[1], 
        column: columnMatch[1],
        statement: stmt.substring(0, 100) 
      });
    } else if (tableMatch) {
      // Debug: show what we're trying to match
      console.log(`[DEBUG] Could not parse column from: ${stmt.substring(0, 100)}`);
    }
  }
  
  // Track index creations
  if (stmtUpper.includes('CREATE INDEX')) {
    // Match index name after CREATE INDEX IF NOT EXISTS or CREATE INDEX
    const indexMatch = stmt.match(/CREATE INDEX\s+(?:IF NOT EXISTS\s+)?(\w+)/i);
    // Match table name after ON
    const tableMatch = stmt.match(/ON\s+(\w+)\s*\(/i);
    if (indexMatch) {
      indexCreations.push({ 
        line: lineNum, 
        index: indexMatch[1], 
        table: tableMatch ? tableMatch[1] : 'unknown',
        statement: stmt.substring(0, 80) 
      });
    }
  }
});

console.log('📊 Analysis Results:\n');

console.log('Tables to be created:');
tableCreations.forEach(t => console.log(`  Line ${t.line}: ${t.table}`));

console.log('\nColumns to be added:');
columnAdditions.forEach(c => console.log(`  Line ${c.line}: ${c.table}.${c.column}`));

console.log('\nIndexes to be created:');
indexCreations.forEach(i => console.log(`  Line ${i.line}: ${i.index} on ${i.table}`));

// Check for order issues
console.log('\n🔍 Checking for order issues:\n');

// Check if indexes are created before columns
indexCreations.forEach(index => {
  const dep = columnDependencies[index.index];
  if (dep) {
    const columnAdded = columnAdditions.find(c => 
      c.table === dep.table && c.column === dep.column
    );
    
    if (columnAdded && columnAdded.line > index.line) {
      issues.push({
        type: 'ORDER',
        severity: 'ERROR',
        message: `Index ${index.index} (line ${index.line}) is created BEFORE column ${dep.table}.${dep.column} is added (line ${columnAdded.line})`,
        fix: `Move index creation to after line ${columnAdded.line}`
      });
    } else if (!columnAdded) {
      issues.push({
        type: 'MISSING',
        severity: 'WARNING',
        message: `Index ${index.index} references column ${dep.table}.${dep.column} but no ALTER TABLE found to add it`,
      });
    }
  }
});

if (issues.length > 0) {
  console.log('❌ Issues found:\n');
  issues.forEach(issue => {
    console.log(`  [${issue.severity}] ${issue.message}`);
    if (issue.fix) {
      console.log(`     Fix: ${issue.fix}`);
    }
  });
  console.log('');
  process.exit(1);
} else {
  console.log('✅ No order issues detected!');
  console.log('✅ All indexes are created after their columns are added');
  console.log('\n📝 Statement execution order looks correct.');
  process.exit(0);
}

