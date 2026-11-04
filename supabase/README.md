# Supabase database setup

The application project may be paused. Do not claim this schema is active until the project is resumed and the migration has been applied and tested.

## Provider profiles and skills

Migration:
`migrations/202611040001_profiles_and_provider_skills.sql`

It creates:
- `user_profiles`: one profile for each Supabase Auth user.
- `skill_categories`: predefined service/skill categories.
- `provider_skills`: a many-to-many relation between one user and their skills.

Row Level Security is enabled. Authenticated users can read provider directory information and categories; each user can only create, update, or delete their own profile/skill records. Do not add private email, password, or payment details to public profile tables.

## Apply and verify

1. Confirm the Supabase project is active and the project reference matches `lib/supabase.ts`.
2. Review the migration in Supabase SQL Editor before applying it.
3. Apply the migration once.
4. Verify a new Auth user receives a `user_profiles` row.
5. Verify one user cannot edit another user's profile or provider skills.
6. Verify categories are readable by authenticated users.
7. Only then connect the app screens to these tables.

This migration does not activate payments, payment collection, commission deductions, or provider payouts.
