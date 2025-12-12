// Supabase Configuration
// This file is shared across all pages

const SUPABASE_URL = 'https://pieukthfqinsiygjvwnz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpZXVrdGhmcWluc2l5Z2p2d256Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0OTYyNTIsImV4cCI6MjA4MTA3MjI1Mn0.3RxUTgmpD-yn3N7g8HaJLD9LvKUUQEHZ8XA38XucfjM';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Storage bucket name
const STORAGE_BUCKET = 'recipe-images';

// Edge function URL for OCR
const OCR_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/ocr-recipe`;

