-- ==============================================================================
-- StockERP - ADD NEW MANAGER ACCOUNT
-- ==============================================================================
-- ⚠️  RECOMMENDED METHOD (avoids GoTrue errors):
--      Use Supabase Dashboard → Authentication → Users → "Add user"
--      → "Create new user" → tick "Auto confirm user" → Create.
--      Then run the Step 3 SQL below to set their manager role.
--
-- ALTERNATIVE (SQL-only, use if Dashboard is unavailable):
--      Edit the variables below and run in Supabase SQL Editor.
-- ==============================================================================

DO $$
DECLARE
    -- ┌─────────────────────────────────────────────────────┐
    -- │  EDIT THESE FOUR VALUES BEFORE RUNNING              │
    -- └─────────────────────────────────────────────────────┘
    v_email     TEXT    := 'newmanager@yourstore.et';   -- ← Change to real email
    v_password  TEXT    := 'Manager@123456';             -- ← Change to a strong password
    v_full_name TEXT    := 'New Manager Name';           -- ← Change to their full name
    v_user_id   UUID    := gen_random_uuid();            -- ← Leave as-is (auto-generates)
    -- ──────────────────────────────────────────────────────

    v_existing_id UUID;
BEGIN
    -- Safety check: abort if email already exists
    SELECT id INTO v_existing_id FROM auth.users WHERE email = v_email;
    IF FOUND THEN
        RAISE EXCEPTION 'User with email "%" already exists (id: %). Aborting.', v_email, v_existing_id;
    END IF;

    -- 1. Create the auth user
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
        v_user_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_password, gen_salt('bf')),
        now(),                          -- email pre-confirmed (confirmed_at is auto-generated)
        '{"provider":"email","providers":["email"]}'::jsonb,
        json_build_object('full_name', v_full_name, 'role', 'owner_manager')::jsonb,
        now(),
        now(),
        '',
        ''
    );

    -- 2. Create the Supabase identity row (required for GoTrue auth to work)
    INSERT INTO auth.identities (
        id,
        user_id,
        provider_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        v_user_id,
        v_user_id::text,
        json_build_object('sub', v_user_id::text, 'email', v_email)::jsonb,
        'email',
        now(),
        now(),
        now()
    )
    ON CONFLICT (provider_id, provider) DO NOTHING;

    -- 3. Create the app profile with owner_manager role
    INSERT INTO public.profiles (id, full_name, role, branch_id)
    VALUES (
        v_user_id,
        v_full_name,
        'owner_manager',
        '00000000-0000-0000-0000-000000000001'  -- Main Branch
    )
    ON CONFLICT (id) DO UPDATE
    SET
        full_name = EXCLUDED.full_name,
        role      = 'owner_manager';

    RAISE NOTICE '✅ Manager account created successfully!';
    RAISE NOTICE '   Name:     %', v_full_name;
    RAISE NOTICE '   Email:    %', v_email;
    RAISE NOTICE '   Password: %  (share securely)', v_password;
    RAISE NOTICE '   User ID:  %', v_user_id;
    RAISE NOTICE '   Role:     owner_manager (full access)';
END $$;
