// js/supabase-client.js
const SUPABASE_URL = "https://bvvvqzygckmkjlnxopyv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_zWsSxiG8SDlHFw4bNUk7cw_A3fgEFLz";

window._supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.sessionStorage // Altera de localStorage para sessionStorage
  }
});