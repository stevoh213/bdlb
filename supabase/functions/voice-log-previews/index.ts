import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@^2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'; // Using a specific version for stability

// Define a simple type for the expected database row, matching schema.sql
// This can be expanded or imported from a shared types file if one exists.
interface VoiceLogPreview {
  id: string; // UUID
  user_id: string;
  original_audio_filename: string;
  storage_path: string;
  transcript_text?: string; // It might be null or not selected in some cases
  extracted_data_json?: any; // JSONB
  status: 'pending_upload' | 'pending_processing' | 'pending_review' | 'processing_failed' | 'confirmed' | 'archived';
  error_message?: string;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // Permissive for now
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-url, x-supabase-anon-key',
  'Access-Control-Allow-Methods': 'GET, OPTIONS', // Allow GET and OPTIONS
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization) {
      throw new Error('Missing Authorization header');
    }

    // Create Supabase client with the user's context
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? req.headers.get('X-Supabase-Url');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? req.headers.get('X-Supabase-Anon-Key');

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Supabase URL or Anon Key is missing.');
        return new Response(JSON.stringify({ error: 'Server configuration error: Supabase credentials missing.' }), {
            status: 500,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
    }

    const supabaseClient: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authorization } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('User auth error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized: ' + (userError?.message || 'User not found') }), {
        status: 401,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    if (req.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed. Only GET is accepted.' }), {
        status: 405,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // 5. Fetch Data
    // Filter by user_id (must match the authenticated user).
    // Filter by status (should be 'pending_review' or 'processing_failed').
    // Order by created_at descending.
    const { data: previews, error: queryError } = await supabaseClient
      .from('voice_log_previews')
      .select('*') // Select all columns for now
      .eq('user_id', user.id)
      .in('status', ['pending_review', 'processing_failed'])
      .order('created_at', { ascending: false });

    if (queryError) {
      console.error('Database query error:', queryError);
      throw new Error(`Failed to fetch voice log previews: ${queryError.message}`);
    }

    // 6. Response
    return new Response(JSON.stringify(previews || []), { // Return empty array if previews is null
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    console.error('Overall error in Edge Function:', error.message, error.stack);

    let statusCode = 500;
    if (error.message.includes('Unauthorized') || error.message.includes('Missing Authorization')) statusCode = 401;
    if (error.message.includes('Method not allowed')) statusCode = 405;

    return new Response(JSON.stringify({ error: error.message }), {
      status: statusCode,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
