#!/usr/bin/env node
/**
 * Test script to verify group sessions are working correctly
 * 
 * Usage: node scripts/test-group-sessions.js
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function testGroupSessions() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    console.error('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔍 Testing group sessions...\n');

  // 1. Get all groups
  console.log('1. Fetching all groups...');
  const { data: groups, error: groupsError } = await supabase
    .from('groups')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (groupsError) {
    console.error('❌ Error fetching groups:', groupsError);
    process.exit(1);
  }

  if (!groups || groups.length === 0) {
    console.log('⚠️  No groups found. Please create a group first.');
    process.exit(0);
  }

  console.log(`   Found ${groups.length} group(s)`);
  const testGroup = groups[0];
  console.log(`   Testing with group: ${testGroup.name} (${testGroup.id})\n`);

  // 2. Get all sessions for this group
  console.log('2. Fetching sessions for this group...');
  const { data: groupSessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('*')
    .eq('group_id', testGroup.id)
    .order('date', { ascending: false });

  if (sessionsError) {
    console.error('❌ Error fetching group sessions:', sessionsError);
    process.exit(1);
  }

  console.log(`   Found ${groupSessions?.length || 0} session(s) for this group`);
  if (groupSessions && groupSessions.length > 0) {
    console.log('   Sessions:');
    groupSessions.forEach(s => {
      console.log(`     - ${s.name || 'Unnamed'} (${s.id}) - group_id: ${s.group_id}`);
    });
  }

  // 3. Get all sessions (to compare)
  console.log('\n3. Fetching ALL sessions (for comparison)...');
  const { data: allSessions, error: allSessionsError } = await supabase
    .from('sessions')
    .select('*')
    .order('date', { ascending: false })
    .limit(10);

  if (allSessionsError) {
    console.error('❌ Error fetching all sessions:', allSessionsError);
    process.exit(1);
  }

  console.log(`   Found ${allSessions?.length || 0} total session(s)`);
  const sessionsWithGroups = allSessions?.filter(s => s.group_id) || [];
  const sessionsWithoutGroups = allSessions?.filter(s => !s.group_id) || [];
  
  console.log(`   - ${sessionsWithGroups.length} with group_id`);
  console.log(`   - ${sessionsWithoutGroups.length} without group_id`);
  
  if (sessionsWithGroups.length > 0) {
    console.log('\n   Sessions with groups:');
    sessionsWithGroups.forEach(s => {
      console.log(`     - ${s.name || 'Unnamed'} (${s.id}) - group_id: ${s.group_id}`);
    });
  }

  // 4. Check if there's a mismatch
  console.log('\n4. Analysis:');
  const expectedGroupSessions = allSessions?.filter(s => s.group_id === testGroup.id) || [];
  console.log(`   Expected sessions for group ${testGroup.id}: ${expectedGroupSessions.length}`);
  console.log(`   Actual sessions found: ${groupSessions?.length || 0}`);
  
  if (expectedGroupSessions.length !== (groupSessions?.length || 0)) {
    console.log('\n   ⚠️  MISMATCH DETECTED!');
    console.log('   Expected sessions:');
    expectedGroupSessions.forEach(s => {
      console.log(`     - ${s.name || 'Unnamed'} (${s.id})`);
    });
    console.log('   Found sessions:');
    (groupSessions || []).forEach(s => {
      console.log(`     - ${s.name || 'Unnamed'} (${s.id})`);
    });
  } else {
    console.log('   ✅ Counts match!');
  }

  console.log('\n✅ Test complete!');
}

testGroupSessions().catch(console.error);

