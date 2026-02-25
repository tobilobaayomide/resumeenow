import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const useResumes = (userId: string | undefined) => {
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Wrap fetchResumes in useCallback so it's stable and can be added to dependencies
  const fetchResumes = useCallback(async () => {
    if (!userId) {
      setResumes([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setResumes(data || []);
    } catch (error: any) {
      console.error('Error fetching resumes:', error.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial fetch when userId changes
  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  const createResume = async (title: string, templateId: string = 'executive') => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('resumes')
        .insert([
          { 
            user_id: userId,
            title: title || 'Untitled Resume',
            template_id: templateId, 
            content: {}, 
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;
      setResumes((prev) => [data, ...prev]);
      return data; 
    } catch (error: any) {
      console.error('Error creating resume:', error.message);
      return null;
    }
  };

  const deleteResume = async (id: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('resumes')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      setResumes((prev) => prev.filter((r) => r.id !== id));
    } catch (error: any) {
      console.error('Error deleting resume:', error.message);
    }
  };

  // Return refreshResumes so components can manually trigger a reload
  return { resumes, loading, createResume, deleteResume, refreshResumes: fetchResumes };
};
