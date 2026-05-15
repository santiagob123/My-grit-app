import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../api/supabase';

export interface Post {
  id: string;
  user_id: string;
  content: string;
  type: 'report' | 'achievement' | 'general';
  created_at: string;
  username?: string;
  level?: number;
  grade?: string;
  hype_count: number;
  has_hyped: boolean;
}

interface SocialState {
  posts: Post[];
  loading: boolean;
  fetchPosts: () => Promise<void>;
  createPost: (content: string, type?: Post['type']) => Promise<void>;
  toggleHype: (postId: string) => Promise<void>;
}

export const useSocialStore = create<SocialState>()(
  persist(
    (set, get) => ({
      posts: [],
      loading: false,

      fetchPosts: async () => {
        set({ loading: true });
        try {
          // In a real app, we would join with profiles, but for now we'll fetch posts
          // and hydrate them with local user data if needed, or just fetch them all.
          const { data: postsData, error: postsError } = await supabase
            .from('posts')
            .select(`
              *,
              profiles (username),
              post_hypes (user_id)
            `)
            .order('created_at', { ascending: false });

          if (postsError) throw postsError;

          const { data: { user } } = await supabase.auth.getUser();

          const formattedPosts = postsData.map((p: any) => ({
            ...p,
            username: p.profiles?.username || 'Guerrero Anónimo',
            hype_count: p.post_hypes?.length || 0,
            has_hyped: p.post_hypes?.some((h: any) => h.user_id === user?.id) || false,
            // Mocking level and grade for now (these should come from profiles)
            level: Math.floor(Math.random() * 10) + 1,
            grade: ['S', 'A', 'B'][Math.floor(Math.random() * 3)]
          }));

          set({ posts: formattedPosts, loading: false });
        } catch (error) {
          console.error('Error fetching posts:', error);
          set({ loading: false });
        }
      },

      createPost: async (content, type = 'report') => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from('posts').insert({
          user_id: user.id,
          content,
          type
        });

        if (!error) {
          get().fetchPosts();
        }
      },

      toggleHype: async (postId) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const post = get().posts.find(p => p.id === postId);
        if (!post) return;

        if (post.has_hyped) {
          await supabase.from('post_hypes').delete().match({ post_id: postId, user_id: user.id });
        } else {
          await supabase.from('post_hypes').insert({ post_id: postId, user_id: user.id });
        }

        get().fetchPosts();
      }
    }),
    {
      name: 'grit-social-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
