import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error('Supabase environment variables are not set:');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', url ? 'SET' : 'MISSING');
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', key ? 'SET' : 'MISSING');
    throw new Error('Supabase configuration is missing. Please check your environment variables.');
  }

  return createBrowserClient(url, key);
}
