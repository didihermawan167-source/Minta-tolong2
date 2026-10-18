
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://debiinwglybnjmtsaepj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable__07uLKSwKXpxm_hlZ5wnBg_3qAllIoD";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
