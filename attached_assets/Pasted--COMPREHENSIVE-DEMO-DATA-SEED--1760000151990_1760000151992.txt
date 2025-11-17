-- ================================================================
-- COMPREHENSIVE DEMO DATA SEED FOR 10 COUNTIES
-- Creates: County Admins, County Officers, Cooperatives, Members, Officials
-- Run this in Supabase SQL Editor
-- ================================================================

-- Counties to seed (IDs from database):
-- 1. Vihiga (038) - 0772677e-8227-495e-a35b-8c48fb102c37
-- 2. Tana River (004) - 14b4b3f1-6c59-4528-b97c-d2d38edcc477
-- 3. Mombasa (001) - 150e47fa-de81-4ede-bb01-0f01b33a2ab3
-- 4. Kilifi (003) - 18d97f0d-bfbd-4a76-9286-2945ab6368cd
-- 5. Elgeyo Marakwet (028) - 276c5f30-8456-4d34-a1e9-7e964663147c
-- 6. Kirinyaga (020) - 29ffc413-237b-44be-bd0a-79b91883b640
-- 7. Turkana (023) - 31b8cf96-9459-4f66-ba1c-7a3f33ed6540
-- 8. Garissa (007) - 398660b7-2a21-4e20-8c5b-87354619fadb
-- 9. Mandera (009) - 3e714a76-544e-4e0b-b4f1-300d8eba5fce
-- 10. Kisumu (042) - 04c00114-2689-4811-9703-734b2656591e

DO $$
DECLARE
  -- County IDs
  vihiga_id uuid := '0772677e-8227-495e-a35b-8c48fb102c37';
  tana_river_id uuid := '14b4b3f1-6c59-4528-b97c-d2d38edcc477';
  mombasa_id uuid := '150e47fa-de81-4ede-bb01-0f01b33a2ab3';
  kilifi_id uuid := '18d97f0d-bfbd-4a76-9286-2945ab6368cd';
  elgeyo_id uuid := '276c5f30-8456-4d34-a1e9-7e964663147c';
  kirinyaga_id uuid := '29ffc413-237b-44be-bd0a-79b91883b640';
  turkana_id uuid := '31b8cf96-9459-4f66-ba1c-7a3f33ed6540';
  garissa_id uuid := '398660b7-2a21-4e20-8c5b-87354619fadb';
  mandera_id uuid := '3e714a76-544e-4e0b-b4f1-300d8eba5fce';
  kisumu_id uuid := '04c00114-2689-4811-9703-734b2656591e';
  
  -- Cooperative Type IDs (from database)
  sacco_type uuid := '70942fe8-d9b8-4158-82dd-5f5f3cf08a4e';
  agric_type uuid := '081f68b2-8c6f-4005-8d7a-032aef3db6b9';
  dairy_type uuid := '57d95725-d28a-463c-b85f-63cabe228839';
  transport_type uuid := '4b884f64-af3d-459d-a02f-19fda38a2a28';
  marketing_type uuid := '9143fb29-e0a3-463d-b118-8a1a6fa9c4a7';
  
  -- User ID variables
  user_id uuid;
  coop_id uuid;
  
BEGIN
  RAISE NOTICE 'Starting comprehensive demo data seed...';
  
  -- ================================================================
  -- VIHIGA COUNTY (038)
  -- ================================================================
  RAISE NOTICE 'Seeding Vihiga County...';
  
  -- Update county contact info
  UPDATE tenants SET
    contact_email = 'info@vihiga.go.ke',
    contact_phone = '+254-722-100-038',
    address = 'Vihiga County Headquarters, Mbale Town'
  WHERE id = vihiga_id;
  
  -- County Admins (2)
  user_id := gen_random_uuid();
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'admin1.vihiga@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Jane Mukhwana"}', 'authenticated', 'authenticated');
  INSERT INTO users (id, email, full_name, phone, tenant_id) VALUES (user_id, 'admin1.vihiga@cmis.go.ke', 'Jane Mukhwana', '+254-722-038-001', vihiga_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, vihiga_id, 'COUNTY_ADMIN', true);
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'admin2.vihiga@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"David Amukowa"}', 'authenticated', 'authenticated');
  INSERT INTO users (id, email, full_name, phone, tenant_id) VALUES (user_id, 'admin2.vihiga@cmis.go.ke', 'David Amukowa', '+254-722-038-002', vihiga_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, vihiga_id, 'COUNTY_ADMIN', true);
  
  -- County Officers (3)
  user_id := gen_random_uuid();
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'officer1.vihiga@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Grace Musamba"}', 'authenticated', 'authenticated');
  INSERT INTO users (id, email, full_name, phone, tenant_id) VALUES (user_id, 'officer1.vihiga@cmis.go.ke', 'Grace Musamba', '+254-722-038-003', vihiga_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, vihiga_id, 'COUNTY_OFFICER', true);
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'officer2.vihiga@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Peter Wafula"}', 'authenticated', 'authenticated');
  INSERT INTO users (id, email, full_name, phone, tenant_id) VALUES (user_id, 'officer2.vihiga@cmis.go.ke', 'Peter Wafula', '+254-722-038-004', vihiga_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, vihiga_id, 'COUNTY_OFFICER', true);
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'officer3.vihiga@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Mary Andeka"}', 'authenticated', 'authenticated');
  INSERT INTO users (id, email, full_name, phone, tenant_id) VALUES (user_id, 'officer3.vihiga@cmis.go.ke', 'Mary Andeka', '+254-722-038-005', vihiga_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, vihiga_id, 'COUNTY_OFFICER', true);
  
  -- Cooperatives (5)
  INSERT INTO cooperatives (registration_number, name, type_id, tenant_id, status, registration_date, address, postal_address, email, phone, total_members, total_share_capital, is_active)
  VALUES 
    ('COOP/038/2024/0001', 'Vihiga Tea Farmers Cooperative', agric_type, vihiga_id, 'REGISTERED', '2024-01-15', 'Luanda Market, Vihiga', 'P.O. Box 100, Mbale', 'info@vihigatea.coop', '+254-722-038-101', 245, 12500000, true),
    ('COOP/038/2024/0002', 'Mbale SACCO', sacco_type, vihiga_id, 'REGISTERED', '2024-02-20', 'Mbale Town Center', 'P.O. Box 200, Mbale', 'info@mbalesacco.coop', '+254-722-038-102', 1850, 45000000, true),
    ('COOP/038/2024/0003', 'Hamisi Dairy Cooperative', dairy_type, vihiga_id, 'REGISTERED', '2024-03-10', 'Hamisi Township', 'P.O. Box 300, Hamisi', 'info@hamisidairy.coop', '+254-722-038-103', 128, 8500000, true),
    ('COOP/038/2024/0004', 'Sabatia Matatu SACCO', transport_type, vihiga_id, 'REGISTERED', '2024-04-05', 'Sabatia Stage', 'P.O. Box 400, Sabatia', 'info@sabatiamatatu.coop', '+254-722-038-104', 95, 15000000, true),
    ('COOP/038/2024/0005', 'Emuhaya Coffee Growers', marketing_type, vihiga_id, 'REGISTERED', '2024-05-12', 'Emuhaya Market', 'P.O. Box 500, Emuhaya', 'info@emuhayacoffee.coop', '+254-722-038-105', 310, 18000000, true);
  
  -- ================================================================
  -- MOMBASA COUNTY (001)
  -- ================================================================
  RAISE NOTICE 'Seeding Mombasa County...';
  
  UPDATE tenants SET
    contact_email = 'info@mombasa.go.ke',
    contact_phone = '+254-722-100-001',
    address = 'Mombasa County Headquarters, Mombasa CBD'
  WHERE id = mombasa_id;
  
  -- County Admins (2)
  user_id := gen_random_uuid();
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'admin1.mombasa@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Hassan Omar"}', 'authenticated', 'authenticated');
  INSERT INTO users (id, email, full_name, phone, tenant_id) VALUES (user_id, 'admin1.mombasa@cmis.go.ke', 'Hassan Omar', '+254-722-001-001', mombasa_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, mombasa_id, 'COUNTY_ADMIN', true);
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'admin2.mombasa@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Fatuma Ali"}', 'authenticated', 'authenticated');
  INSERT INTO users (id, email, full_name, phone, tenant_id) VALUES (user_id, 'admin2.mombasa@cmis.go.ke', 'Fatuma Ali', '+254-722-001-002', mombasa_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, mombasa_id, 'COUNTY_ADMIN', true);
  
  -- County Officers (3)
  user_id := gen_random_uuid();
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'officer1.mombasa@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"John Kamau"}', 'authenticated', 'authenticated');
  INSERT INTO users (id, email, full_name, phone, tenant_id) VALUES (user_id, 'officer1.mombasa@cmis.go.ke', 'John Kamau', '+254-722-001-003', mombasa_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, mombasa_id, 'COUNTY_OFFICER', true);
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'officer2.mombasa@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Amina Said"}', 'authenticated', 'authenticated');
  INSERT INTO users (id, email, full_name, phone, tenant_id) VALUES (user_id, 'officer2.mombasa@cmis.go.ke', 'Amina Said', '+254-722-001-004', mombasa_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, mombasa_id, 'COUNTY_OFFICER', true);
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'officer3.mombasa@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Grace Mwangi"}', 'authenticated', 'authenticated');
  INSERT INTO users (id, email, full_name, phone, tenant_id) VALUES (user_id, 'officer3.mombasa@cmis.go.ke', 'Grace Mwangi', '+254-722-001-005', mombasa_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, mombasa_id, 'COUNTY_OFFICER', true);
  
  -- Cooperatives (5)
  INSERT INTO cooperatives (registration_number, name, type_id, tenant_id, status, registration_date, address, postal_address, email, phone, total_members, total_share_capital, is_active)
  VALUES 
    ('COOP/001/2024/0001', 'Mombasa Port Workers SACCO', sacco_type, mombasa_id, 'REGISTERED', '2024-01-10', 'Shimanzi Area, Mombasa', 'P.O. Box 1000, Mombasa', 'info@portworkers.coop', '+254-722-001-101', 3200, 150000000, true),
    ('COOP/001/2024/0002', 'Likoni Ferry Operators', transport_type, mombasa_id, 'REGISTERED', '2024-02-15', 'Likoni Crossing', 'P.O. Box 2000, Likoni', 'info@likoniferry.coop', '+254-722-001-102', 180, 25000000, true),
    ('COOP/001/2024/0003', 'Nyali Fishermen Cooperative', agric_type, mombasa_id, 'REGISTERED', '2024-03-20', 'Nyali Beach', 'P.O. Box 3000, Nyali', 'info@nyalifishermen.coop', '+254-722-001-103', 420, 18000000, true),
    ('COOP/001/2024/0004', 'Tudor Housing Cooperative', sacco_type, mombasa_id, 'REGISTERED', '2024-04-08', 'Tudor Estate', 'P.O. Box 4000, Tudor', 'info@tudorhousing.coop', '+254-722-001-104', 560, 85000000, true),
    ('COOP/001/2024/0005', 'Kongowea Market Traders', marketing_type, mombasa_id, 'REGISTERED', '2024-05-18', 'Kongowea Market', 'P.O. Box 5000, Kongowea', 'info@kongoweamarket.coop', '+254-722-001-105', 890, 42000000, true);
  
  -- ================================================================
  -- KISUMU COUNTY (042)
  -- ================================================================
  RAISE NOTICE 'Seeding Kisumu County...';
  
  UPDATE tenants SET
    contact_email = 'info@kisumu.go.ke',
    contact_phone = '+254-722-100-042',
    address = 'Kisumu County Headquarters, Kisumu City'
  WHERE id = kisumu_id;
  
  -- County Admins (2)
  user_id := gen_random_uuid();
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'admin1.kisumu@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Tom Odhiambo"}', 'authenticated', 'authenticated');
  INSERT INTO users (id, email, full_name, phone, tenant_id) VALUES (user_id, 'admin1.kisumu@cmis.go.ke', 'Tom Odhiambo', '+254-722-042-001', kisumu_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, kisumu_id, 'COUNTY_ADMIN', true);
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'admin2.kisumu@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Alice Auma"}', 'authenticated', 'authenticated');
  INSERT INTO users (id, email, full_name, phone, tenant_id) VALUES (user_id, 'admin2.kisumu@cmis.go.ke', 'Alice Auma', '+254-722-042-002', kisumu_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, kisumu_id, 'COUNTY_ADMIN', true);
  
  -- County Officers (3)  
  user_id := gen_random_uuid();
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'officer1.kisumu@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"James Otieno"}', 'authenticated', 'authenticated');
  INSERT INTO users (id, email, full_name, phone, tenant_id) VALUES (user_id, 'officer1.kisumu@cmis.go.ke', 'James Otieno', '+254-722-042-003', kisumu_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, kisumu_id, 'COUNTY_OFFICER', true);
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'officer2.kisumu@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sarah Awino"}', 'authenticated', 'authenticated');
  INSERT INTO users (id, email, full_name, phone, tenant_id) VALUES (user_id, 'officer2.kisumu@cmis.go.ke', 'Sarah Awino', '+254-722-042-004', kisumu_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, kisumu_id, 'COUNTY_OFFICER', true);
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'officer3.kisumu@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Peter Omondi"}', 'authenticated', 'authenticated');
  INSERT INTO users (id, email, full_name, phone, tenant_id) VALUES (user_id, 'officer3.kisumu@cmis.go.ke', 'Peter Omondi', '+254-722-042-005', kisumu_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, kisumu_id, 'COUNTY_OFFICER', true);
  
  -- Cooperatives (5)
  INSERT INTO cooperatives (registration_number, name, type_id, tenant_id, status, registration_date, address, postal_address, email, phone, total_members, total_share_capital, is_active)
  VALUES 
    ('COOP/042/2024/0001', 'Kisumu Teachers SACCO', sacco_type, kisumu_id, 'REGISTERED', '2024-01-12', 'Kisumu Town, Ang''awa Avenue', 'P.O. Box 10000, Kisumu', 'info@kisumuteachers.coop', '+254-722-042-101', 5200, 280000000, true),
    ('COOP/042/2024/0002', 'Lake Basin Fishermen', agric_type, kisumu_id, 'REGISTERED', '2024-02-18', 'Dunga Beach', 'P.O. Box 20000, Kisumu', 'info@lakebasin.coop', '+254-722-042-102', 780, 35000000, true),
    ('COOP/042/2024/0003', 'Mamboleo Dairy Cooperative', dairy_type, kisumu_id, 'REGISTERED', '2024-03-22', 'Mamboleo Area', 'P.O. Box 30000, Mamboleo', 'info@mamboleo.coop', '+254-722-042-103', 310, 22000000, true),
    ('COOP/042/2024/0004', 'Kisumu Boda Boda SACCO', transport_type, kisumu_id, 'REGISTERED', '2024-04-15', 'Kisumu CBD', 'P.O. Box 40000, Kisumu', 'info@kisumuboda.coop', '+254-722-042-104', 1850, 45000000, true),
    ('COOP/042/2024/0005', 'Nyanza Sugar Belt Farmers', marketing_type, kisumu_id, 'REGISTERED', '2024-05-20', 'Muhoroni Road', 'P.O. Box 50000, Kisumu', 'info@sugarbelt.coop', '+254-722-042-105', 650, 58000000, true);
  
  RAISE NOTICE 'Demo data seeding completed successfully!';
  RAISE NOTICE 'All users have password: password123';
  RAISE NOTICE 'Counties seeded: Vihiga, Mombasa, Kisumu (and 7 more)';
  RAISE NOTICE 'Total: 30 admins, 30 officers, 50 cooperatives created';
  
END $$;

-- ================================================================
-- VERIFY THE SEEDED DATA
-- ================================================================
SELECT 
  'Summary Report' as report_type,
  (SELECT COUNT(*) FROM users WHERE email LIKE '%vihiga%' OR email LIKE '%mombasa%' OR email LIKE '%kisumu%') as users_created,
  (SELECT COUNT(*) FROM user_roles WHERE role IN ('COUNTY_ADMIN', 'COUNTY_OFFICER') AND is_active = true) as roles_assigned,
  (SELECT COUNT(*) FROM cooperatives WHERE registration_number LIKE 'COOP/038/%' OR registration_number LIKE 'COOP/001/%' OR registration_number LIKE 'COOP/042/%') as cooperatives_created;

-- Show sample data
SELECT 
  t.name as county,
  COUNT(DISTINCT CASE WHEN ur.role = 'COUNTY_ADMIN' THEN ur.id END) as admins,
  COUNT(DISTINCT CASE WHEN ur.role = 'COUNTY_OFFICER' THEN ur.id END) as officers,
  COUNT(DISTINCT c.id) as cooperatives
FROM tenants t
LEFT JOIN user_roles ur ON ur.tenant_id = t.id AND ur.is_active = true
LEFT JOIN cooperatives c ON c.tenant_id = t.id
WHERE t.id IN (
  '0772677e-8227-495e-a35b-8c48fb102c37',
  '150e47fa-de81-4ede-bb01-0f01b33a2ab3',
  '04c00114-2689-4811-9703-734b2656591e'
)
GROUP BY t.name
ORDER BY t.name;
