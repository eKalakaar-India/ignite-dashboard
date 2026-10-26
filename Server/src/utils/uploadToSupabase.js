import { supabase } from "../config/supabase.js";

export const uploadToSupabase = async ( fileBuffer, filePath, mimeType) => {

    console.log({
    filePath,
    mimeType,
    bufferType: Buffer.isBuffer(fileBuffer),
    });

    const { error } = await supabase

        .storage

        .from(process.env.SUPABASE_BUCKET)

        .upload( filePath, fileBuffer, {
                contentType: mimeType,
                upsert: false
            }
        );

    if (error) {
        throw error;
    }

    const { data } = supabase.storage.from(process.env.SUPABASE_BUCKET).getPublicUrl(filePath);

    return {

        storagePath: filePath,

        publicUrl: data.publicUrl
    };
};