#!/usr/bin/env node
/**
 * Test the group sessions query directly
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const groupId = process.argv[2] || 'group-1767207376238';

async function testQuery() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log('Testing query for groupId:', groupId);
  console.log('');

  // Main query
  const { data: mainData, error: mainError } = await supabase
    .from('sessions')
    .select('*')
    .eq('group_id', groupId);
  
  console.log('Main query result:');
  console.log('  Count:', mainData?.length || 0);
  console.log('  Error:', mainError?.message || 'none');
  if (mainData) {
    mainData.forEach(s => {
      console.log(`  - ${s.id}: ${s.name} (created: ${s.created_at})`);
    });
  }
  console.log('');

  // Check all sessions with this group_id
  const { data: allData, error: allError } = await supabase
    .from('sessions')
    .select('id, name, group_id, created_at')
    .eq('group_id', groupId);
  
  console.log('All sessions with group_id query:');
  console.log('  Count:', allData?.length || 0);
  console.log('  Error:', allError?.message || 'none');
  if (allData) {
    allData.forEach(s => {
      console.log(`  - ${s.id}: ${s.name} (created: ${s.created_at})`);
    });
  }
}

testQuery().catch(console.error);

