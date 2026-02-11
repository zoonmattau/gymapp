import { supabase } from '../lib/supabase';

export const storageService = {
  // Upload profile picture
  async uploadProfilePicture(userId, file) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `profile-pictures/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.warn('Upload error:', uploadError?.message);
        return { data: null, error: uploadError };
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return { data: { url: publicUrl, path: filePath }, error: null };
    } catch (err) {
      console.warn('uploadProfilePicture error:', err?.message);
      return { data: null, error: err };
    }
  },

  // Upload cover photo
  async uploadCoverPhoto(userId, file) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `cover-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.warn('Upload error:', uploadError?.message);
        return { data: null, error: uploadError };
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return { data: { url: publicUrl, path: filePath }, error: null };
    } catch (err) {
      console.warn('uploadCoverPhoto error:', err?.message);
      return { data: null, error: err };
    }
  },

  // Delete file from storage
  async deleteFile(filePath) {
    try {
      const { error } = await supabase.storage
        .from('avatars')
        .remove([filePath]);

      if (error) {
        console.warn('Delete error:', error?.message);
      }
      return { error };
    } catch (err) {
      console.warn('deleteFile error:', err?.message);
      return { error: err };
    }
  },
};

export default storageService;
