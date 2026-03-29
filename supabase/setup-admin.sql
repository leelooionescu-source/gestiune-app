-- Create admin auth user directly in Supabase auth schema

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@gestiune.app',
  crypt('Admin123!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
SELECT gen_random_uuid(), id, email,
  json_build_object('email', email, 'sub', id::text, 'email_verified', true),
  'email', NOW(), NOW(), NOW()
FROM auth.users WHERE email = 'admin@gestiune.app'
ON CONFLICT DO NOTHING;

INSERT INTO utilizatori (auth_user_id, username, nume, is_admin)
SELECT id, 'admin@gestiune.app', 'Administrator', true
FROM auth.users WHERE email = 'admin@gestiune.app'
ON CONFLICT (auth_user_id) DO NOTHING;
