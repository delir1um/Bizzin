#!/usr/bin/env node

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const AI_API_URL = process.env.REPLIT_URL 
  ? `${process.env.REPLIT_URL}/api/ai/chat` 
  : 'http://localhost:5000/api/ai/chat';

async function sendChatRequest(prompt, options = {}) {
  try {
    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        stream: false, // Non-streaming for CLI
        ...options
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ Chat request failed:', error.message);
    return null;
  }
}

async function main() {
  console.log('🤖 Claude AI CLI');
  console.log('Type your message and press Enter. Type "exit" to quit.');
  console.log('---');

  const askQuestion = () => {
    rl.question('You: ', async (input) => {
      if (input.toLowerCase().trim() === 'exit') {
        console.log('Goodbye! 👋');
        rl.close();
        return;
      }

      if (!input.trim()) {
        askQuestion();
        return;
      }

      console.log('🔄 Thinking...');
      
      const result = await sendChatRequest(input.trim());
      
      if (result) {
        console.log(`\n🤖 Claude: ${result.text}\n`);
        if (result.usage) {
          console.log(`📊 Usage: ${result.usage.input_tokens} input + ${result.usage.output_tokens} output tokens\n`);
        }
      } else {
        console.log('❌ Failed to get response\n');
      }

      askQuestion();
    });
  };

  askQuestion();
}

// Handle Ctrl+C
rl.on('SIGINT', () => {
  console.log('\nGoodbye! 👋');
  process.exit(0);
});

main().catch(error => {
  console.error('❌ CLI Error:', error.message);
  process.exit(1);
});