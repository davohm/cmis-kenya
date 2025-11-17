-- ================================================================
-- CHECK IF COUNTIES EXIST IN SUPABASE
-- Run this in Supabase SQL Editor FIRST before running seed scripts
-- ================================================================

-- Check if the required counties exist
SELECT 
  id, 
  name, 
  county_code,
  is_active
FROM tenants 
WHERE id IN (
  '0772677e-8227-495e-a35b-8c48fb102c37',  -- Vihiga
  '150e47fa-de81-4ede-bb01-0f01b33a2ab3',  -- Mombasa
  '04c00114-2689-4811-9703-734b2656591e'   -- Kisumu
)
ORDER BY county_code;

-- If you get 0 rows, the counties don't exist yet!
-- Expected: 3 rows (Vihiga, Mombasa, Kisumu)
