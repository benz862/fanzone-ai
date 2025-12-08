#!/usr/bin/env node

/**
 * Test script for the fanzone-chat API endpoint
 * Usage: npm run test:chat
 * Or: node test-chat-api.js [message] [team]
 */

import fetch from 'node-fetch';

const MESSAGE = process.argv[2] || 'Tell me about the team';
const TEAM = process.argv[3] || 'Toronto Maple Leafs';
const API_URL = process.env.API_URL || 'http://localhost:3000';

async function testChatEndpoint() {
  const url = `${API_URL}/api/fanzone-chat`;
  
  console.log('🧪 Testing fanzone-chat API endpoint');
  console.log(`📍 URL: ${url}`);
  console.log(`💬 Message: ${MESSAGE}`);
  console.log(`🏒 Team: ${TEAM}`);
  console.log('─'.repeat(60));
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: MESSAGE,
        team: TEAM
      })
    });
    
    const data = await response.json();
    
    console.log(`\n📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📦 Response:`);
    console.log(JSON.stringify(data, null, 2));
    
    if (response.ok && data.reply) {
      console.log('\n✅ SUCCESS: OpenAI chat is working!');
      console.log(`   Reply: ${data.reply.substring(0, 100)}...`);
    } else {
      console.log('\n❌ ERROR: API returned an error');
      console.log(`   Error: ${data.error || 'Unknown error'}`);
      if (data.details) {
        console.log(`   Details: ${data.details}`);
      }
    }
  } catch (error) {
    console.error('\n💥 FAILED: Request failed');
    console.error(`   Error: ${error.message}`);
    console.error('\n💡 Make sure the API server is running:');
    console.error('   npm run dev:api');
  }
}

testChatEndpoint();

