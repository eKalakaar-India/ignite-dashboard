import { supabase } from '../../config/supabase.js';
import ApiError from '../../utils/ApiError.js';
import { HTTP_STATUS } from '../../utils/constants.js';


class AuthRepository {
  constructor() {
    this.table = 'sessions';
  }

  async createSession(payload) {
    const { data, error } = await supabase.from(this.table).insert(payload).select().single();
    if (error) throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Unable to create session', [{ field: 'session', message: error.message }]);
    return data;
  }

  async createQualitativeAnalysis(payload) {
    const { data, error } = await supabase
      .from('qualitative_reports')
      .upsert(
        {
          session_id: payload.session_id,
          outreach_type: payload.outreach_type,
          assesment_data: payload.assesment_data,
          direct_quotes: payload.direct_quotes,
          remarks: payload.remarks ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'session_id,outreach_type' }
      )
      .select()
      .single();
    if (error) {
      throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Unable to save qualitative report', [
        { field: 'qualitative_report', message: error.message },
      ]);
    }
    return data;
  }

  async fetchSessionById(sessionID) {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', sessionID)
      .single();
    if (error) {
      const status = error.code === 'PGRST116' ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.INTERNAL_SERVER_ERROR;
      throw new ApiError(status, 'Unable to fetch session', [{ field: 'session', message: error.message }]);
    }
    return data;
  }

  async fetchSessionMediaByIds(sessionIDs) {
    const { data, error } = await supabase
      .from(this.table)
      .select(`
        id,
        attendance_sheets_links,
        feedback_forms_links,
        consent_forms_links,
        "geo-taggedPhotos_links",
        IEC_materials_photos_links,
        session_images_links,
        session_videos_links
      `)
      .in('id', sessionIDs);
    if (error) {
      throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Unable to fetch session media', [
        { field: 'session_media', message: error.message },
      ]);
    }
    return data || [];
  }

  async updateSession(payload, sessionID) {
    const { data, error } = await supabase.from(this.table).update({
            ...payload,
            updated_at: new Date().toISOString()
        }).eq('id', sessionID).select().single();
    if (error) throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Unable to update session', [{ field: 'session', message: error.message }]);
    return data;

  }

  async deleteQualitativeAnalysis(sessionID, outreachType) {
    const { error } = await supabase
      .from('qualitative_reports')
      .delete()
      .eq('session_id', sessionID)
      .eq('outreach_type', outreachType);
    if (error) {
      throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Unable to roll back qualitative report', [
        { field: 'qualitative_report', message: error.message },
      ]);
    }
  }

  async deleteSession(sessionID) {
    const { error } = await supabase.from(this.table).delete().eq('id', sessionID);
    if (error) {
      throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Unable to roll back session creation', [
        { field: 'session', message: error.message },
      ]);
    }
  }

  async fetchSessionsByExperts(expertID){
    const { data, error } = await supabase.from(this.table).select('*, expert_data:afc_giz_users!sessions_expert_id_fkey(name, email, phone_no)').eq('expert_id', expertID).order('session_date', { ascending: false });

    if (error) {
        throw new Error(
        `Unable to fetch All sessions: ${error.message}`
        );
    }

    return data;
  }

  async fetchAllSessions(){
    const { data, error } = await supabase.from(this.table).select('*, expert_data:afc_giz_users!sessions_expert_id_fkey(name, email, phone_no)').order('session_date', { ascending: false });

    if (error) {
        throw new Error(
        `Unable to fetch All sessions: ${error.message}`
        );
    }

    return data;

  }

  async fetchDailyReportSession(){
    const today = new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase
        .from(this.table)
        .select("*")
        .eq("session_date", today)
        .order("session_date", { ascending: false });

    if (error) {
        throw new Error(
        `Unable to fetch today's sessions: ${error.message}`
        );
    }

    return data;
  }

}

export default AuthRepository;
