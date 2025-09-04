// Test script for system email templates
import { simpleEmailScheduler } from './services/SimpleEmailScheduler.js';

async function testSystemEmails() {
  console.log('🧪 Testing system email templates...');
  
  try {
    // Load templates first
    await simpleEmailScheduler.emailService.loadTemplates();
    console.log('📋 Available templates:', Array.from(simpleEmailScheduler.emailService.templates.keys()));
    
    // Test welcome email
    console.log('\n📧 Testing welcome email...');
    const welcomeSuccess = await simpleEmailScheduler.emailService.sendWelcomeEmail(
      'test@example.com', 
      'https://bizzin.co.za/auth/confirm?token=test-123'
    );
    console.log('Welcome email result:', welcomeSuccess ? '✅ Success' : '❌ Failed');
    
    // Test password reset email
    console.log('\n🔐 Testing password reset email...');
    const resetSuccess = await simpleEmailScheduler.emailService.sendPasswordResetEmail(
      'test@example.com',
      'https://bizzin.co.za/auth/reset?token=reset-456'
    );
    console.log('Password reset email result:', resetSuccess ? '✅ Success' : '❌ Failed');
    
    console.log('\n🎉 System email tests completed!');
    
  } catch (error) {
    console.error('❌ Error testing system emails:', error);
  }
}

// Run the test
testSystemEmails();