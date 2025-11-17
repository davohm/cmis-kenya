-- ================================================================
-- COMPREHENSIVE DEMO DATA SEED - PART 2 (Remaining 7 Counties)
-- Run this AFTER SEED_DEMO_DATA.sql
-- Enhanced with: Cooperative Members, Registration Applications, Compliance Reports
-- ================================================================

DO $$
DECLARE
  -- County IDs
  tana_river_id uuid := '14b4b3f1-6c59-4528-b97c-d2d38edcc477';
  kilifi_id uuid := '18d97f0d-bfbd-4a76-9286-2945ab6368cd';
  elgeyo_id uuid := '276c5f30-8456-4d34-a1e9-7e964663147c';
  kirinyaga_id uuid := '29ffc413-237b-44be-bd0a-79b91883b640';
  turkana_id uuid := '31b8cf96-9459-4f66-ba1c-7a3f33ed6540';
  garissa_id uuid := '398660b7-2a21-4e20-8c5b-87354619fadb';
  mandera_id uuid := '3e714a76-544e-4e0b-b4f1-300d8eba5fce';
  
  -- Cooperative Type IDs
  sacco_type uuid := '70942fe8-d9b8-4158-82dd-5f5f3cf08a4e';
  agric_type uuid := '081f68b2-8c6f-4005-8d7a-032aef3db6b9';
  dairy_type uuid := '57d95725-d28a-463c-b85f-63cabe228839';
  transport_type uuid := '4b884f64-af3d-459d-a02f-19fda38a2a28';
  marketing_type uuid := '9143fb29-e0a3-463d-b118-8a1a6fa9c4a7';
  multipurpose_type uuid := '788853ed-3646-4601-b1a5-70fe55299c66';
  
  user_id uuid;
  coop_id uuid;
  
BEGIN
  -- ================================================================
  -- TANA RIVER COUNTY (004)
  -- ================================================================
  RAISE NOTICE 'Seeding Tana River County...';
  
  UPDATE tenants SET contact_email = 'info@tanariver.go.ke', contact_phone = '+254-722-100-004', address = 'Hola Town, Tana River County' WHERE id = tana_river_id;
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'admin1.tanariver@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ahmed Hassan"}', 'authenticated', 'authenticated');
  INSERT INTO users VALUES (user_id, 'admin1.tanariver@cmis.go.ke', 'Ahmed Hassan', '+254-722-004-001', tana_river_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, tana_river_id, 'COUNTY_ADMIN', true);
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'admin2.tanariver@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Halima Abdi"}', 'authenticated', 'authenticated');
  INSERT INTO users VALUES (user_id, 'admin2.tanariver@cmis.go.ke', 'Halima Abdi', '+254-722-004-002', tana_river_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, tana_river_id, 'COUNTY_ADMIN', true);
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'officer1.tanariver@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Fatuma Mohamed"}', 'authenticated', 'authenticated');
  INSERT INTO users VALUES (user_id, 'officer1.tanariver@cmis.go.ke', 'Fatuma Mohamed', '+254-722-004-003', tana_river_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, tana_river_id, 'COUNTY_OFFICER', true);
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'officer2.tanariver@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ali Ibrahim"}', 'authenticated', 'authenticated');
  INSERT INTO users VALUES (user_id, 'officer2.tanariver@cmis.go.ke', 'Ali Ibrahim', '+254-722-004-004', tana_river_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, tana_river_id, 'COUNTY_OFFICER', true);
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'officer3.tanariver@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Zainab Said"}', 'authenticated', 'authenticated');
  INSERT INTO users VALUES (user_id, 'officer3.tanariver@cmis.go.ke', 'Zainab Said', '+254-722-004-005', tana_river_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, tana_river_id, 'COUNTY_OFFICER', true);
  
  -- Cooperative 1: Hola SACCO
  INSERT INTO cooperatives (registration_number, name, type_id, tenant_id, status, registration_date, address, postal_address, email, phone, total_members, total_share_capital, is_active)
  VALUES ('COOP/004/2024/0001', 'Hola SACCO', sacco_type, tana_river_id, 'REGISTERED', '2024-01-20', 'Hola Town Center', 'P.O. Box 100, Hola', 'info@holasacco.coop', '+254-722-004-101', 420, 15000000, true)
  RETURNING id INTO coop_id;
  
  INSERT INTO cooperative_members (cooperative_id, member_number, full_name, id_number, phone, shares_owned, share_value, date_joined, is_active)
  VALUES 
    (coop_id, 'MEM/004/0001', 'Hussein Abdullahi', '123456001', '+254-722-500-001', 450, 800, '2024-02-10', true),
    (coop_id, 'MEM/004/0002', 'Amina Sheikh', '123456002', '+254-722-500-002', 320, 750, '2024-03-15', true),
    (coop_id, 'MEM/004/0003', 'Omar Farah', '123456003', '+254-722-500-003', 580, 900, '2024-01-25', true),
    (coop_id, 'MEM/004/0004', 'Fatima Ali', '123456004', '+254-722-500-004', 210, 650, '2024-04-08', true);
  
  INSERT INTO compliance_reports (report_number, cooperative_id, financial_year, agm_held, agm_date, bylaws_compliant, meetings_compliant, records_compliant, financial_compliant, status, compliance_score, submitted_at)
  VALUES ('COMP/004/2024/0001', coop_id, 2024, true, '2024-08-15', true, true, true, true, 'SUBMITTED', 92, '2024-09-01');
  
  -- Cooperative 2: Tana Delta Farmers
  INSERT INTO cooperatives (registration_number, name, type_id, tenant_id, status, registration_date, address, postal_address, email, phone, total_members, total_share_capital, is_active)
  VALUES ('COOP/004/2024/0002', 'Tana Delta Farmers', agric_type, tana_river_id, 'REGISTERED', '2024-02-25', 'Garsen Area', 'P.O. Box 200, Garsen', 'info@tanadelta.coop', '+254-722-004-102', 280, 12000000, true)
  RETURNING id INTO coop_id;
  
  INSERT INTO cooperative_members (cooperative_id, member_number, full_name, id_number, phone, shares_owned, share_value, date_joined, is_active)
  VALUES 
    (coop_id, 'MEM/004/0005', 'Hassan Mohamed', '123456005', '+254-722-500-005', 380, 700, '2024-03-01', true),
    (coop_id, 'MEM/004/0006', 'Khadija Omar', '123456006', '+254-722-500-006', 290, 850, '2024-03-20', true),
    (coop_id, 'MEM/004/0007', 'Abdi Yusuf', '123456007', '+254-722-500-007', 520, 600, '2024-02-28', true),
    (coop_id, 'MEM/004/0008', 'Mariam Hassan', '123456008', '+254-722-500-008', 415, 750, '2024-04-12', true),
    (coop_id, 'MEM/004/0009', 'Ibrahim Said', '123456009', '+254-722-500-009', 190, 550, '2024-05-05', true);
  
  INSERT INTO compliance_reports (report_number, cooperative_id, financial_year, agm_held, agm_date, bylaws_compliant, meetings_compliant, records_compliant, financial_compliant, status, compliance_score, submitted_at)
  VALUES ('COMP/004/2024/0002', coop_id, 2024, true, '2024-07-20', true, true, false, true, 'SUBMITTED', 85, '2024-08-15');
  
  -- Cooperative 3: Bura Irrigation Scheme
  INSERT INTO cooperatives (registration_number, name, type_id, tenant_id, status, registration_date, address, postal_address, email, phone, total_members, total_share_capital, is_active)
  VALUES ('COOP/004/2024/0003', 'Bura Irrigation Scheme', agric_type, tana_river_id, 'REGISTERED', '2024-03-15', 'Bura Town', 'P.O. Box 300, Bura', 'info@burairrigation.coop', '+254-722-004-103', 650, 28000000, true)
  RETURNING id INTO coop_id;
  
  INSERT INTO cooperative_members (cooperative_id, member_number, full_name, id_number, phone, shares_owned, share_value, date_joined, is_active)
  VALUES 
    (coop_id, 'MEM/004/0010', 'Mohamed Ali', '123456010', '+254-722-500-010', 670, 950, '2024-04-02', true),
    (coop_id, 'MEM/004/0011', 'Asha Ibrahim', '123456011', '+254-722-500-011', 340, 800, '2024-04-15', true),
    (coop_id, 'MEM/004/0012', 'Salim Hussein', '123456012', '+254-722-500-012', 780, 720, '2024-03-20', true);
  
  INSERT INTO compliance_reports (report_number, cooperative_id, financial_year, agm_held, agm_date, bylaws_compliant, meetings_compliant, records_compliant, financial_compliant, status, compliance_score, submitted_at)
  VALUES ('COMP/004/2024/0003', coop_id, 2024, true, '2024-09-10', true, true, true, true, 'SUBMITTED', 96, '2024-09-20');
  
  -- Cooperative 4: Tana River Livestock
  INSERT INTO cooperatives (registration_number, name, type_id, tenant_id, status, registration_date, address, postal_address, email, phone, total_members, total_share_capital, is_active)
  VALUES ('COOP/004/2024/0004', 'Tana River Livestock', marketing_type, tana_river_id, 'REGISTERED', '2024-04-10', 'Madogo Market', 'P.O. Box 400, Madogo', 'info@tanalivestock.coop', '+254-722-004-104', 190, 8500000, true)
  RETURNING id INTO coop_id;
  
  INSERT INTO cooperative_members (cooperative_id, member_number, full_name, id_number, phone, shares_owned, share_value, date_joined, is_active)
  VALUES 
    (coop_id, 'MEM/004/0013', 'Ahmed Farah', '123456013', '+254-722-500-013', 420, 680, '2024-05-01', true),
    (coop_id, 'MEM/004/0014', 'Rahma Mohamed', '123456014', '+254-722-500-014', 230, 920, '2024-05-18', true),
    (coop_id, 'MEM/004/0015', 'Yusuf Hassan', '123456015', '+254-722-500-015', 560, 590, '2024-04-22', true),
    (coop_id, 'MEM/004/0016', 'Halima Omar', '123456016', '+254-722-500-016', 310, 840, '2024-06-05', true);
  
  INSERT INTO compliance_reports (report_number, cooperative_id, financial_year, agm_held, agm_date, bylaws_compliant, meetings_compliant, records_compliant, financial_compliant, status, compliance_score, submitted_at)
  VALUES ('COMP/004/2024/0004', coop_id, 2024, true, '2024-08-25', true, false, true, true, 'SUBMITTED', 78, '2024-09-05');
  
  -- Cooperative 5: Galole Transport SACCO
  INSERT INTO cooperatives (registration_number, name, type_id, tenant_id, status, registration_date, address, postal_address, email, phone, total_members, total_share_capital, is_active)
  VALUES ('COOP/004/2024/0005', 'Galole Transport SACCO', transport_type, tana_river_id, 'REGISTERED', '2024-05-05', 'Galole Stage', 'P.O. Box 500, Galole', 'info@galoletransport.coop', '+254-722-004-105', 85, 6500000, true)
  RETURNING id INTO coop_id;
  
  INSERT INTO cooperative_members (cooperative_id, member_number, full_name, id_number, phone, shares_owned, share_value, date_joined, is_active)
  VALUES 
    (coop_id, 'MEM/004/0017', 'Abdirahman Ali', '123456017', '+254-722-500-017', 640, 770, '2024-06-01', true),
    (coop_id, 'MEM/004/0018', 'Nimo Abdullahi', '123456018', '+254-722-500-018', 390, 650, '2024-06-15', true),
    (coop_id, 'MEM/004/0019', 'Omar Aden', '123456019', '+254-722-500-019', 850, 880, '2024-05-10', true);
  
  INSERT INTO compliance_reports (report_number, cooperative_id, financial_year, agm_held, agm_date, bylaws_compliant, meetings_compliant, records_compliant, financial_compliant, status, compliance_score, submitted_at)
  VALUES ('COMP/004/2024/0005', coop_id, 2024, true, '2024-09-15', true, true, true, false, 'SUBMITTED', 82, '2024-09-28');
  
  -- Registration Applications for Tana River
  INSERT INTO registration_applications (application_number, proposed_name, type_id, tenant_id, proposed_members, contact_person, contact_phone, contact_email, status, submitted_at)
  VALUES 
    ('APP/004/2024/0001', 'Hola Women Empowerment SACCO', sacco_type, tana_river_id, 35, 'Zainab Ahmed', '+254-722-600-001', 'zainab@example.com', 'SUBMITTED', '2024-10-01'),
    ('APP/004/2024/0002', 'Garsen Fish Farmers Cooperative', agric_type, tana_river_id, 22, 'Hassan Khamis', '+254-722-600-002', 'hassan.k@example.com', 'UNDER_REVIEW', '2024-09-25');
  
  -- ================================================================
  -- KILIFI COUNTY (003)
  -- ================================================================
  RAISE NOTICE 'Seeding Kilifi County...';
  
  UPDATE tenants SET contact_email = 'info@kilifi.go.ke', contact_phone = '+254-722-100-003', address = 'Kilifi Town, Kilifi County' WHERE id = kilifi_id;
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'admin1.kilifi@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Joseph Karisa"}', 'authenticated', 'authenticated');
  INSERT INTO users VALUES (user_id, 'admin1.kilifi@cmis.go.ke', 'Joseph Karisa', '+254-722-003-001', kilifi_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, kilifi_id, 'COUNTY_ADMIN', true);
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'admin2.kilifi@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Mercy Kadzo"}', 'authenticated', 'authenticated');
  INSERT INTO users VALUES (user_id, 'admin2.kilifi@cmis.go.ke', 'Mercy Kadzo', '+254-722-003-002', kilifi_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, kilifi_id, 'COUNTY_ADMIN', true);
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'officer1.kilifi@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Kenneth Mwangi"}', 'authenticated', 'authenticated');
  INSERT INTO users VALUES (user_id, 'officer1.kilifi@cmis.go.ke', 'Kenneth Mwangi', '+254-722-003-003', kilifi_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, kilifi_id, 'COUNTY_OFFICER', true);
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'officer2.kilifi@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Jane Kahindi"}', 'authenticated', 'authenticated');
  INSERT INTO users VALUES (user_id, 'officer2.kilifi@cmis.go.ke', 'Jane Kahindi', '+254-722-003-004', kilifi_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, kilifi_id, 'COUNTY_OFFICER', true);
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'officer3.kilifi@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"David Katana"}', 'authenticated', 'authenticated');
  INSERT INTO users VALUES (user_id, 'officer3.kilifi@cmis.go.ke', 'David Katana', '+254-722-003-005', kilifi_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, kilifi_id, 'COUNTY_OFFICER', true);
  
  -- Cooperative 1: Kilifi Cashew Nut Farmers
  INSERT INTO cooperatives (registration_number, name, type_id, tenant_id, status, registration_date, address, postal_address, email, phone, total_members, total_share_capital, is_active)
  VALUES ('COOP/003/2024/0001', 'Kilifi Cashew Nut Farmers', agric_type, kilifi_id, 'REGISTERED', '2024-01-18', 'Ganze Area', 'P.O. Box 1000, Kilifi', 'info@cashewnut.coop', '+254-722-003-101', 520, 25000000, true)
  RETURNING id INTO coop_id;
  
  INSERT INTO cooperative_members (cooperative_id, member_number, full_name, id_number, phone, shares_owned, share_value, date_joined, is_active)
  VALUES 
    (coop_id, 'MEM/003/0001', 'Peter Kazungu', '234567001', '+254-722-600-101', 480, 820, '2024-02-05', true),
    (coop_id, 'MEM/003/0002', 'Agnes Kenga', '234567002', '+254-722-600-102', 350, 730, '2024-02-20', true),
    (coop_id, 'MEM/003/0003', 'William Karisa', '234567003', '+254-722-600-103', 620, 890, '2024-01-25', true),
    (coop_id, 'MEM/003/0004', 'Grace Mwangi', '234567004', '+254-722-600-104', 290, 670, '2024-03-10', true);
  
  INSERT INTO compliance_reports (report_number, cooperative_id, financial_year, agm_held, agm_date, bylaws_compliant, meetings_compliant, records_compliant, financial_compliant, status, compliance_score, submitted_at)
  VALUES ('COMP/003/2024/0001', coop_id, 2024, true, '2024-08-20', true, true, true, true, 'SUBMITTED', 94, '2024-09-03');
  
  -- Cooperative 2: Malindi Fishermen SACCO
  INSERT INTO cooperatives (registration_number, name, type_id, tenant_id, status, registration_date, address, postal_address, email, phone, total_members, total_share_capital, is_active)
  VALUES ('COOP/003/2024/0002', 'Malindi Fishermen SACCO', sacco_type, kilifi_id, 'REGISTERED', '2024-02-22', 'Malindi Town', 'P.O. Box 2000, Malindi', 'info@malindifishermen.coop', '+254-722-003-102', 380, 18000000, true)
  RETURNING id INTO coop_id;
  
  INSERT INTO cooperative_members (cooperative_id, member_number, full_name, id_number, phone, shares_owned, share_value, date_joined, is_active)
  VALUES 
    (coop_id, 'MEM/003/0005', 'Hassan Juma', '234567005', '+254-722-600-105', 540, 780, '2024-03-05', true),
    (coop_id, 'MEM/003/0006', 'Mary Kahindi', '234567006', '+254-722-600-106', 410, 850, '2024-03-18', true),
    (coop_id, 'MEM/003/0007', 'John Katana', '234567007', '+254-722-600-107', 680, 620, '2024-02-28', true),
    (coop_id, 'MEM/003/0008', 'Esther Mwaro', '234567008', '+254-722-600-108', 320, 940, '2024-04-10', true),
    (coop_id, 'MEM/003/0009', 'Daniel Mwakio', '234567009', '+254-722-600-109', 260, 710, '2024-05-02', true);
  
  INSERT INTO compliance_reports (report_number, cooperative_id, financial_year, agm_held, agm_date, bylaws_compliant, meetings_compliant, records_compliant, financial_compliant, status, compliance_score, submitted_at)
  VALUES ('COMP/003/2024/0002', coop_id, 2024, true, '2024-07-28', true, true, true, true, 'SUBMITTED', 89, '2024-08-12');
  
  -- Cooperative 3: Watamu Beach Operators
  INSERT INTO cooperatives (registration_number, name, type_id, tenant_id, status, registration_date, address, postal_address, email, phone, total_members, total_share_capital, is_active)
  VALUES ('COOP/003/2024/0003', 'Watamu Beach Operators', multipurpose_type, kilifi_id, 'REGISTERED', '2024-03-28', 'Watamu Beach', 'P.O. Box 3000, Watamu', 'info@watumubeach.coop', '+254-722-003-103', 215, 32000000, true)
  RETURNING id INTO coop_id;
  
  INSERT INTO cooperative_members (cooperative_id, member_number, full_name, id_number, phone, shares_owned, share_value, date_joined, is_active)
  VALUES 
    (coop_id, 'MEM/003/0010', 'Francis Nzai', '234567010', '+254-722-600-110', 720, 960, '2024-04-08', true),
    (coop_id, 'MEM/003/0011', 'Lucy Kerubo', '234567011', '+254-722-600-111', 440, 810, '2024-04-22', true),
    (coop_id, 'MEM/003/0012', 'Robert Charo', '234567012', '+254-722-600-112', 890, 750, '2024-03-30', true);
  
  INSERT INTO compliance_reports (report_number, cooperative_id, financial_year, agm_held, agm_date, bylaws_compliant, meetings_compliant, records_compliant, financial_compliant, status, compliance_score, submitted_at)
  VALUES ('COMP/003/2024/0003', coop_id, 2024, true, '2024-09-05', true, true, true, true, 'SUBMITTED', 97, '2024-09-18');
  
  -- Cooperative 4: Kaloleni Dairy
  INSERT INTO cooperatives (registration_number, name, type_id, tenant_id, status, registration_date, address, postal_address, email, phone, total_members, total_share_capital, is_active)
  VALUES ('COOP/003/2024/0004', 'Kaloleni Dairy', dairy_type, kilifi_id, 'REGISTERED', '2024-04-12', 'Kaloleni Town', 'P.O. Box 4000, Kaloleni', 'info@kalolenidairy.coop', '+254-722-003-104', 145, 9500000, true)
  RETURNING id INTO coop_id;
  
  INSERT INTO cooperative_members (cooperative_id, member_number, full_name, id_number, phone, shares_owned, share_value, date_joined, is_active)
  VALUES 
    (coop_id, 'MEM/003/0013', 'Samuel Baya', '234567013', '+254-722-600-113', 380, 690, '2024-05-01', true),
    (coop_id, 'MEM/003/0014', 'Jane Mwikali', '234567014', '+254-722-600-114', 510, 820, '2024-05-15', true),
    (coop_id, 'MEM/003/0015', 'David Mwangi', '234567015', '+254-722-600-115', 270, 580, '2024-04-20', true),
    (coop_id, 'MEM/003/0016', 'Sarah Kadzo', '234567016', '+254-722-600-116', 640, 920, '2024-06-03', true);
  
  INSERT INTO compliance_reports (report_number, cooperative_id, financial_year, agm_held, agm_date, bylaws_compliant, meetings_compliant, records_compliant, financial_compliant, status, compliance_score, submitted_at)
  VALUES ('COMP/003/2024/0004', coop_id, 2024, true, '2024-08-18', true, false, true, true, 'SUBMITTED', 81, '2024-09-02');
  
  -- Cooperative 5: Kilifi Matatu Owners
  INSERT INTO cooperatives (registration_number, name, type_id, tenant_id, status, registration_date, address, postal_address, email, phone, total_members, total_share_capital, is_active)
  VALUES ('COOP/003/2024/0005', 'Kilifi Matatu Owners', transport_type, kilifi_id, 'REGISTERED', '2024-05-16', 'Kilifi CBD', 'P.O. Box 5000, Kilifi', 'info@kilifimatatu.coop', '+254-722-003-105', 95, 14000000, true)
  RETURNING id INTO coop_id;
  
  INSERT INTO cooperative_members (cooperative_id, member_number, full_name, id_number, phone, shares_owned, share_value, date_joined, is_active)
  VALUES 
    (coop_id, 'MEM/003/0017', 'Patrick Tsuma', '234567017', '+254-722-600-117', 760, 870, '2024-06-01', true),
    (coop_id, 'MEM/003/0018', 'Alice Nyaga', '234567018', '+254-722-600-118', 430, 640, '2024-06-18', true),
    (coop_id, 'MEM/003/0019', 'Joseph Kombe', '234567019', '+254-722-600-119', 920, 790, '2024-05-22', true);
  
  INSERT INTO compliance_reports (report_number, cooperative_id, financial_year, agm_held, agm_date, bylaws_compliant, meetings_compliant, records_compliant, financial_compliant, status, compliance_score, submitted_at)
  VALUES ('COMP/003/2024/0005', coop_id, 2024, true, '2024-09-12', true, true, true, false, 'SUBMITTED', 84, '2024-09-25');
  
  -- Registration Applications for Kilifi
  INSERT INTO registration_applications (application_number, proposed_name, type_id, tenant_id, proposed_members, contact_person, contact_phone, contact_email, status, submitted_at)
  VALUES 
    ('APP/003/2024/0001', 'Ganze Maize Growers Cooperative', agric_type, kilifi_id, 42, 'Peter Nzoka', '+254-722-700-001', 'peter.n@example.com', 'SUBMITTED', '2024-10-02'),
    ('APP/003/2024/0002', 'Kilifi Youth Empowerment SACCO', sacco_type, kilifi_id, 28, 'Grace Mwende', '+254-722-700-002', 'grace.m@example.com', 'APPROVED', '2024-09-20');
  
  -- ================================================================
  -- ELGEYO MARAKWET COUNTY (028)
  -- ================================================================
  RAISE NOTICE 'Seeding Elgeyo Marakwet County...';
  
  UPDATE tenants SET contact_email = 'info@elgeyomarakwet.go.ke', contact_phone = '+254-722-100-028', address = 'Iten Town, Elgeyo Marakwet' WHERE id = elgeyo_id;
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'admin1.elgeyo@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email"}', '{"full_name":"Daniel Kiprotich"}', 'authenticated', 'authenticated');
  INSERT INTO users VALUES (user_id, 'admin1.elgeyo@cmis.go.ke', 'Daniel Kiprotich', '+254-722-028-001', elgeyo_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, elgeyo_id, 'COUNTY_ADMIN', true);
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'admin2.elgeyo@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email"}', '{"full_name":"Ruth Chepkoech"}', 'authenticated', 'authenticated');
  INSERT INTO users VALUES (user_id, 'admin2.elgeyo@cmis.go.ke', 'Ruth Chepkoech', '+254-722-028-002', elgeyo_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, elgeyo_id, 'COUNTY_ADMIN', true);
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'officer1.elgeyo@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email"}', '{"full_name":"Philip Korir"}', 'authenticated', 'authenticated');
  INSERT INTO users VALUES (user_id, 'officer1.elgeyo@cmis.go.ke', 'Philip Korir', '+254-722-028-003', elgeyo_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, elgeyo_id, 'COUNTY_OFFICER', true);
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'officer2.elgeyo@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email"}', '{"full_name":"Sarah Jeptoo"}', 'authenticated', 'authenticated');
  INSERT INTO users VALUES (user_id, 'officer2.elgeyo@cmis.go.ke', 'Sarah Jeptoo', '+254-722-028-004', elgeyo_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, elgeyo_id, 'COUNTY_OFFICER', true);
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'officer3.elgeyo@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email"}', '{"full_name":"Moses Kiplagat"}', 'authenticated', 'authenticated');
  INSERT INTO users VALUES (user_id, 'officer3.elgeyo@cmis.go.ke', 'Moses Kiplagat', '+254-722-028-005', elgeyo_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, elgeyo_id, 'COUNTY_OFFICER', true);
  
  -- Cooperative 1: Iten Athletes SACCO
  INSERT INTO cooperatives (registration_number, name, type_id, tenant_id, status, registration_date, address, postal_address, email, phone, total_members, total_share_capital, is_active)
  VALUES ('COOP/028/2024/0001', 'Iten Athletes SACCO', sacco_type, elgeyo_id, 'REGISTERED', '2024-01-22', 'Iten Town', 'P.O. Box 100, Iten', 'info@itenathletes.coop', '+254-722-028-101', 890, 45000000, true)
  RETURNING id INTO coop_id;
  
  INSERT INTO cooperative_members (cooperative_id, member_number, full_name, id_number, phone, shares_owned, share_value, date_joined, is_active)
  VALUES 
    (coop_id, 'MEM/028/0001', 'Eliud Kipchoge', '345678001', '+254-722-800-101', 880, 990, '2024-02-10', true),
    (coop_id, 'MEM/028/0002', 'Faith Kipyegon', '345678002', '+254-722-800-102', 540, 850, '2024-02-25', true),
    (coop_id, 'MEM/028/0003', 'Geoffrey Kamworor', '345678003', '+254-722-800-103', 720, 920, '2024-01-28', true),
    (coop_id, 'MEM/028/0004', 'Hellen Obiri', '345678004', '+254-722-800-104', 410, 780, '2024-03-15', true);
  
  INSERT INTO compliance_reports (report_number, cooperative_id, financial_year, agm_held, agm_date, bylaws_compliant, meetings_compliant, records_compliant, financial_compliant, status, compliance_score, submitted_at)
  VALUES ('COMP/028/2024/0001', coop_id, 2024, true, '2024-08-22', true, true, true, true, 'SUBMITTED', 95, '2024-09-05');
  
  -- Cooperative 2: Kerio Valley Potato Growers
  INSERT INTO cooperatives (registration_number, name, type_id, tenant_id, status, registration_date, address, postal_address, email, phone, total_members, total_share_capital, is_active)
  VALUES ('COOP/028/2024/0002', 'Kerio Valley Potato Growers', agric_type, elgeyo_id, 'REGISTERED', '2024-02-28', 'Kapsowar', 'P.O. Box 200, Kapsowar', 'info@keriopotato.coop', '+254-722-028-102', 340, 16000000, true)
  RETURNING id INTO coop_id;
  
  INSERT INTO cooperative_members (cooperative_id, member_number, full_name, id_number, phone, shares_owned, share_value, date_joined, is_active)
  VALUES 
    (coop_id, 'MEM/028/0005', 'William Kibet', '345678005', '+254-722-800-105', 480, 720, '2024-03-10', true),
    (coop_id, 'MEM/028/0006', 'Mercy Cherop', '345678006', '+254-722-800-106', 330, 890, '2024-03-25', true),
    (coop_id, 'MEM/028/0007', 'David Kipsang', '345678007', '+254-722-800-107', 610, 650, '2024-03-05', true),
    (coop_id, 'MEM/028/0008', 'Nancy Chepkwony', '345678008', '+254-722-800-108', 270, 960, '2024-04-12', true),
    (coop_id, 'MEM/028/0009', 'Joseph Kiptoo', '345678009', '+254-722-800-109', 490, 810, '2024-05-08', true);
  
  INSERT INTO compliance_reports (report_number, cooperative_id, financial_year, agm_held, agm_date, bylaws_compliant, meetings_compliant, records_compliant, financial_compliant, status, compliance_score, submitted_at)
  VALUES ('COMP/028/2024/0002', coop_id, 2024, true, '2024-07-30', true, true, false, true, 'SUBMITTED', 87, '2024-08-18');
  
  -- Cooperative 3: Marakwet Dairy Cooperative
  INSERT INTO cooperatives (registration_number, name, type_id, tenant_id, status, registration_date, address, postal_address, email, phone, total_members, total_share_capital, is_active)
  VALUES ('COOP/028/2024/0003', 'Marakwet Dairy Cooperative', dairy_type, elgeyo_id, 'REGISTERED', '2024-03-18', 'Tot Area', 'P.O. Box 300, Tot', 'info@marakwetdairy.coop', '+254-722-028-103', 225, 12500000, true)
  RETURNING id INTO coop_id;
  
  INSERT INTO cooperative_members (cooperative_id, member_number, full_name, id_number, phone, shares_owned, share_value, date_joined, is_active)
  VALUES 
    (coop_id, 'MEM/028/0010', 'Peter Kiprop', '345678010', '+254-722-800-110', 820, 940, '2024-04-05', true),
    (coop_id, 'MEM/028/0011', 'Agnes Jepkoech', '345678011', '+254-722-800-111', 560, 830, '2024-04-20', true),
    (coop_id, 'MEM/028/0012', 'Simon Kipruto', '345678012', '+254-722-800-112', 390, 710, '2024-03-28', true);
  
  INSERT INTO compliance_reports (report_number, cooperative_id, financial_year, agm_held, agm_date, bylaws_compliant, meetings_compliant, records_compliant, financial_compliant, status, compliance_score, submitted_at)
  VALUES ('COMP/028/2024/0003', coop_id, 2024, true, '2024-09-08', true, true, true, true, 'SUBMITTED', 93, '2024-09-22');
  
  -- Cooperative 4: Elgeyo Honey Producers
  INSERT INTO cooperatives (registration_number, name, type_id, tenant_id, status, registration_date, address, postal_address, email, phone, total_members, total_share_capital, is_active)
  VALUES ('COOP/028/2024/0004', 'Elgeyo Honey Producers', marketing_type, elgeyo_id, 'REGISTERED', '2024-04-20', 'Tambach Market', 'P.O. Box 400, Tambach', 'info@elgeyohoney.coop', '+254-722-028-104', 180, 8000000, true)
  RETURNING id INTO coop_id;
  
  INSERT INTO cooperative_members (cooperative_id, member_number, full_name, id_number, phone, shares_owned, share_value, date_joined, is_active)
  VALUES 
    (coop_id, 'MEM/028/0013', 'John Kipchumba', '345678013', '+254-722-800-113', 670, 860, '2024-05-05', true),
    (coop_id, 'MEM/028/0014', 'Beatrice Chepng\'eno', '345678014', '+254-722-800-114', 440, 720, '2024-05-20', true),
    (coop_id, 'MEM/028/0015', 'Daniel Kipketer', '345678015', '+254-722-800-115', 590, 930, '2024-04-28', true),
    (coop_id, 'MEM/028/0016', 'Rose Jepchirchir', '345678016', '+254-722-800-116', 320, 670, '2024-06-10', true);
  
  INSERT INTO compliance_reports (report_number, cooperative_id, financial_year, agm_held, agm_date, bylaws_compliant, meetings_compliant, records_compliant, financial_compliant, status, compliance_score, submitted_at)
  VALUES ('COMP/028/2024/0004', coop_id, 2024, true, '2024-08-28', true, false, true, true, 'SUBMITTED', 79, '2024-09-10');
  
  -- Cooperative 5: Iten Transport SACCO
  INSERT INTO cooperatives (registration_number, name, type_id, tenant_id, status, registration_date, address, postal_address, email, phone, total_members, total_share_capital, is_active)
  VALUES ('COOP/028/2024/0005', 'Iten Transport SACCO', transport_type, elgeyo_id, 'REGISTERED', '2024-05-25', 'Iten Stage', 'P.O. Box 500, Iten', 'info@itentransport.coop', '+254-722-028-105', 125, 18000000, true)
  RETURNING id INTO coop_id;
  
  INSERT INTO cooperative_members (cooperative_id, member_number, full_name, id_number, phone, shares_owned, share_value, date_joined, is_active)
  VALUES 
    (coop_id, 'MEM/028/0017', 'Michael Kipkoech', '345678017', '+254-722-800-117', 750, 910, '2024-06-05', true),
    (coop_id, 'MEM/028/0018', 'Christine Jepkemboi', '345678018', '+254-722-800-118', 480, 760, '2024-06-20', true),
    (coop_id, 'MEM/028/0019', 'Patrick Kiplimo', '345678019', '+254-722-800-119', 910, 820, '2024-05-30', true);
  
  INSERT INTO compliance_reports (report_number, cooperative_id, financial_year, agm_held, agm_date, bylaws_compliant, meetings_compliant, records_compliant, financial_compliant, status, compliance_score, submitted_at)
  VALUES ('COMP/028/2024/0005', coop_id, 2024, true, '2024-09-18', true, true, true, false, 'SUBMITTED', 85, '2024-09-30');
  
  -- Registration Applications for Elgeyo Marakwet
  INSERT INTO registration_applications (application_number, proposed_name, type_id, tenant_id, proposed_members, contact_person, contact_phone, contact_email, status, submitted_at)
  VALUES 
    ('APP/028/2024/0001', 'Kapsowar Coffee Cooperative', agric_type, elgeyo_id, 38, 'Wilson Kibet', '+254-722-900-001', 'wilson.k@example.com', 'SUBMITTED', '2024-10-03'),
    ('APP/028/2024/0002', 'Elgeyo Youth SACCO', sacco_type, elgeyo_id, 25, 'Jane Cheptoo', '+254-722-900-002', 'jane.c@example.com', 'UNDER_REVIEW', '2024-09-28');
  
  -- ================================================================
  -- KIRINYAGA COUNTY (020)
  -- ================================================================
  RAISE NOTICE 'Seeding Kirinyaga County...';
  
  UPDATE tenants SET contact_email = 'info@kirinyaga.go.ke', contact_phone = '+254-722-100-020', address = 'Kerugoya Town, Kirinyaga County' WHERE id = kirinyaga_id;
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'admin1.kirinyaga@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"John Kamau"}', 'authenticated', 'authenticated');
  INSERT INTO users VALUES (user_id, 'admin1.kirinyaga@cmis.go.ke', 'John Kamau', '+254-722-020-001', kirinyaga_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, kirinyaga_id, 'COUNTY_ADMIN', true);
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'admin2.kirinyaga@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Mary Wanjiru"}', 'authenticated', 'authenticated');
  INSERT INTO users VALUES (user_id, 'admin2.kirinyaga@cmis.go.ke', 'Mary Wanjiru', '+254-722-020-002', kirinyaga_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, kirinyaga_id, 'COUNTY_ADMIN', true);
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'officer1.kirinyaga@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Peter Mwangi"}', 'authenticated', 'authenticated');
  INSERT INTO users VALUES (user_id, 'officer1.kirinyaga@cmis.go.ke', 'Peter Mwangi', '+254-722-020-003', kirinyaga_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, kirinyaga_id, 'COUNTY_OFFICER', true);
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'officer2.kirinyaga@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Grace Njeri"}', 'authenticated', 'authenticated');
  INSERT INTO users VALUES (user_id, 'officer2.kirinyaga@cmis.go.ke', 'Grace Njeri', '+254-722-020-004', kirinyaga_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, kirinyaga_id, 'COUNTY_OFFICER', true);
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'officer3.kirinyaga@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Samuel Wambui"}', 'authenticated', 'authenticated');
  INSERT INTO users VALUES (user_id, 'officer3.kirinyaga@cmis.go.ke', 'Samuel Wambui', '+254-722-020-005', kirinyaga_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, kirinyaga_id, 'COUNTY_OFFICER', true);
  
  -- Cooperative 1: Mwea Rice Growers SACCO
  INSERT INTO cooperatives (registration_number, name, type_id, tenant_id, status, registration_date, address, postal_address, email, phone, total_members, total_share_capital, is_active)
  VALUES ('COOP/020/2024/0001', 'Mwea Rice Growers SACCO', sacco_type, kirinyaga_id, 'REGISTERED', '2024-01-25', 'Mwea Town', 'P.O. Box 100, Mwea', 'info@mwearice.coop', '+254-722-020-101', 1200, 65000000, true)
  RETURNING id INTO coop_id;
  
  INSERT INTO cooperative_members (cooperative_id, member_number, full_name, id_number, phone, shares_owned, share_value, date_joined, is_active)
  VALUES 
    (coop_id, 'MEM/020/0001', 'James Kariuki', '456789001', '+254-722-100-201', 890, 980, '2024-02-12', true),
    (coop_id, 'MEM/020/0002', 'Lucy Wanjiku', '456789002', '+254-722-100-202', 650, 870, '2024-02-28', true),
    (coop_id, 'MEM/020/0003', 'Paul Mwangi', '456789003', '+254-722-100-203', 770, 920, '2024-01-30', true),
    (coop_id, 'MEM/020/0004', 'Jane Njoki', '456789004', '+254-722-100-204', 540, 760, '2024-03-18', true);
  
  INSERT INTO compliance_reports (report_number, cooperative_id, financial_year, agm_held, agm_date, bylaws_compliant, meetings_compliant, records_compliant, financial_compliant, status, compliance_score, submitted_at)
  VALUES ('COMP/020/2024/0001', coop_id, 2024, true, '2024-08-25', true, true, true, true, 'SUBMITTED', 98, '2024-09-08');
  
  -- Cooperative 2: Kirinyaga Tea Farmers
  INSERT INTO cooperatives (registration_number, name, type_id, tenant_id, status, registration_date, address, postal_address, email, phone, total_members, total_share_capital, is_active)
  VALUES ('COOP/020/2024/0002', 'Kirinyaga Tea Farmers', agric_type, kirinyaga_id, 'REGISTERED', '2024-02-18', 'Kerugoya Market', 'P.O. Box 200, Kerugoya', 'info@kirinyagateg.coop', '+254-722-020-102', 580, 32000000, true)
  RETURNING id INTO coop_id;
  
  INSERT INTO cooperative_members (cooperative_id, member_number, full_name, id_number, phone, shares_owned, share_value, date_joined, is_active)
  VALUES 
    (coop_id, 'MEM/020/0005', 'David Kamau', '456789005', '+254-722-100-205', 620, 840, '2024-03-08', true),
    (coop_id, 'MEM/020/0006', 'Anne Wangari', '456789006', '+254-722-100-206', 470, 910, '2024-03-22', true),
    (coop_id, 'MEM/020/0007', 'Joseph Njoroge', '456789007', '+254-722-100-207', 730, 680, '2024-02-25', true),
    (coop_id, 'MEM/020/0008', 'Margaret Nyambura', '456789008', '+254-722-100-208', 390, 950, '2024-04-15', true),
    (coop_id, 'MEM/020/0009', 'Simon Gitau', '456789009', '+254-722-100-209', 560, 790, '2024-05-10', true);
  
  INSERT INTO compliance_reports (report_number, cooperative_id, financial_year, agm_held, agm_date, bylaws_compliant, meetings_compliant, records_compliant, financial_compliant, status, compliance_score, submitted_at)
  VALUES ('COMP/020/2024/0002', coop_id, 2024, true, '2024-07-25', true, true, true, true, 'SUBMITTED', 91, '2024-08-10');
  
  -- Cooperative 3: Gichugu Coffee Cooperative
  INSERT INTO cooperatives (registration_number, name, type_id, tenant_id, status, registration_date, address, postal_address, email, phone, total_members, total_share_capital, is_active)
  VALUES ('COOP/020/2024/0003', 'Gichugu Coffee Cooperative', agric_type, kirinyaga_id, 'REGISTERED', '2024-03-22', 'Gichugu Area', 'P.O. Box 300, Gichugu', 'info@gichugucoffee.coop', '+254-722-020-103', 340, 18500000, true)
  RETURNING id INTO coop_id;
  
  INSERT INTO cooperative_members (cooperative_id, member_number, full_name, id_number, phone, shares_owned, share_value, date_joined, is_active)
  VALUES 
    (coop_id, 'MEM/020/0010', 'Francis Mugo', '456789010', '+254-722-100-210', 810, 930, '2024-04-08', true),
    (coop_id, 'MEM/020/0011', 'Elizabeth Wambui', '456789011', '+254-722-100-211', 590, 820, '2024-04-25', true),
    (coop_id, 'MEM/020/0012', 'Patrick Kinyua', '456789012', '+254-722-100-212', 420, 750, '2024-03-30', true);
  
  INSERT INTO compliance_reports (report_number, cooperative_id, financial_year, agm_held, agm_date, bylaws_compliant, meetings_compliant, records_compliant, financial_compliant, status, compliance_score, submitted_at)
  VALUES ('COMP/020/2024/0003', coop_id, 2024, true, '2024-09-12', true, true, true, true, 'SUBMITTED', 94, '2024-09-25');
  
  -- Cooperative 4: Ndia Dairy Farmers
  INSERT INTO cooperatives (registration_number, name, type_id, tenant_id, status, registration_date, address, postal_address, email, phone, total_members, total_share_capital, is_active)
  VALUES ('COOP/020/2024/0004', 'Ndia Dairy Farmers', dairy_type, kirinyaga_id, 'REGISTERED', '2024-04-15', 'Sagana Town', 'P.O. Box 400, Sagana', 'info@ndiadairy.coop', '+254-722-020-104', 225, 14000000, true)
  RETURNING id INTO coop_id;
  
  INSERT INTO cooperative_members (cooperative_id, member_number, full_name, id_number, phone, shares_owned, share_value, date_joined, is_active)
  VALUES 
    (coop_id, 'MEM/020/0013', 'Robert Waweru', '456789013', '+254-722-100-213', 680, 860, '2024-05-05', true),
    (coop_id, 'MEM/020/0014', 'Susan Wairimu', '456789014', '+254-722-100-214', 510, 720, '2024-05-22', true),
    (coop_id, 'MEM/020/0015', 'Daniel Ngugi', '456789015', '+254-722-100-215', 370, 890, '2024-04-28', true),
    (coop_id, 'MEM/020/0016', 'Faith Muthoni', '456789016', '+254-722-100-216', 740, 970, '2024-06-12', true);
  
  INSERT INTO compliance_reports (report_number, cooperative_id, financial_year, agm_held, agm_date, bylaws_compliant, meetings_compliant, records_compliant, financial_compliant, status, compliance_score, submitted_at)
  VALUES ('COMP/020/2024/0004', coop_id, 2024, true, '2024-08-30', true, false, true, true, 'SUBMITTED', 83, '2024-09-15');
  
  -- Cooperative 5: Kerugoya Transport SACCO
  INSERT INTO cooperatives (registration_number, name, type_id, tenant_id, status, registration_date, address, postal_address, email, phone, total_members, total_share_capital, is_active)
  VALUES ('COOP/020/2024/0005', 'Kerugoya Transport SACCO', transport_type, kirinyaga_id, 'REGISTERED', '2024-05-20', 'Kerugoya Stage', 'P.O. Box 500, Kerugoya', 'info@kerugovatransport.coop', '+254-722-020-105', 165, 22000000, true)
  RETURNING id INTO coop_id;
  
  INSERT INTO cooperative_members (cooperative_id, member_number, full_name, id_number, phone, shares_owned, share_value, date_joined, is_active)
  VALUES 
    (coop_id, 'MEM/020/0017', 'Michael Nderitu', '456789017', '+254-722-100-217', 920, 900, '2024-06-08', true),
    (coop_id, 'MEM/020/0018', 'Alice Nyawira', '456789018', '+254-722-100-218', 630, 780, '2024-06-25', true),
    (coop_id, 'MEM/020/0019', 'Stephen Gichuki', '456789019', '+254-722-100-219', 480, 850, '2024-05-28', true);
  
  INSERT INTO compliance_reports (report_number, cooperative_id, financial_year, agm_held, agm_date, bylaws_compliant, meetings_compliant, records_compliant, financial_compliant, status, compliance_score, submitted_at)
  VALUES ('COMP/020/2024/0005', coop_id, 2024, true, '2024-09-20', true, true, true, false, 'SUBMITTED', 86, '2024-10-02');
  
  -- Registration Applications for Kirinyaga
  INSERT INTO registration_applications (application_number, proposed_name, type_id, tenant_id, proposed_members, contact_person, contact_phone, contact_email, status, submitted_at)
  VALUES 
    ('APP/020/2024/0001', 'Ndia Horticultural Cooperative', agric_type, kirinyaga_id, 45, 'James Njeru', '+254-722-110-001', 'james.n@example.com', 'SUBMITTED', '2024-10-04'),
    ('APP/020/2024/0002', 'Mwea Youth SACCO', sacco_type, kirinyaga_id, 30, 'Sarah Wangui', '+254-722-110-002', 'sarah.w@example.com', 'APPROVED', '2024-09-22');
  
  -- ================================================================
  -- TURKANA COUNTY (023)
  -- ================================================================
  RAISE NOTICE 'Seeding Turkana County...';
  
  UPDATE tenants SET contact_email = 'info@turkana.go.ke', contact_phone = '+254-722-100-023', address = 'Lodwar Town, Turkana County' WHERE id = turkana_id;
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'admin1.turkana@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ekiru Lokai"}', 'authenticated', 'authenticated');
  INSERT INTO users VALUES (user_id, 'admin1.turkana@cmis.go.ke', 'Ekiru Lokai', '+254-722-023-001', turkana_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, turkana_id, 'COUNTY_ADMIN', true);
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'admin2.turkana@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Apale Ekal"}', 'authenticated', 'authenticated');
  INSERT INTO users VALUES (user_id, 'admin2.turkana@cmis.go.ke', 'Apale Ekal', '+254-722-023-002', turkana_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, turkana_id, 'COUNTY_ADMIN', true);
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'officer1.turkana@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Akiru Lomuria"}', 'authenticated', 'authenticated');
  INSERT INTO users VALUES (user_id, 'officer1.turkana@cmis.go.ke', 'Akiru Lomuria', '+254-722-023-003', turkana_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, turkana_id, 'COUNTY_OFFICER', true);
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'officer2.turkana@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Eyanae Arot"}', 'authenticated', 'authenticated');
  INSERT INTO users VALUES (user_id, 'officer2.turkana@cmis.go.ke', 'Eyanae Arot', '+254-722-023-004', turkana_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, turkana_id, 'COUNTY_OFFICER', true);
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'officer3.turkana@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Lokale Ekeno"}', 'authenticated', 'authenticated');
  INSERT INTO users VALUES (user_id, 'officer3.turkana@cmis.go.ke', 'Lokale Ekeno', '+254-722-023-005', turkana_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, turkana_id, 'COUNTY_OFFICER', true);
  
  -- Cooperative 1: Turkana Livestock Traders
  INSERT INTO cooperatives (registration_number, name, type_id, tenant_id, status, registration_date, address, postal_address, email, phone, total_members, total_share_capital, is_active)
  VALUES ('COOP/023/2024/0001', 'Turkana Livestock Traders', marketing_type, turkana_id, 'REGISTERED', '2024-01-28', 'Lodwar Market', 'P.O. Box 100, Lodwar', 'info@turkanalivestock.coop', '+254-722-023-101', 680, 28000000, true)
  RETURNING id INTO coop_id;
  
  INSERT INTO cooperative_members (cooperative_id, member_number, full_name, id_number, phone, shares_owned, share_value, date_joined, is_active)
  VALUES 
    (coop_id, 'MEM/023/0001', 'Lokiru Ekale', '567890001', '+254-722-120-301', 720, 880, '2024-02-15', true),
    (coop_id, 'MEM/023/0002', 'Apesur Etabo', '567890002', '+254-722-120-302', 530, 760, '2024-03-05', true),
    (coop_id, 'MEM/023/0003', 'Ekai Lorot', '567890003', '+254-722-120-303', 640, 910, '2024-02-01', true),
    (coop_id, 'MEM/023/0004', 'Napeyok Akeno', '567890004', '+254-722-120-304', 390, 690, '2024-03-22', true);
  
  INSERT INTO compliance_reports (report_number, cooperative_id, financial_year, agm_held, agm_date, bylaws_compliant, meetings_compliant, records_compliant, financial_compliant, status, compliance_score, submitted_at)
  VALUES ('COMP/023/2024/0001', coop_id, 2024, true, '2024-08-28', true, true, true, true, 'SUBMITTED', 90, '2024-09-12');
  
  -- Cooperative 2: Lake Turkana Fishermen
  INSERT INTO cooperatives (registration_number, name, type_id, tenant_id, status, registration_date, address, postal_address, email, phone, total_members, total_share_capital, is_active)
  VALUES ('COOP/023/2024/0002', 'Lake Turkana Fishermen', agric_type, turkana_id, 'REGISTERED', '2024-02-20', 'Kalokol Landing', 'P.O. Box 200, Kalokol', 'info@turkanafish.coop', '+254-722-023-102', 450, 15000000, true)
  RETURNING id INTO coop_id;
  
  INSERT INTO cooperative_members (cooperative_id, member_number, full_name, id_number, phone, shares_owned, share_value, date_joined, is_active)
  VALUES 
    (coop_id, 'MEM/023/0005', 'Lokwang Epu', '567890005', '+254-722-120-305', 580, 820, '2024-03-10', true),
    (coop_id, 'MEM/023/0006', 'Lokaale Ekuam', '567890006', '+254-722-120-306', 430, 740, '2024-03-28', true),
    (coop_id, 'MEM/023/0007', 'Akal Ngirisio', '567890007', '+254-722-120-307', 690, 670, '2024-02-25', true),
    (coop_id, 'MEM/023/0008', 'Nakalale Epem', '567890008', '+254-722-120-308', 310, 890, '2024-04-18', true),
    (coop_id, 'MEM/023/0009', 'Ekiru Lomongin', '567890009', '+254-722-120-309', 540, 780, '2024-05-12', true);
  
  INSERT INTO compliance_reports (report_number, cooperative_id, financial_year, agm_held, agm_date, bylaws_compliant, meetings_compliant, records_compliant, financial_compliant, status, compliance_score, submitted_at)
  VALUES ('COMP/023/2024/0002', coop_id, 2024, true, '2024-07-22', true, true, false, true, 'SUBMITTED', 88, '2024-08-08');
  
  -- Cooperative 3: Lodwar SACCO
  INSERT INTO cooperatives (registration_number, name, type_id, tenant_id, status, registration_date, address, postal_address, email, phone, total_members, total_share_capital, is_active)
  VALUES ('COOP/023/2024/0003', 'Lodwar SACCO', sacco_type, turkana_id, 'REGISTERED', '2024-03-15', 'Lodwar Town Center', 'P.O. Box 300, Lodwar', 'info@lodwarsacco.coop', '+254-722-023-103', 920, 38000000, true)
  RETURNING id INTO coop_id;
  
  INSERT INTO cooperative_members (cooperative_id, member_number, full_name, id_number, phone, shares_owned, share_value, date_joined, is_active)
  VALUES 
    (coop_id, 'MEM/023/0010', 'Lokwang Ngirisio', '567890010', '+254-722-120-310', 850, 950, '2024-04-10', true),
    (coop_id, 'MEM/023/0011', 'Akiru Epem', '567890011', '+254-722-120-311', 610, 830, '2024-04-28', true),
    (coop_id, 'MEM/023/0012', 'Lorot Ekal', '567890012', '+254-722-120-312', 470, 710, '2024-03-20', true);
  
  INSERT INTO compliance_reports (report_number, cooperative_id, financial_year, agm_held, agm_date, bylaws_compliant, meetings_compliant, records_compliant, financial_compliant, status, compliance_score, submitted_at)
  VALUES ('COMP/023/2024/0003', coop_id, 2024, true, '2024-09-15', true, true, true, true, 'SUBMITTED', 96, '2024-09-28');
  
  -- Cooperative 4: Kakuma Boda Boda
  INSERT INTO cooperatives (registration_number, name, type_id, tenant_id, status, registration_date, address, postal_address, email, phone, total_members, total_share_capital, is_active)
  VALUES ('COOP/023/2024/0004', 'Kakuma Boda Boda', transport_type, turkana_id, 'REGISTERED', '2024-04-22', 'Kakuma Town', 'P.O. Box 400, Kakuma', 'info@kakumaboda.coop', '+254-722-023-104', 185, 9500000, true)
  RETURNING id INTO coop_id;
  
  INSERT INTO cooperative_members (cooperative_id, member_number, full_name, id_number, phone, shares_owned, share_value, date_joined, is_active)
  VALUES 
    (coop_id, 'MEM/023/0013', 'Lokale Ekeno', '567890013', '+254-722-120-313', 720, 870, '2024-05-08', true),
    (coop_id, 'MEM/023/0014', 'Apesur Lokai', '567890014', '+254-722-120-314', 490, 720, '2024-05-25', true),
    (coop_id, 'MEM/023/0015', 'Ekiru Ngirisio', '567890015', '+254-722-120-315', 610, 940, '2024-04-30', true),
    (coop_id, 'MEM/023/0016', 'Nakiru Etabo', '567890016', '+254-722-120-316', 340, 650, '2024-06-15', true);
  
  INSERT INTO compliance_reports (report_number, cooperative_id, financial_year, agm_held, agm_date, bylaws_compliant, meetings_compliant, records_compliant, financial_compliant, status, compliance_score, submitted_at)
  VALUES ('COMP/023/2024/0004', coop_id, 2024, true, '2024-09-02', true, false, true, true, 'SUBMITTED', 80, '2024-09-18');
  
  -- Cooperative 5: Turkana Pastoralists
  INSERT INTO cooperatives (registration_number, name, type_id, tenant_id, status, registration_date, address, postal_address, email, phone, total_members, total_share_capital, is_active)
  VALUES ('COOP/023/2024/0005', 'Turkana Pastoralists', multipurpose_type, turkana_id, 'REGISTERED', '2024-05-18', 'Lokichar Area', 'P.O. Box 500, Lokichar', 'info@turkanapastoralists.coop', '+254-722-023-105', 740, 32000000, true)
  RETURNING id INTO coop_id;
  
  INSERT INTO cooperative_members (cooperative_id, member_number, full_name, id_number, phone, shares_owned, share_value, date_joined, is_active)
  VALUES 
    (coop_id, 'MEM/023/0017', 'Lorot Lomongin', '567890017', '+254-722-120-317', 880, 920, '2024-06-10', true),
    (coop_id, 'MEM/023/0018', 'Napeyok Ekale', '567890018', '+254-722-120-318', 520, 770, '2024-06-28', true),
    (coop_id, 'MEM/023/0019', 'Ekale Akeno', '567890019', '+254-722-120-319', 960, 840, '2024-05-25', true);
  
  INSERT INTO compliance_reports (report_number, cooperative_id, financial_year, agm_held, agm_date, bylaws_compliant, meetings_compliant, records_compliant, financial_compliant, status, compliance_score, submitted_at)
  VALUES ('COMP/023/2024/0005', coop_id, 2024, true, '2024-09-22', true, true, true, false, 'SUBMITTED', 87, '2024-10-05');
  
  -- Registration Applications for Turkana
  INSERT INTO registration_applications (application_number, proposed_name, type_id, tenant_id, proposed_members, contact_person, contact_phone, contact_email, status, submitted_at)
  VALUES 
    ('APP/023/2024/0001', 'Kalokol Fish Processors', agric_type, turkana_id, 48, 'Lokiru Epu', '+254-722-130-001', 'lokiru.e@example.com', 'SUBMITTED', '2024-10-05'),
    ('APP/023/2024/0002', 'Lodwar Women SACCO', sacco_type, turkana_id, 32, 'Nakalale Epem', '+254-722-130-002', 'nakalale@example.com', 'UNDER_REVIEW', '2024-09-30');
  
  -- ================================================================
  -- GARISSA COUNTY (007)
  -- ================================================================
  RAISE NOTICE 'Seeding Garissa County...';
  
  UPDATE tenants SET contact_email = 'info@garissa.go.ke', contact_phone = '+254-722-100-007', address = 'Garissa Town, Garissa County' WHERE id = garissa_id;
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'admin1.garissa@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Abdi Mohamed"}', 'authenticated', 'authenticated');
  INSERT INTO users VALUES (user_id, 'admin1.garissa@cmis.go.ke', 'Abdi Mohamed', '+254-722-007-001', garissa_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, garissa_id, 'COUNTY_ADMIN', true);
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'admin2.garissa@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Fatuma Ahmed"}', 'authenticated', 'authenticated');
  INSERT INTO users VALUES (user_id, 'admin2.garissa@cmis.go.ke', 'Fatuma Ahmed', '+254-722-007-002', garissa_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, garissa_id, 'COUNTY_ADMIN', true);
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'officer1.garissa@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Hassan Ibrahim"}', 'authenticated', 'authenticated');
  INSERT INTO users VALUES (user_id, 'officer1.garissa@cmis.go.ke', 'Hassan Ibrahim', '+254-722-007-003', garissa_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, garissa_id, 'COUNTY_OFFICER', true);
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'officer2.garissa@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Halima Ali"}', 'authenticated', 'authenticated');
  INSERT INTO users VALUES (user_id, 'officer2.garissa@cmis.go.ke', 'Halima Ali', '+254-722-007-004', garissa_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, garissa_id, 'COUNTY_OFFICER', true);
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'officer3.garissa@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Omar Hussein"}', 'authenticated', 'authenticated');
  INSERT INTO users VALUES (user_id, 'officer3.garissa@cmis.go.ke', 'Omar Hussein', '+254-722-007-005', garissa_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, garissa_id, 'COUNTY_OFFICER', true);
  
  -- Cooperative 1: Garissa Livestock SACCO
  INSERT INTO cooperatives (registration_number, name, type_id, tenant_id, status, registration_date, address, postal_address, email, phone, total_members, total_share_capital, is_active)
  VALUES ('COOP/007/2024/0001', 'Garissa Livestock SACCO', sacco_type, garissa_id, 'REGISTERED', '2024-01-20', 'Garissa Town Center', 'P.O. Box 100, Garissa', 'info@garissalivestock.coop', '+254-722-007-101', 850, 42000000, true)
  RETURNING id INTO coop_id;
  
  INSERT INTO cooperative_members (cooperative_id, member_number, full_name, id_number, phone, shares_owned, share_value, date_joined, is_active)
  VALUES 
    (coop_id, 'MEM/007/0001', 'Yusuf Abdi', '678901001', '+254-722-140-401', 790, 900, '2024-02-08', true),
    (coop_id, 'MEM/007/0002', 'Amina Hassan', '678901002', '+254-722-140-402', 560, 810, '2024-02-22', true),
    (coop_id, 'MEM/007/0003', 'Mohamed Ibrahim', '678901003', '+254-722-140-403', 680, 750, '2024-01-25', true),
    (coop_id, 'MEM/007/0004', 'Halima Omar', '678901004', '+254-722-140-404', 430, 930, '2024-03-18', true);
  
  INSERT INTO compliance_reports (report_number, cooperative_id, financial_year, agm_held, agm_date, bylaws_compliant, meetings_compliant, records_compliant, financial_compliant, status, compliance_score, submitted_at)
  VALUES ('COMP/007/2024/0001', coop_id, 2024, true, '2024-08-18', true, true, true, true, 'SUBMITTED', 93, '2024-09-02');
  
  -- Cooperative 2: Dadaab Traders Cooperative
  INSERT INTO cooperatives (registration_number, name, type_id, tenant_id, status, registration_date, address, postal_address, email, phone, total_members, total_share_capital, is_active)
  VALUES ('COOP/007/2024/0002', 'Dadaab Traders Cooperative', marketing_type, garissa_id, 'REGISTERED', '2024-02-25', 'Dadaab Market', 'P.O. Box 200, Dadaab', 'info@dadaabtraders.coop', '+254-722-007-102', 520, 24000000, true)
  RETURNING id INTO coop_id;
  
  INSERT INTO cooperative_members (cooperative_id, member_number, full_name, id_number, phone, shares_owned, share_value, date_joined, is_active)
  VALUES 
    (coop_id, 'MEM/007/0005', 'Ahmed Ali', '678901005', '+254-722-140-405', 630, 840, '2024-03-12', true),
    (coop_id, 'MEM/007/0006', 'Fatima Yusuf', '678901006', '+254-722-140-406', 470, 720, '2024-03-28', true),
    (coop_id, 'MEM/007/0007', 'Hassan Farah', '678901007', '+254-722-140-407', 750, 670, '2024-02-30', true),
    (coop_id, 'MEM/007/0008', 'Mariam Said', '678901008', '+254-722-140-408', 340, 880, '2024-04-20', true),
    (coop_id, 'MEM/007/0009', 'Omar Mohamed', '678901009', '+254-722-140-409', 580, 790, '2024-05-15', true);
  
  INSERT INTO compliance_reports (report_number, cooperative_id, financial_year, agm_held, agm_date, bylaws_compliant, meetings_compliant, records_compliant, financial_compliant, status, compliance_score, submitted_at)
  VALUES ('COMP/007/2024/0002', coop_id, 2024, true, '2024-07-28', true, true, true, true, 'SUBMITTED', 91, '2024-08-15');
  
  -- Cooperative 3: Garissa Transport SACCO
  INSERT INTO cooperatives (registration_number, name, type_id, tenant_id, status, registration_date, address, postal_address, email, phone, total_members, total_share_capital, is_active)
  VALUES ('COOP/007/2024/0003', 'Garissa Transport SACCO', transport_type, garissa_id, 'REGISTERED', '2024-03-18', 'Garissa Stage', 'P.O. Box 300, Garissa', 'info@garissatransport.coop', '+254-722-007-103', 380, 28000000, true)
  RETURNING id INTO coop_id;
  
  INSERT INTO cooperative_members (cooperative_id, member_number, full_name, id_number, phone, shares_owned, share_value, date_joined, is_active)
  VALUES 
    (coop_id, 'MEM/007/0010', 'Abdi Hussein', '678901010', '+254-722-140-410', 870, 960, '2024-04-10', true),
    (coop_id, 'MEM/007/0011', 'Khadija Ahmed', '678901011', '+254-722-140-411', 620, 820, '2024-04-28', true),
    (coop_id, 'MEM/007/0012', 'Ibrahim Ali', '678901012', '+254-722-140-412', 490, 740, '2024-03-25', true);
  
  INSERT INTO compliance_reports (report_number, cooperative_id, financial_year, agm_held, agm_date, bylaws_compliant, meetings_compliant, records_compliant, financial_compliant, status, compliance_score, submitted_at)
  VALUES ('COMP/007/2024/0003', coop_id, 2024, true, '2024-09-10', true, true, true, true, 'SUBMITTED', 95, '2024-09-24');
  
  -- Cooperative 4: Ijara Camel Herders
  INSERT INTO cooperatives (registration_number, name, type_id, tenant_id, status, registration_date, address, postal_address, email, phone, total_members, total_share_capital, is_active)
  VALUES ('COOP/007/2024/0004', 'Ijara Camel Herders', agric_type, garissa_id, 'REGISTERED', '2024-04-12', 'Ijara Township', 'P.O. Box 400, Ijara', 'info@ijaracamel.coop', '+254-722-007-104', 290, 16000000, true)
  RETURNING id INTO coop_id;
  
  INSERT INTO cooperative_members (cooperative_id, member_number, full_name, id_number, phone, shares_owned, share_value, date_joined, is_active)
  VALUES 
    (coop_id, 'MEM/007/0013', 'Aden Mohamed', '678901013', '+254-722-140-413', 720, 880, '2024-05-05', true),
    (coop_id, 'MEM/007/0014', 'Nimo Hassan', '678901014', '+254-722-140-414', 530, 710, '2024-05-22', true),
    (coop_id, 'MEM/007/0015', 'Yusuf Omar', '678901015', '+254-722-140-415', 410, 950, '2024-04-20', true),
    (coop_id, 'MEM/007/0016', 'Rahma Abdi', '678901016', '+254-722-140-416', 680, 640, '2024-06-10', true);
  
  INSERT INTO compliance_reports (report_number, cooperative_id, financial_year, agm_held, agm_date, bylaws_compliant, meetings_compliant, records_compliant, financial_compliant, status, compliance_score, submitted_at)
  VALUES ('COMP/007/2024/0004', coop_id, 2024, true, '2024-08-25', true, false, true, true, 'SUBMITTED', 82, '2024-09-08');
  
  -- Cooperative 5: Garissa Business Hub
  INSERT INTO cooperatives (registration_number, name, type_id, tenant_id, status, registration_date, address, postal_address, email, phone, total_members, total_share_capital, is_active)
  VALUES ('COOP/007/2024/0005', 'Garissa Business Hub', multipurpose_type, garissa_id, 'REGISTERED', '2024-05-22', 'Garissa CBD', 'P.O. Box 500, Garissa', 'info@garissabusiness.coop', '+254-722-007-105', 640, 35000000, true)
  RETURNING id INTO coop_id;
  
  INSERT INTO cooperative_members (cooperative_id, member_number, full_name, id_number, phone, shares_owned, share_value, date_joined, is_active)
  VALUES 
    (coop_id, 'MEM/007/0017', 'Hassan Aden', '678901017', '+254-722-140-417', 930, 910, '2024-06-08', true),
    (coop_id, 'MEM/007/0018', 'Amina Ibrahim', '678901018', '+254-722-140-418', 640, 780, '2024-06-25', true),
    (coop_id, 'MEM/007/0019', 'Mohamed Hussein', '678901019', '+254-722-140-419', 510, 860, '2024-05-30', true);
  
  INSERT INTO compliance_reports (report_number, cooperative_id, financial_year, agm_held, agm_date, bylaws_compliant, meetings_compliant, records_compliant, financial_compliant, status, compliance_score, submitted_at)
  VALUES ('COMP/007/2024/0005', coop_id, 2024, true, '2024-09-20', true, true, true, false, 'SUBMITTED', 88, '2024-10-03');
  
  -- Registration Applications for Garissa
  INSERT INTO registration_applications (application_number, proposed_name, type_id, tenant_id, proposed_members, contact_person, contact_phone, contact_email, status, submitted_at)
  VALUES 
    ('APP/007/2024/0001', 'Dadaab Women Cooperative', multipurpose_type, garissa_id, 40, 'Halima Yusuf', '+254-722-150-001', 'halima.y@example.com', 'SUBMITTED', '2024-10-06'),
    ('APP/007/2024/0002', 'Garissa Youth SACCO', sacco_type, garissa_id, 35, 'Ahmed Farah', '+254-722-150-002', 'ahmed.f@example.com', 'APPROVED', '2024-09-24');
  
  -- ================================================================
  -- MANDERA COUNTY (009)
  -- ================================================================
  RAISE NOTICE 'Seeding Mandera County...';
  
  UPDATE tenants SET contact_email = 'info@mandera.go.ke', contact_phone = '+254-722-100-009', address = 'Mandera Town, Mandera County' WHERE id = mandera_id;
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'admin1.mandera@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Aden Yusuf"}', 'authenticated', 'authenticated');
  INSERT INTO users VALUES (user_id, 'admin1.mandera@cmis.go.ke', 'Aden Yusuf', '+254-722-009-001', mandera_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, mandera_id, 'COUNTY_ADMIN', true);
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'admin2.mandera@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Amina Hassan"}', 'authenticated', 'authenticated');
  INSERT INTO users VALUES (user_id, 'admin2.mandera@cmis.go.ke', 'Amina Hassan', '+254-722-009-002', mandera_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, mandera_id, 'COUNTY_ADMIN', true);
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'officer1.mandera@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Mohamed Abdi"}', 'authenticated', 'authenticated');
  INSERT INTO users VALUES (user_id, 'officer1.mandera@cmis.go.ke', 'Mohamed Abdi', '+254-722-009-003', mandera_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, mandera_id, 'COUNTY_OFFICER', true);
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'officer2.mandera@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Khadija Omar"}', 'authenticated', 'authenticated');
  INSERT INTO users VALUES (user_id, 'officer2.mandera@cmis.go.ke', 'Khadija Omar', '+254-722-009-004', mandera_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, mandera_id, 'COUNTY_OFFICER', true);
  
  user_id := gen_random_uuid();
  INSERT INTO auth.users VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'officer3.mandera@cmis.go.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ibrahim Ali"}', 'authenticated', 'authenticated');
  INSERT INTO users VALUES (user_id, 'officer3.mandera@cmis.go.ke', 'Ibrahim Ali', '+254-722-009-005', mandera_id);
  INSERT INTO user_roles (user_id, tenant_id, role, is_active) VALUES (user_id, mandera_id, 'COUNTY_OFFICER', true);
  
  -- Cooperative 1: Mandera Border Traders
  INSERT INTO cooperatives (registration_number, name, type_id, tenant_id, status, registration_date, address, postal_address, email, phone, total_members, total_share_capital, is_active)
  VALUES ('COOP/009/2024/0001', 'Mandera Border Traders', marketing_type, mandera_id, 'REGISTERED', '2024-01-22', 'Mandera Market', 'P.O. Box 100, Mandera', 'info@manderatraders.coop', '+254-722-009-101', 620, 32000000, true)
  RETURNING id INTO coop_id;
  
  INSERT INTO cooperative_members (cooperative_id, member_number, full_name, id_number, phone, shares_owned, share_value, date_joined, is_active)
  VALUES 
    (coop_id, 'MEM/009/0001', 'Abdullahi Aden', '789012001', '+254-722-160-501', 810, 920, '2024-02-10', true),
    (coop_id, 'MEM/009/0002', 'Safia Mohamed', '789012002', '+254-722-160-502', 580, 830, '2024-02-28', true),
    (coop_id, 'MEM/009/0003', 'Yusuf Ibrahim', '789012003', '+254-722-160-503', 700, 760, '2024-01-28', true),
    (coop_id, 'MEM/009/0004', 'Fatuma Abdi', '789012004', '+254-722-160-504', 460, 910, '2024-03-20', true);
  
  INSERT INTO compliance_reports (report_number, cooperative_id, financial_year, agm_held, agm_date, bylaws_compliant, meetings_compliant, records_compliant, financial_compliant, status, compliance_score, submitted_at)
  VALUES ('COMP/009/2024/0001', coop_id, 2024, true, '2024-08-22', true, true, true, true, 'SUBMITTED', 92, '2024-09-06');
  
  -- Cooperative 2: Elwak Livestock SACCO
  INSERT INTO cooperatives (registration_number, name, type_id, tenant_id, status, registration_date, address, postal_address, email, phone, total_members, total_share_capital, is_active)
  VALUES ('COOP/009/2024/0002', 'Elwak Livestock SACCO', sacco_type, mandera_id, 'REGISTERED', '2024-02-28', 'Elwak Town', 'P.O. Box 200, Elwak', 'info@elwaklivestock.coop', '+254-722-009-102', 490, 26000000, true)
  RETURNING id INTO coop_id;
  
  INSERT INTO cooperative_members (cooperative_id, member_number, full_name, id_number, phone, shares_owned, share_value, date_joined, is_active)
  VALUES 
    (coop_id, 'MEM/009/0005', 'Hassan Aden', '789012005', '+254-722-160-505', 640, 860, '2024-03-15', true),
    (coop_id, 'MEM/009/0006', 'Amina Yusuf', '789012006', '+254-722-160-506', 490, 730, '2024-03-30', true),
    (coop_id, 'MEM/009/0007', 'Omar Hassan', '789012007', '+254-722-160-507', 770, 690, '2024-03-05', true),
    (coop_id, 'MEM/009/0008', 'Halima Ibrahim', '789012008', '+254-722-160-508', 350, 870, '2024-04-22', true),
    (coop_id, 'MEM/009/0009', 'Abdi Mohamed', '789012009', '+254-722-160-509', 590, 800, '2024-05-18', true);
  
  INSERT INTO compliance_reports (report_number, cooperative_id, financial_year, agm_held, agm_date, bylaws_compliant, meetings_compliant, records_compliant, financial_compliant, status, compliance_score, submitted_at)
  VALUES ('COMP/009/2024/0002', coop_id, 2024, true, '2024-07-30', true, true, false, true, 'SUBMITTED', 89, '2024-08-16');
  
  -- Cooperative 3: Mandera Transport Union
  INSERT INTO cooperatives (registration_number, name, type_id, tenant_id, status, registration_date, address, postal_address, email, phone, total_members, total_share_capital, is_active)
  VALUES ('COOP/009/2024/0003', 'Mandera Transport Union', transport_type, mandera_id, 'REGISTERED', '2024-03-20', 'Mandera Stage', 'P.O. Box 300, Mandera', 'info@manderatransport.coop', '+254-722-009-103', 320, 22000000, true)
  RETURNING id INTO coop_id;
  
  INSERT INTO cooperative_members (cooperative_id, member_number, full_name, id_number, phone, shares_owned, share_value, date_joined, is_active)
  VALUES 
    (coop_id, 'MEM/009/0010', 'Mohamed Hussein', '789012010', '+254-722-160-510', 890, 940, '2024-04-12', true),
    (coop_id, 'MEM/009/0011', 'Nimo Ali', '789012011', '+254-722-160-511', 630, 810, '2024-04-30', true),
    (coop_id, 'MEM/009/0012', 'Ibrahim Aden', '789012012', '+254-722-160-512', 510, 750, '2024-03-28', true);
  
  INSERT INTO compliance_reports (report_number, cooperative_id, financial_year, agm_held, agm_date, bylaws_compliant, meetings_compliant, records_compliant, financial_compliant, status, compliance_score, submitted_at)
  VALUES ('COMP/009/2024/0003', coop_id, 2024, true, '2024-09-14', true, true, true, true, 'SUBMITTED', 96, '2024-09-28');
  
  -- Cooperative 4: Rhamu Camel Keepers
  INSERT INTO cooperatives (registration_number, name, type_id, tenant_id, status, registration_date, address, postal_address, email, phone, total_members, total_share_capital, is_active)
  VALUES ('COOP/009/2024/0004', 'Rhamu Camel Keepers', agric_type, mandera_id, 'REGISTERED', '2024-04-18', 'Rhamu Township', 'P.O. Box 400, Rhamu', 'info@rhamucamel.coop', '+254-722-009-104', 270, 14000000, true)
  RETURNING id INTO coop_id;
  
  INSERT INTO cooperative_members (cooperative_id, member_number, full_name, id_number, phone, shares_owned, share_value, date_joined, is_active)
  VALUES 
    (coop_id, 'MEM/009/0013', 'Ahmed Omar', '789012013', '+254-722-160-513', 730, 870, '2024-05-10', true),
    (coop_id, 'MEM/009/0014', 'Rahma Yusuf', '789012014', '+254-722-160-514', 540, 720, '2024-05-28', true),
    (coop_id, 'MEM/009/0015', 'Yusuf Hassan', '789012015', '+254-722-160-515', 420, 960, '2024-04-25', true),
    (coop_id, 'MEM/009/0016', 'Khadija Abdi', '789012016', '+254-722-160-516', 690, 630, '2024-06-15', true);
  
  INSERT INTO compliance_reports (report_number, cooperative_id, financial_year, agm_held, agm_date, bylaws_compliant, meetings_compliant, records_compliant, financial_compliant, status, compliance_score, submitted_at)
  VALUES ('COMP/009/2024/0004', coop_id, 2024, true, '2024-09-05', true, false, true, true, 'SUBMITTED', 81, '2024-09-20');
  
  -- Cooperative 5: Mandera Business Cooperative
  INSERT INTO cooperatives (registration_number, name, type_id, tenant_id, status, registration_date, address, postal_address, email, phone, total_members, total_share_capital, is_active)
  VALUES ('COOP/009/2024/0005', 'Mandera Business Cooperative', multipurpose_type, mandera_id, 'REGISTERED', '2024-05-25', 'Mandera CBD', 'P.O. Box 500, Mandera', 'info@manderabusiness.coop', '+254-722-009-105', 580, 38000000, true)
  RETURNING id INTO coop_id;
  
  INSERT INTO cooperative_members (cooperative_id, member_number, full_name, id_number, phone, shares_owned, share_value, date_joined, is_active)
  VALUES 
    (coop_id, 'MEM/009/0017', 'Aden Ibrahim', '789012017', '+254-722-160-517', 960, 900, '2024-06-12', true),
    (coop_id, 'MEM/009/0018', 'Safia Hassan', '789012018', '+254-722-160-518', 670, 770, '2024-06-30', true),
    (coop_id, 'MEM/009/0019', 'Hussein Mohamed', '789012019', '+254-722-160-519', 530, 840, '2024-06-05', true);
  
  INSERT INTO compliance_reports (report_number, cooperative_id, financial_year, agm_held, agm_date, bylaws_compliant, meetings_compliant, records_compliant, financial_compliant, status, compliance_score, submitted_at)
  VALUES ('COMP/009/2024/0005', coop_id, 2024, true, '2024-09-25', true, true, true, false, 'SUBMITTED', 87, '2024-10-07');
  
  -- Registration Applications for Mandera
  INSERT INTO registration_applications (application_number, proposed_name, type_id, tenant_id, proposed_members, contact_person, contact_phone, contact_email, status, submitted_at)
  VALUES 
    ('APP/009/2024/0001', 'Elwak Women Empowerment', multipurpose_type, mandera_id, 38, 'Amina Aden', '+254-722-170-001', 'amina.a@example.com', 'SUBMITTED', '2024-10-07'),
    ('APP/009/2024/0002', 'Mandera Youth SACCO', sacco_type, mandera_id, 27, 'Mohamed Omar', '+254-722-170-002', 'mohamed.o@example.com', 'UNDER_REVIEW', '2024-10-01');
  
  RAISE NOTICE 'Part 2 seeding completed successfully! All 7 counties with members, applications, and compliance reports added.';
  
END $$;

-- Verify all counties from Part 2
SELECT 
  t.name as county,
  t.county_code,
  COUNT(DISTINCT CASE WHEN ur.role = 'COUNTY_ADMIN' THEN ur.id END) as admins,
  COUNT(DISTINCT CASE WHEN ur.role = 'COUNTY_OFFICER' THEN ur.id END) as officers,
  COUNT(DISTINCT c.id) as cooperatives,
  COUNT(DISTINCT cm.id) as total_members,
  COUNT(DISTINCT ra.id) as applications,
  COUNT(DISTINCT cr.id) as compliance_reports
FROM tenants t
LEFT JOIN user_roles ur ON ur.tenant_id = t.id AND ur.is_active = true
LEFT JOIN cooperatives c ON c.tenant_id = t.id
LEFT JOIN cooperative_members cm ON cm.cooperative_id = c.id
LEFT JOIN registration_applications ra ON ra.tenant_id = t.id
LEFT JOIN compliance_reports cr ON cr.cooperative_id = c.id
WHERE t.county_code IN ('004', '003', '028', '020', '023', '007', '009')
GROUP BY t.name, t.county_code
ORDER BY t.county_code;
