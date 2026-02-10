const SUPABASE_URL = "https://dzapautrxnsbhlogvfuw.supabase.co"
const SUPABASE_KEY = "sb_publishable_oLBqGc88xJGoVNsM5BhKQg_WyHxmHyR"

window.supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
)
