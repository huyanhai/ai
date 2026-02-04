import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "@/constants/env";
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  SUPABASE_URL || "",
  SUPABASE_SERVICE_ROLE_KEY || "",
);
