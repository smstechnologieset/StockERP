-- ==============================================================================
-- Grain & Powder Trading ERP - Test Users Seed Script
-- Run this in Supabase SQL Editor to create Owner/Manager and Staff test accounts.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
  v_manager_id UUID := 'a0000000-0000-0000-0000-000000000001';
  v_staff_id   UUID := 'a0000000-0000-0000-0000-000000000002';
BEGIN
  -- ---------------------------------------------------------------------------
  -- 1. OWNER / MANAGER TEST USER
  -- Email:    manager@stockerp.et
  -- Password: Password123!
  -- Role:     owner_manager
  -- ---------------------------------------------------------------------------
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) VALUES (
    v_manager_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'manager@stockerp.et',
    crypt('Password123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Ato Dawit Manager","role":"owner_manager"}'::jsonb,
    now(),
    now(),
    '',
    ''
  )
  ON CONFLICT (id) DO UPDATE
  SET
    encrypted_password = crypt('Password123!', gen_salt('bf')),
    raw_user_meta_data = '{"full_name":"Ato Dawit Manager","role":"owner_manager"}'::jsonb,
    email_confirmed_at = now();

  -- Insert/Update Manager in public.profiles
  INSERT INTO public.profiles (id, full_name, role, branch_id)
  VALUES (
    v_manager_id,
    'Ato Dawit Manager',
    'owner_manager',
    '00000000-0000-0000-0000-000000000001'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = 'Ato Dawit Manager',
    role = 'owner_manager',
    branch_id = '00000000-0000-0000-0000-000000000001';

  -- ---------------------------------------------------------------------------
  -- 2. STAFF TEST USER
  -- Email:    staff@stockerp.et
  -- Password: Password123!
  -- Role:     staff
  -- ---------------------------------------------------------------------------
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) VALUES (
    v_staff_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'staff@stockerp.et',
    crypt('Password123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"W/ro Tigist Staff","role":"staff"}'::jsonb,
    now(),
    now(),
    '',
    ''
  )
  ON CONFLICT (id) DO UPDATE
  SET
    encrypted_password = crypt('Password123!', gen_salt('bf')),
    raw_user_meta_data = '{"full_name":"W/ro Tigist Staff","role":"staff"}'::jsonb,
    email_confirmed_at = now();

  -- Insert/Update Staff in public.profiles
  INSERT INTO public.profiles (id, full_name, role, branch_id)
  VALUES (
    v_staff_id,
    'W/ro Tigist Staff',
    'staff',
    '00000000-0000-0000-0000-000000000001'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = 'W/ro Tigist Staff',
    role = 'staff',
    branch_id = '00000000-0000-0000-0000-000000000001';

END $$;
