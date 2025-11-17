# Demo Data Setup Instructions

## ⚠️ Important: Run Scripts in Correct Order

The demo data seed scripts depend on **counties** and **cooperative types** existing in your Supabase database first. Follow these steps **in order**:

---

## Step 1: Create Counties & Cooperative Types (Prerequisite)

**File:** `SEED_COUNTIES_PREREQUISITE.sql`

1. Open **Supabase SQL Editor**
2. Copy and paste the contents of `SEED_COUNTIES_PREREQUISITE.sql`
3. Click **Run**
4. **Verify**: You should see verification results showing:
   - ✅ 6 cooperative types created
   - ✅ 10 counties created

**What it does:**
- Creates 6 cooperative types (SACCO, Agricultural, Dairy, Transport, Marketing, Housing)
- Creates 10 counties needed for the demo data
- Uses exact UUIDs that the seed scripts expect
- Safe to run multiple times (uses ON CONFLICT to update if exists)

---

## Step 2: Load Part 1 Demo Data

**File:** `SEED_DEMO_DATA.sql`

1. Open **Supabase SQL Editor**
2. Copy and paste the contents of `SEED_DEMO_DATA.sql`
3. Click **Run**
4. **Verify**: Check the summary at the end showing users, roles, and cooperatives created

**What it creates:**
- **3 counties**: Vihiga, Mombasa, Kisumu
- **15 users**: 6 admins + 9 officers
- **15 cooperatives**: 5 per county
- All users have password: `password123`

---

## Step 3: Load Part 2 Demo Data

**File:** `SEED_DEMO_DATA_PART2.sql`

1. Open **Supabase SQL Editor**
2. Copy and paste the contents of `SEED_DEMO_DATA_PART2.sql`
3. Click **Run**
4. **Verify**: Check the summary showing all data created

**What it creates:**
- **7 counties**: Tana River, Kilifi, Elgeyo Marakwet, Kirinyaga, Turkana, Garissa, Mandera
- **35 users**: 14 admins + 21 officers
- **35 cooperatives**: 5 per county
- **135+ cooperative members**
- **14 registration applications**
- **35 compliance reports**

---

## Verification

After running all 3 scripts, you should have:

| Item | Count |
|------|-------|
| **Cooperative Types** | 6 |
| **Counties** | 10 |
| **County Admins** | 20 |
| **County Officers** | 30 |
| **Cooperatives** | 50 |
| **Members** | 135+ |
| **Applications** | 14 |
| **Compliance Reports** | 35 |

---

## Test the System

1. **Login to CMIS** with Super Admin:
   - Email: `hqadmin@cmis.go.ke`
   - Password: `password123`

2. **View Dashboard Stats** - Should show:
   - Total Counties: 10
   - County Staff: 50
   - Total Cooperatives: 50
   - Active Members: 135+
   - Pending Applications: 7-14
   - Share Capital: Total value

3. **Test County Management**:
   - Go to "County Management" tab
   - See all 10 counties with their admins and officers

4. **Test Cooperatives**:
   - Go to "Cooperatives" → "Management" submenu
   - See all 50 cooperatives
   - Search/filter by county, type, status

---

## Troubleshooting

### Error: "tenant_id not present in table tenants"

**Solution**: You skipped Step 1. Run `SEED_COUNTIES_PREREQUISITE.sql` first!

### Error: "type_id not present in table cooperative_types"

**Solution**: You skipped Step 1. The prerequisite script creates both counties AND cooperative types!

### Error: "duplicate key value violates unique constraint"

**Solution**: The data already exists. This is safe to ignore, or you can:
- Delete existing demo data first, OR
- Continue with existing data

### No data showing in dashboard

**Solution**: 
1. Make sure all 3 scripts ran successfully
2. Refresh your browser (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)
3. Check Supabase SQL Editor for any errors in the script output

---

## Clean Up (Optional)

If you want to remove all demo data and start fresh:

```sql
-- WARNING: This deletes all demo data!

-- Delete cooperative members
DELETE FROM cooperative_members 
WHERE cooperative_id IN (
  SELECT id FROM cooperatives 
  WHERE registration_number LIKE 'COOP/001/%' 
     OR registration_number LIKE 'COOP/003/%'
     OR registration_number LIKE 'COOP/004/%'
     OR registration_number LIKE 'COOP/007/%'
     OR registration_number LIKE 'COOP/009/%'
     OR registration_number LIKE 'COOP/020/%'
     OR registration_number LIKE 'COOP/023/%'
     OR registration_number LIKE 'COOP/028/%'
     OR registration_number LIKE 'COOP/038/%'
     OR registration_number LIKE 'COOP/042/%'
);

-- Delete compliance reports
DELETE FROM compliance_reports 
WHERE cooperative_id IN (
  SELECT id FROM cooperatives 
  WHERE registration_number LIKE 'COOP/001/%' 
     OR registration_number LIKE 'COOP/003/%'
     OR registration_number LIKE 'COOP/004/%'
     OR registration_number LIKE 'COOP/007/%'
     OR registration_number LIKE 'COOP/009/%'
     OR registration_number LIKE 'COOP/020/%'
     OR registration_number LIKE 'COOP/023/%'
     OR registration_number LIKE 'COOP/028/%'
     OR registration_number LIKE 'COOP/038/%'
     OR registration_number LIKE 'COOP/042/%'
);

-- Delete applications
DELETE FROM registration_applications 
WHERE tenant_id IN (
  SELECT id FROM tenants WHERE county_code IN 
  ('001','003','004','007','009','020','023','028','038','042')
);

-- Delete cooperatives
DELETE FROM cooperatives 
WHERE registration_number LIKE 'COOP/001/%' 
   OR registration_number LIKE 'COOP/003/%'
   OR registration_number LIKE 'COOP/004/%'
   OR registration_number LIKE 'COOP/007/%'
   OR registration_number LIKE 'COOP/009/%'
   OR registration_number LIKE 'COOP/020/%'
   OR registration_number LIKE 'COOP/023/%'
   OR registration_number LIKE 'COOP/028/%'
   OR registration_number LIKE 'COOP/038/%'
   OR registration_number LIKE 'COOP/042/%';

-- Delete user roles
DELETE FROM user_roles 
WHERE user_id IN (
  SELECT id FROM users 
  WHERE email LIKE '%@vihiga.go.ke'
     OR email LIKE '%@mombasa.go.ke'
     OR email LIKE '%@kisumu.go.ke'
     OR email LIKE '%@tanariver.go.ke'
     OR email LIKE '%@kilifi.go.ke'
     OR email LIKE '%@elgeyo.go.ke'
     OR email LIKE '%@kirinyaga.go.ke'
     OR email LIKE '%@turkana.go.ke'
     OR email LIKE '%@garissa.go.ke'
     OR email LIKE '%@mandera.go.ke'
);

-- Delete users (from public schema)
DELETE FROM users 
WHERE email LIKE '%@vihiga.go.ke'
   OR email LIKE '%@mombasa.go.ke'
   OR email LIKE '%@kisumu.go.ke'
   OR email LIKE '%@tanariver.go.ke'
   OR email LIKE '%@kilifi.go.ke'
   OR email LIKE '%@elgeyo.go.ke'
   OR email LIKE '%@kirinyaga.go.ke'
   OR email LIKE '%@turkana.go.ke'
   OR email LIKE '%@garissa.go.ke'
   OR email LIKE '%@mandera.go.ke';

-- Delete auth users (from auth schema)
DELETE FROM auth.users 
WHERE email LIKE '%@vihiga.go.ke'
   OR email LIKE '%@mombasa.go.ke'
   OR email LIKE '%@kisumu.go.ke'
   OR email LIKE '%@tanariver.go.ke'
   OR email LIKE '%@kilifi.go.ke'
   OR email LIKE '%@elgeyo.go.ke'
   OR email LIKE '%@kirinyaga.go.ke'
   OR email LIKE '%@turkana.go.ke'
   OR email LIKE '%@garissa.go.ke'
   OR email LIKE '%@mandera.go.ke';

-- Note: We keep the counties and cooperative types as they're part of the main system
```

---

## Summary

**Correct Order:**
1. `SEED_COUNTIES_PREREQUISITE.sql` ← Creates cooperative types & counties
2. `SEED_DEMO_DATA.sql` ← Adds data for 3 counties
3. `SEED_DEMO_DATA_PART2.sql` ← Adds data for 7 more counties

**Result:** Fully populated demo system with 6 cooperative types, 10 counties, 50 cooperatives, and all related data!

🎉 **Your CMIS demo system is now ready to use!**
