import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@^2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

interface RequestBody {
  preview_id: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-url, x-supabase-anon-key',
  'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  let supabaseClient: SupabaseClient;

  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization) {
      throw new Error('Missing Authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? req.headers.get('X-Supabase-Url');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? req.headers.get('X-Supabase-Anon-Key');

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase URL or Anon Key is missing.');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authorization } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    if (req.method !== 'DELETE') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const body: RequestBody = await req.json();
    const { preview_id } = body;

    if (!preview_id) {
      return new Response(JSON.stringify({ error: 'Missing preview_id in request body' }), {
        status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // 5. Fetch the voice_log_previews record to verify ownership and get storage_path
    const { data: preview, error: fetchError } = await supabaseClient
      .from('voice_log_previews')
      .select('user_id, storage_path')
      .eq('id', preview_id)
      .single();

    if (fetchError) {
      // PGRST116: "Query result returned no rows"
      if (fetchError.code === 'PGRST116') {
        return new Response(JSON.stringify({ error: 'Preview log not found' }), {
          status: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }
      console.error('Error fetching preview log:', fetchError);
      throw new Error(`Error fetching preview log: ${fetchError.message}`);
    }

    if (!preview) { // Should be caught by PGRST116, but as a fallback
        return new Response(JSON.stringify({ error: 'Preview log not found' }), {
            status: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
    }

    if (preview.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden: Preview log does not belong to user' }), {
        status: 403, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // 6. Delete voice_log_previews Record
    const { error: deleteDbError } = await supabaseClient
      .from('voice_log_previews')
      .delete()
      .eq('id', preview_id)
      .eq('user_id', user.id); // Ensure user_id match again for safety

    if (deleteDbError) {
      console.error('Error deleting database record:', deleteDbError);
      throw new Error(`Failed to delete voice log preview record: ${deleteDbError.message}`);
    }

    // Optional: Delete associated audio file from storage
    if (preview.storage_path) {
      const { error: deleteStorageError } = await supabaseClient.storage
        .from('voice_uploads') // Make sure this is your correct bucket name
        .remove([preview.storage_path]);

      if (deleteStorageError) {
        // Log this error but don't fail the whole request, as the DB record is deleted.
        // The user might see the item disappear, but the file remains.
        // A separate cleanup process or manual deletion might be needed for orphaned files.
        console.warn(`Failed to delete storage file '${preview.storage_path}': ${deleteStorageError.message}`);
      }
    } else {
        console.warn(`No storage_path found for preview ID ${preview_id}, cannot delete file from storage.`);
    }

    // 7. Response
    return new Response(JSON.stringify({ message: 'Voice log preview discarded successfully.' }), {
      status: 200, // Or 204 No Content, but 200 with message is also common
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    console.error('Overall error in Edge Function:', error.message, error.stack);
    let statusCode = 500;
    if (error.message.includes('Unauthorized')) statusCode = 401;
    else if (error.message.includes('Method not allowed')) statusCode = 405;
    else if (error.message.includes('Missing preview_id')) statusCode = 400;
    else if (error.message.includes('Preview log not found')) statusCode = 404;
    else if (error.message.includes('Forbidden')) statusCode = 403;

    return new Response(JSON.stringify({ error: error.message }), {
      status: statusCode,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
