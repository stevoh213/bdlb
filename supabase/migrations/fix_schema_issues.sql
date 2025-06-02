-- Fix schema issues for climbing app

-- 1. Add missing session_id column to climbs table
ALTER TABLE public.climbs 
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.climbing_sessions(id) ON DELETE CASCADE;

-- 2. Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_climbs_session_id ON public.climbs(session_id);
CREATE INDEX IF NOT EXISTS idx_climbs_user_id ON public.climbs(user_id);

-- 3. Fix field name mismatch (rename grade_system to gradeSystem)
-- Note: This will break any existing queries using grade_system
ALTER TABLE public.climbing_sessions 
RENAME COLUMN grade_system TO "gradeSystem";

-- 4. Add RLS policies if not already present
ALTER TABLE public.climbs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.climbing_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for climbs table (if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'climbs' 
        AND policyname = 'Users can view their own climbs'
    ) THEN
        CREATE POLICY "Users can view their own climbs" ON public.climbs
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'climbs' 
        AND policyname = 'Users can insert their own climbs'
    ) THEN
        CREATE POLICY "Users can insert their own climbs" ON public.climbs
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'climbs' 
        AND policyname = 'Users can update their own climbs'
    ) THEN
        CREATE POLICY "Users can update their own climbs" ON public.climbs
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'climbs' 
        AND policyname = 'Users can delete their own climbs'
    ) THEN
        CREATE POLICY "Users can delete their own climbs" ON public.climbs
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create policies for climbing_sessions table (if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'climbing_sessions' 
        AND policyname = 'Users can view their own sessions'
    ) THEN
        CREATE POLICY "Users can view their own sessions" ON public.climbing_sessions
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'climbing_sessions' 
        AND policyname = 'Users can insert their own sessions'
    ) THEN
        CREATE POLICY "Users can insert their own sessions" ON public.climbing_sessions
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'climbing_sessions' 
        AND policyname = 'Users can update their own sessions'
    ) THEN
        CREATE POLICY "Users can update their own sessions" ON public.climbing_sessions
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'climbing_sessions' 
        AND policyname = 'Users can delete their own sessions'
    ) THEN
        CREATE POLICY "Users can delete their own sessions" ON public.climbing_sessions
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;