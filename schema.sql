-- Create the voice_log_previews table
CREATE TABLE public.voice_log_previews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    original_audio_filename TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    transcript_text TEXT,
    extracted_data_json JSONB,
    status TEXT NOT NULL DEFAULT 'pending_upload',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row update
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.voice_log_previews
FOR EACH ROW
EXECUTE PROCEDURE public.trigger_set_timestamp();

-- Enable RLS for the voice_log_previews table
ALTER TABLE public.voice_log_previews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for voice_log_previews

-- Users can select their own records
CREATE POLICY "Allow select own records"
ON public.voice_log_previews
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own records
CREATE POLICY "Allow insert own records"
ON public.voice_log_previews
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own records
CREATE POLICY "Allow update own records"
ON public.voice_log_previews
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own records
CREATE POLICY "Allow delete own records"
ON public.voice_log_previews
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for voice_uploads bucket

-- Users can select files they own
CREATE POLICY "Allow select own files in voice_uploads"
ON storage.objects
FOR SELECT
USING (bucket_id = 'voice_uploads' AND auth.uid() = owner);

-- Users can insert files they own
CREATE POLICY "Allow insert own files in voice_uploads"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'voice_uploads' AND auth.uid() = owner);

-- Users can update files they own
CREATE POLICY "Allow update own files in voice_uploads"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'voice_uploads' AND auth.uid() = owner)
WITH CHECK (bucket_id = 'voice_uploads' AND auth.uid() = owner);

-- Users can delete files they own
CREATE POLICY "Allow delete own files in voice_uploads"
ON storage.objects
FOR DELETE
USING (bucket_id = 'voice_uploads' AND auth.uid() = owner);
