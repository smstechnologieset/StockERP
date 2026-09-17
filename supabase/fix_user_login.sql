-- ==============================================================================
-- StockERP - FIX USER LOGIN / RESET PASSWORD FOR EXISTING USER
-- ==============================================================================
-- Use this when a user was created via SQL but cannot log in ("Invalid login").
-- This resets their password and ensures all auth fields are correctly set.
--
-- Steps:
--   1. Set v_email and v_new_password below
--   2. Supabase Dashboard → SQL Editor → New query → Run
-- ==============================================================================

DO $$
DECLARE
    -- ┌─────────────────────────────────────────────────────┐
    -- │  EDIT THESE TWO VALUES BEFORE RUNNING               │
    -- └─────────────────────────────────────────────────────┘
    v_email        TEXT := 'zinabm2121@gmail.com';  -- ← The user's email
    v_new_password TEXT := 'stock@456';             -- ← Their password (can keep same)
    -- ──────────────────────────────────────────────────────

    v_user_id UUID;
BEGIN
    -- Find the user
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No user found with email "%". Check the email and try again.', v_email;
    END IF;

    -- Fix all required GoTrue fields in one update
    UPDATE auth.users
    SET
        encrypted_password    = crypt(v_new_password, gen_salt('bf')),
        email_confirmed_at    = COALESCE(email_confirmed_at, now()),
        aud                   = 'authenticated',
        role                  = 'authenticated',
        raw_app_meta_data     = COALESCE(
                                  NULLIF(raw_app_meta_data::text, 'null')::jsonb,
                                  '{"provider":"email","providers":["email"]}'::jsonb
                                ),
        updated_at            = now()
    WHERE id = v_user_id;

    -- Make sure a valid identity row exists
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
    ON CONFLICT (provider_id, provider) DO UPDATE
    SET
        identity_data = json_build_object('sub', v_user_id::text, 'email', v_email)::jsonb,
        updated_at    = now();

    -- Make sure a profile row exists with the correct role
    INSERT INTO public.profiles (id, full_name, role, branch_id)
    SELECT
        v_user_id,
        COALESCE(raw_user_meta_data->>'full_name', split_part(v_email, '@', 1)),
        COALESCE((raw_user_meta_data->>'role')::public.app_role, 'owner_manager'::public.app_role),
        '00000000-0000-0000-0000-000000000001'
    FROM auth.users WHERE id = v_user_id
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE '✅ User fixed successfully!';
    RAISE NOTICE '   Email:    %', v_email;
    RAISE NOTICE '   Password: %  (can now log in)', v_new_password;
    RAISE NOTICE '   User ID:  %', v_user_id;
END $$;
