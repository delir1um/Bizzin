// Temporary migration endpoint to setup footer_content table
import express from 'express';
import { supabase } from '../lib/supabase.js';

const router = express.Router();

// POST /api/migration/footer-content - Create footer_content table
router.post('/footer-content', async (req, res) => {
  try {
    console.log('🚀 Creating footer_content table via migration endpoint...');
    
    // Insert the data directly - this will tell us if table exists
    const { data: insertResult, error: insertError } = await supabase
      .from('footer_content')
      .upsert([
        {
          type: 'privacy',
          title: 'Privacy Policy', 
          content: 'We are committed to protecting your privacy and ensuring the security of your personal information. This privacy policy explains how we collect, use, and safeguard your data when you use our business management platform.',
          is_published: true
        },
        {
          type: 'terms',
          title: 'Terms of Service',
          content: 'By accessing and using Bizzin, you agree to comply with and be bound by these Terms of Service. Please read these terms carefully before using our platform.',
          is_published: true
        },
        {
          type: 'contact',
          title: 'Contact Us',
          content: 'We are here to help you succeed in your business journey. Get in touch with us for any questions, support needs, or feedback.',
          is_published: true
        }
      ], { onConflict: 'type' });

    if (insertError) {
      if (insertError.code === '42P01') {
        // Table doesn't exist - need manual creation
        return res.status(400).json({ 
          error: 'Table does not exist',
          message: 'Please create the footer_content table in Supabase SQL editor first',
          sql: `
CREATE TABLE footer_content (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type VARCHAR(20) NOT NULL CHECK (type IN ('privacy', 'terms', 'contact')),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(type)
);

ALTER TABLE footer_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "footer_content_public_read" ON footer_content
  FOR SELECT USING (is_published = true);
  
CREATE POLICY "footer_content_admin_all" ON footer_content
  FOR ALL USING (true) WITH CHECK (true);
          `
        });
      }
      
      console.error('❌ Error inserting footer content:', insertError);
      return res.status(500).json({ error: insertError.message });
    }

    console.log('✅ Footer content table setup complete');
    res.json({ 
      success: true, 
      message: 'Footer content table setup complete',
      data: insertResult 
    });
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    res.status(500).json({ error: 'Migration failed' });
  }
});

export default router;