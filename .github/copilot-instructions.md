# Minta Tolong — Repository Instructions

## Mission
Build and finish the Android app "Minta Tolong" so the owner can install and use an APK on a Redmi Android phone.

## Product direction (owner decision, 30 October 2026)
- One account per user.
- People who need help can create a help request.
- People with skills can register under skill categories and be contacted directly.
- Remove the old fixed 200 m–2 km radius limitation.
- The platform should handle payments and deduct its commission; do not design cash hand-off as the required default.
- The product should make it easier to remember to ask for help when needed.

## Work rules
- Work from the existing repository and current main branch. Do not recreate the app or ask the owner to register another account.
- The owner operates from an Android Redmi phone and needs short, clear Indonesian instructions. Prefer changes that can be committed directly and tested in GitHub Actions.
- No paid API services. Do not add paid AI APIs, paid hosting, or new recurring costs.
- Supabase project may be paused. Do not claim backend features work until a reachable project and successful integration test prove it. Do not expose service-role keys or secrets.
- Preserve Expo Router and existing app structure unless a justified migration is required.
- Never invent successful tests, emulator runs, APK artifacts, or installation results.
- Every code change must include relevant static checks/tests. Keep changes small and reviewable.
- Do not remove user data, publish releases, make payments, or enable production payment processing without explicit owner approval.
- Payment integration must remain sandbox/design-only until provider credentials, legal requirements, and owner approval are confirmed.
- Prefer Indonesian UI text.
- Keep Android permissions minimal and explain any new permission.

## Definition of done
A feature is done only when code is committed, applicable checks pass, and the evidence is linked in the report. An APK is ready only when a build artifact exists and QC confirms install + launch; a real Redmi installation still needs owner confirmation.
