# Database Migrations

## Applying Migrations

To apply the migrations to your Supabase database:

### Option 1: Using Supabase CLI (Recommended)
```bash
# Make sure you're linked to your project
supabase link --project-ref your-project-ref

# Apply all migrations
supabase db push
```

### Option 2: Manual Application via Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of each migration file in order:
   - `fix_schema_issues.sql` (if not already applied)
   - `20240604_add_climb_fields.sql`
4. Execute each migration

## Migration Details

### 20240604_add_climb_fields.sql
Adds the following fields to the `climbs` table:
- `physical_skills` (TEXT[]) - Array of physical skills used
- `technical_skills` (TEXT[]) - Array of technical skills used  
- `effort` (INTEGER 1-10) - Perceived effort rating
- `height` (NUMERIC) - Height of climb in feet
- `time_on_wall` (INTEGER) - Time spent on wall in minutes

Also creates GIN indexes on the array fields for better query performance.

## After Migration

After applying the migrations, the TypeScript types have already been updated to match the new schema. The application will now:
- Save all climb fields to the database immediately when logged
- Include physical/technical skills, effort, height, and time on wall data
- Show accurate save status in toast messages

No additional code changes are needed after applying the migrations.