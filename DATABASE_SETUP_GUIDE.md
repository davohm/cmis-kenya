# CMIS Database Setup Guide

## Quick Setup (5 minutes)

Your app is fully built and ready - we just need to initialize the database!

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project (the one with URL: `https://aeclmmvteaegnxxjvpjr.supabase.co`)
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run the Migration

1. Open the file `supabase/migrations/20251008214435_001_initial_cmis_schema.sql` in this project
2. **Copy all the contents** (it's a long file - make sure you get everything)
3. **Paste** into the Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)

This will create:
- ✅ 25 database tables for all 17 cooperative services
- ✅ Row Level Security policies
- ✅ All necessary enums and types

### Step 3: Create Demo Users

After running the migration, run this second SQL to create demo accounts:

```sql
-- Insert demo tenants (National HQ + sample counties)
INSERT INTO tenants (id, name, type, county_code, is_active) VALUES
  ('00000000-0000-0000-0000-000000000001', 'National Headquarters', 'NATIONAL_HQ', 'HQ', true),
  ('00000000-0000-0000-0000-000000000002', 'Nairobi County', 'COUNTY', '047', true),
  ('00000000-0000-0000-0000-000000000003', 'Mombasa County', 'COUNTY', '001', true)
ON CONFLICT (id) DO NOTHING;

-- Insert cooperative types
INSERT INTO cooperative_types (id, name, category, description) VALUES
  ('10000000-0000-0000-0000-000000000001', 'SACCO', 'SACCO', 'Savings and Credit Cooperative'),
  ('10000000-0000-0000-0000-000000000002', 'Agricultural Cooperative', 'AGRICULTURAL', 'Agricultural and farming cooperatives'),
  ('10000000-0000-0000-0000-000000000003', 'Housing Cooperative', 'HOUSING', 'Housing and real estate cooperatives')
ON CONFLICT (id) DO NOTHING;
```

### Step 4: Create Storage Bucket

1. Go to **Storage** in Supabase sidebar
2. Click **Create bucket**
3. Name it: `registration-documents`
4. Make it **Private** (RLS enabled)
5. Click **Save**

Then run this SQL to set up storage policies:

```sql
-- Storage policies (run in SQL Editor)
INSERT INTO storage.buckets (id, name, public) VALUES ('registration-documents', 'registration-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Users can upload documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'registration-documents');

-- Allow users to read their own documents
CREATE POLICY "Users can read own documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'registration-documents');
```

### Step 5: Create Your First User

1. Go to **Authentication** > **Users** in Supabase
2. Click **Add user** > **Create new user**
3. Enter:
   - Email: `admin@cmis.go.ke`
   - Password: `Admin@2024`
   - Auto-confirm user: ✅ (check this box)
4. Click **Create user**

Then add the user to your database:

```sql
-- Replace USER_ID_HERE with the actual ID from the Users page
INSERT INTO users (id, email, full_name, tenant_id, is_active) VALUES
  ('USER_ID_HERE', 'admin@cmis.go.ke', 'Super Admin', '00000000-0000-0000-0000-000000000001', true);

INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES
  ('USER_ID_HERE', '00000000-0000-0000-0000-000000000001', 'SUPER_ADMIN', true);
```

## ✅ You're Done!

Now you can:
1. Refresh your app
2. Click "Sign In"
3. Login with `admin@cmis.go.ke` / `Admin@2024`
4. Access all features as Super Admin!

---

## Need Help?

If you encounter any errors:
1. Check the Supabase logs for detailed error messages
2. Make sure you copied the entire migration SQL
3. Verify the storage bucket was created successfully
