#!/usr/bin/env node

/**
 * Simple test script for the sports-context API endpoint
 * Usage: npm run test:api
 * Or: node test-api.js [team-name]
 */

import fetch from 'node-fetch';

const TEAM = process.argv[2] || 'Toronto Maple Leafs';
const API_URL = process.env.API_URL || 'http://localhost:3000';

async function testEndpoint() {
  const url = `${API_URL}/api/sports-context?team=${encodeURIComponent(TEAM)}`;
  
  console.log('🧪 Testing sports-context API endpoint');
  console.log(`📍 URL: ${url}`);
  console.log(`🏒 Team: ${TEAM}`);
  console.log('─'.repeat(60));
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log(`\n📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📦 Response:`);
    console.log(JSON.stringify(data, null, 2));
    
    if (data.ok) {
      console.log('\n✅ SUCCESS: API returned data');
      if (data.data?.team) {
        console.log(`   Team: ${data.data.team.name}`);
        console.log(`   League: ${data.data.team.league}`);
      }
    } else {
      console.log('\n❌ ERROR: API returned an error');
      console.log(`   Error: ${data.error}`);
    }
  } catch (error) {
    console.error('\n💥 FAILED: Request failed');
    console.error(`   Error: ${error.message}`);
    console.error('\n💡 Make sure the API server is running:');
    console.error('   npm run dev:api');
  }
}

testEndpoint();

