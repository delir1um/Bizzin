// Footer Content API Routes - managing website footer legal content
import express from 'express';
import { supabase } from '../lib/supabase.js';
import { 
  createFooterContentSchema, 
  updateFooterContentSchema,
  type CreateFooterContent,
  type UpdateFooterContent 
} from '../../shared/schema.js';

const router = express.Router();

// GET /api/footer-content - Get all footer content (public endpoint)
router.get('/', async (req, res) => {
  try {
    const { data: footerContent, error } = await supabase
      .from('footer_content')
      .select('*')
      .eq('is_published', true)
      .order('type');

    if (error) {
      console.error('Error fetching footer content:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, content: footerContent });
  } catch (error) {
    console.error('Server error fetching footer content:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/footer-content/admin - Get all footer content for admin (including unpublished)
router.get('/admin', async (req, res) => {
  try {
    const { data: footerContent, error } = await supabase
      .from('footer_content')
      .select('*')
      .order('type');

    if (error) {
      console.error('Error fetching admin footer content:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, content: footerContent });
  } catch (error) {
    console.error('Server error fetching admin footer content:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/footer-content/:type - Get content by type (privacy/terms/contact)
router.get('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!['privacy', 'terms', 'contact'].includes(type)) {
      return res.status(400).json({ error: 'Invalid content type' });
    }

    const { data: content, error } = await supabase
      .from('footer_content')
      .select('*')
      .eq('type', type)
      .eq('is_published', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No content found, return default
        return res.json({ 
          success: true, 
          content: {
            type,
            title: type.charAt(0).toUpperCase() + type.slice(1),
            content: `${type.charAt(0).toUpperCase() + type.slice(1)} content coming soon.`
          }
        });
      }
      console.error('Error fetching footer content by type:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, content });
  } catch (error) {
    console.error('Server error fetching footer content by type:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/footer-content - Create new footer content (admin only)
router.post('/', async (req, res) => {
  try {
    // Validate the request body
    const validationResult = createFooterContentSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: validationResult.error.errors
      });
    }

    const contentData = validationResult.data;
    
    // Check if content for this type already exists
    const { data: existingContent, error: checkError } = await supabase
      .from('footer_content')
      .select('id')
      .eq('type', contentData.type)
      .single();

    if (existingContent) {
      return res.status(409).json({ 
        error: 'Content for this type already exists. Use PUT to update.' 
      });
    }

    // Insert the content using service role key (bypasses RLS)
    const { data: content, error } = await supabase
      .from('footer_content')
      .insert([contentData])
      .select()
      .single();

    if (error) {
      console.error('Error creating footer content:', error);
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ success: true, content });
  } catch (error) {
    console.error('Server error creating footer content:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/footer-content/:type - Update footer content by type (admin only)
router.put('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!['privacy', 'terms', 'contact'].includes(type)) {
      return res.status(400).json({ error: 'Invalid content type' });
    }
    
    // Validate the request body
    const validationResult = updateFooterContentSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: validationResult.error.errors
      });
    }

    const updateData = validationResult.data;
    
    // Try to update existing content
    const { data: content, error } = await supabase
      .from('footer_content')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('type', type)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No existing content, create new one
        const createData = {
          type: type as 'privacy' | 'terms' | 'contact',
          title: updateData.title || type.charAt(0).toUpperCase() + type.slice(1),
          content: updateData.content || `${type.charAt(0).toUpperCase() + type.slice(1)} content.`,
          is_published: updateData.is_published ?? true
        };

        const { data: newContent, error: createError } = await supabase
          .from('footer_content')
          .insert([createData])
          .select()
          .single();

        if (createError) {
          console.error('Error creating footer content:', createError);
          return res.status(500).json({ error: createError.message });
        }

        return res.json({ success: true, content: newContent });
      }
      
      console.error('Error updating footer content:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, content });
  } catch (error) {
    console.error('Server error updating footer content:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/footer-content/:type - Delete footer content by type (admin only)
router.delete('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!['privacy', 'terms', 'contact'].includes(type)) {
      return res.status(400).json({ error: 'Invalid content type' });
    }

    const { error } = await supabase
      .from('footer_content')
      .delete()
      .eq('type', type);

    if (error) {
      console.error('Error deleting footer content:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Server error deleting footer content:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;