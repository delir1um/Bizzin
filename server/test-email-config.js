// Test SMTP2GO configuration
import nodemailer from 'nodemailer';

async function testEmailConfig() {
  console.log('🧪 Testing SMTP2GO Email Configuration...\n');

  // Show current configuration
  console.log('Current Environment Variables:');
  console.log(`SMTP_HOST: ${process.env.SMTP_HOST || 'Not set'}`);
  console.log(`SMTP_PORT: ${process.env.SMTP_PORT || 'Not set'}`);
  console.log(`SMTP_USER: ${process.env.SMTP_USER || 'Not set'}`);
  console.log(`SMTP_PASSWORD: ${process.env.SMTP_PASSWORD ? 'Set (hidden)' : 'Not set'}`);
  console.log(`SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set (hidden)' : 'Not set'}\n`);

  // Create transporter with SMTP2GO settings
  const transporter = nodemailer.createTransport({
    host: 'mail.smtp2go.com',
    port: 2525,
    secure: false, // Use STARTTLS
    auth: {
      user: process.env.SMTP_USER || 'bizzin',
      pass: process.env.SMTP_PASSWORD || process.env.EMAIL_APP_PASSWORD,
    },
  });

  try {
    // Verify connection
    console.log('🔌 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');

    // Send test email
    const testEmail = process.env.TEST_EMAIL || 'your-email@example.com';
    console.log(`📧 Sending test email to ${testEmail}...`);

    const mailOptions = {
      from: '"Bizzin Test" <noreply@bizzin.app>',
      to: testEmail,
      subject: 'Bizzin Daily Email System - Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #EA7A57;">Bizzin Email System Test</h1>
          <p>This is a test email from your Bizzin daily email system.</p>
          <p><strong>SMTP2GO Configuration:</strong> ✅ Working</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <p style="color: #666; font-size: 12px;">
            If you received this email, your SMTP2GO configuration is working correctly!
          </p>
        </div>
      `,
      text: 'Bizzin Email System Test - This is a test email from your daily email system.'
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!');
    console.log(`Message ID: ${result.messageId}\n`);

  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n💡 Authentication failed. Please check:');
      console.log('- SMTP_USER is correct (should be "bizzin")');
      console.log('- SMTP_PASSWORD matches your SMTP2GO password');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n💡 Connection failed. Please check:');
      console.log('- Internet connection');
      console.log('- SMTP2GO service status');
    } else {
      console.log(`\n💡 Error code: ${error.code}`);
    }
  }

  console.log('\n📝 Next Steps:');
  console.log('1. Make sure all environment variables are set');
  console.log('2. Get your Supabase Service Role Key from Settings → API');
  console.log('3. Test with: node server/test-email-config.js');
  console.log('4. Once working, restart the application');
}

testEmailConfig().catch(console.error);