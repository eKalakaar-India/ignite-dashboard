import { supabase } from "../config/supabase.js";

export const deleteFromSupabase = async (storagePath) => {

    await supabase

        .storage

        .from(process.env.SUPABASE_BUCKET)

        .remove([storagePath]);
};