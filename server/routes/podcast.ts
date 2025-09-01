import express from 'express';
import { supabase } from '../lib/supabase';
import { createPodcastEpisodeSchema, updatePodcastEpisodeSchema } from '../../shared/schema';

const router = express.Router();

// GET /api/podcast/episodes - Get all episodes
router.get('/episodes', async (req, res) => {
  try {
    const { data: episodes, error } = await supabase
      .from('podcast_episodes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching episodes:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ episodes });
  } catch (error) {
    console.error('Server error fetching episodes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/podcast/episodes - Create a new episode
router.post('/episodes', async (req, res) => {
  try {
    // Validate the request body
    const validationResult = createPodcastEpisodeSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: validationResult.error.errors
      });
    }

    const episodeData = validationResult.data;
    
    // Convert empty strings to null for database
    const cleanData = {
      ...episodeData,
      video_url: episodeData.video_url === "" ? null : episodeData.video_url,
      audio_url: episodeData.audio_url === "" ? null : episodeData.audio_url,
      video_thumbnail: episodeData.video_thumbnail === "" ? null : episodeData.video_thumbnail,
    };

    // Insert the episode using service role key (bypasses RLS)
    const { data: episode, error } = await supabase
      .from('podcast_episodes')
      .insert([cleanData])
      .select()
      .single();

    if (error) {
      console.error('Error creating episode:', error);
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ episode });
  } catch (error) {
    console.error('Server error creating episode:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/podcast/episodes/:id - Update an episode
router.put('/episodes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate the request body
    const validationResult = updatePodcastEpisodeSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: validationResult.error.errors
      });
    }

    const updateData = validationResult.data;

    // Update the episode using service role key (bypasses RLS)
    const { data: episode, error } = await supabase
      .from('podcast_episodes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating episode:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ episode });
  } catch (error) {
    console.error('Server error updating episode:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/podcast/episodes/:id - Delete an episode
router.delete('/episodes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Delete the episode using service role key (bypasses RLS)
    const { error } = await supabase
      .from('podcast_episodes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting episode:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Server error deleting episode:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;