import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@^2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// --- Type Definitions ---
// Based on the subtask's refined requirements for data coming from the client.
// ExtractedClimb is assumed to be the same as in VoiceLogExtractionService.
// If VoiceLogExtractionService.ts is updated in the future, these might need to align or be imported.

interface ConfirmedSessionDetails {
  location: string;
  date: string; // YYYY-MM-DD format
  climbingType: string; // e.g., 'sport', 'boulder'
  session_notes?: string | null;
}

// Assuming ExtractedClimb structure from VoiceLogExtractionService is suitable for confirmed climbs
interface ConfirmedClimb {
  name?: string;
  grade: string;
  tick_type: 'send' | 'attempt' | 'flash' | 'onsight' | 'unknown';
  attempts?: number;
  climb_notes?: string;
  skills?: string[];
}

interface ConfirmedVoiceLogData {
  session_details: ConfirmedSessionDetails;
  climbs: ConfirmedClimb[];
}

interface RequestBody {
  preview_id: string;
  confirmed_data: ConfirmedVoiceLogData;
}

// Database table types (simplified, ensure these match your actual schema)
interface ClimbingSessionInsert {
  user_id: string;
  date: string; // YYYY-MM-DD
  location: string;
  default_climb_type: string;
  notes?: string | null;
}

interface ClimbInsert {
  user_id: string;
  session_id: string; // UUID from climbing_sessions
  name: string;
  grade: string;
  type: string; // from session's climbingType
  send_type: string; // mapped from tick_type
  attempts: number;
  notes?: string | null;
  date: string; // from session's date
  skills?: string[];
}


const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-url, x-supabase-anon-key',
  'Access-Control-Allow-Methods': 'PUT, OPTIONS',
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

    if (req.method !== 'PUT') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const body: RequestBody = await req.json();
    const { preview_id, confirmed_data } = body;

    if (!preview_id || !confirmed_data) {
      return new Response(JSON.stringify({ error: 'Missing preview_id or confirmed_data' }), {
        status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Basic validation of confirmed_data structure
    if (!confirmed_data.session_details || typeof confirmed_data.session_details.location !== 'string' ||
        typeof confirmed_data.session_details.date !== 'string' || typeof confirmed_data.session_details.climbingType !== 'string' ||
        !Array.isArray(confirmed_data.climbs)) {
      return new Response(JSON.stringify({ error: 'Invalid confirmed_data structure' }), {
        status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }
    // Add more specific validation for climbs array content if necessary

    // Fetch the voice_log_previews record
    const { data: preview, error: fetchError } = await supabaseClient
      .from('voice_log_previews')
      .select('user_id, status')
      .eq('id', preview_id)
      .single();

    if (fetchError || !preview) {
      return new Response(JSON.stringify({ error: 'Preview log not found' }), {
        status: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    if (preview.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden: Preview log does not belong to user' }), {
        status: 403, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    if (preview.status !== 'pending_review') {
      return new Response(JSON.stringify({ error: `Preview log status is '${preview.status}', not 'pending_review'. Already processed or failed.` }), {
        status: 409, // Conflict
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // 6. Create Main Records
    // ** Create Session **
    const sessionToInsert: ClimbingSessionInsert = {
      user_id: user.id,
      date: confirmed_data.session_details.date,
      location: confirmed_data.session_details.location,
      default_climb_type: confirmed_data.session_details.climbingType,
      notes: confirmed_data.session_details.session_notes,
    };
    const { data: newSession, error: sessionInsertError } = await supabaseClient
      .from('climbing_sessions')
      .insert(sessionToInsert)
      .select('id')
      .single();

    if (sessionInsertError || !newSession) {
      console.error('Session insert error:', sessionInsertError);
      throw new Error(`Failed to create climbing session: ${sessionInsertError?.message}`);
    }
    const sessionId = newSession.id;

    // ** Create Climbs **
    const climbsToInsert: ClimbInsert[] = confirmed_data.climbs.map(climb => ({
      user_id: user.id,
      session_id: sessionId,
      name: climb.name || 'Unnamed Climb',
      grade: climb.grade,
      type: confirmed_data.session_details.climbingType, // Use session's climbing type
      send_type: climb.tick_type, // Direct mapping, ensure values align with ENUM if used
      attempts: climb.attempts === undefined || climb.attempts === null ? 1 : climb.attempts,
      notes: climb.climb_notes,
      date: confirmed_data.session_details.date, // Use session's date
      skills: climb.skills || [],
    }));

    if (climbsToInsert.length > 0) {
      const { error: climbsInsertError } = await supabaseClient
        .from('climbs')
        .insert(climbsToInsert);

      if (climbsInsertError) {
        console.error('Climbs insert error:', climbsInsertError);
        // Attempt to delete the already created session for some atomicity
        await supabaseClient.from('climbing_sessions').delete().eq('id', sessionId);
        throw new Error(`Failed to create climbs: ${climbsInsertError.message}. Session creation rolled back.`);
      }
    }

    // 7. Update voice_log_previews Record
    const { error: previewUpdateError } = await supabaseClient
      .from('voice_log_previews')
      .update({ status: 'confirmed', extracted_data_json: confirmed_data as any }) // Store confirmed data as well
      .eq('id', preview_id);

    if (previewUpdateError) {
      // This is not ideal, as main records are created. Log and perhaps alert.
      console.error('Failed to update preview log status to confirmed:', previewUpdateError);
      // Don't throw, as the main operation succeeded.
    }

    // 8. Response
    return new Response(JSON.stringify({
        message: 'Voice log confirmed and processed successfully.',
        session_id: sessionId
    }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    console.error('Overall error in Edge Function:', error.message, error.stack);
    let statusCode = 500;
    if (error.message.includes('Unauthorized')) statusCode = 401;
    else if (error.message.includes('Method not allowed')) statusCode = 405;
    else if (error.message.includes('Missing') || error.message.includes('Invalid')) statusCode = 400;
    else if (error.message.includes('Preview log not found')) statusCode = 404;
    else if (error.message.includes('Forbidden')) statusCode = 403;
    else if (error.message.includes('not \'pending_review\'')) statusCode = 409;


    return new Response(JSON.stringify({ error: error.message }), {
      status: statusCode,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
