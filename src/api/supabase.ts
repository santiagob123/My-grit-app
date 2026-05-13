import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://jhjmxnijihftgyrdmkbt.supabase.co';
const supabaseAnonKey = 'sb_publishable_GSArq0RsmpAcVZHZ3SvkDQ_0MWOCFYB';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
