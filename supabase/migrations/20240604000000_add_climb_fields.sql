-- Add missing fields to climbs table for full feature support

-- 1. Add physical_skills array field
ALTER TABLE public.climbs 
ADD COLUMN IF NOT EXISTS physical_skills TEXT[] DEFAULT '{}';

-- 2. Add technical_skills array field
ALTER TABLE public.climbs 
ADD COLUMN IF NOT EXISTS technical_skills TEXT[] DEFAULT '{}';

-- 3. Add effort field (perceived effort rating 1-10)
ALTER TABLE public.climbs 
ADD COLUMN IF NOT EXISTS effort INTEGER CHECK (effort >= 1 AND effort <= 10);

-- 4. Add height field (height in feet)
ALTER TABLE public.climbs 
ADD COLUMN IF NOT EXISTS height NUMERIC(6,2);

-- 5. Add time_on_wall field (time in minutes)
ALTER TABLE public.climbs 
ADD COLUMN IF NOT EXISTS time_on_wall INTEGER;

-- 6. Create indexes for better query performance on array fields
CREATE INDEX IF NOT EXISTS idx_climbs_physical_skills ON public.climbs USING GIN (physical_skills);
CREATE INDEX IF NOT EXISTS idx_climbs_technical_skills ON public.climbs USING GIN (technical_skills);

-- 7. Add comments to document the new fields
COMMENT ON COLUMN public.climbs.physical_skills IS 'Array of physical skills used during the climb (e.g., Power, Endurance, Balance)';
COMMENT ON COLUMN public.climbs.technical_skills IS 'Array of technical skills used during the climb (e.g., Crimping, Heel Hooks, Mantling)';
COMMENT ON COLUMN public.climbs.effort IS 'Perceived effort rating from 1 (easy) to 10 (maximum effort)';
COMMENT ON COLUMN public.climbs.height IS 'Height of the climb in feet';
COMMENT ON COLUMN public.climbs.time_on_wall IS 'Time spent on the wall in minutes';