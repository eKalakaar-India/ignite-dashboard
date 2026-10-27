import { supabase } from '../../config/supabase.js'

const getOverviewData = async () => {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

const getAllSessions = async () => {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      id,
      session_date,
      state,
      district,
      type_of_outreach,
      type_of_session,
      male_students,
      female_students,
      other_students,
      pwd_students,
      male_parents,
      female_parents,
      other_parents,
      female_staff,
      male_staff,
      other_staff,
      female_community_members,
      male_community_members,
      other_community_members,
      status
    `)
    .order('session_date', {
      ascending: true,
    })

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

const getPerformanceData = async () => {
  const sessionFields = `
    id,
    session_date,
    status,
    state,
    district,
    type_of_outreach,
    type_of_session,
    name_of_session,
    ITI_code,
    observation,
    remarks,
    ITI_name,
    iti_rep_name,
    iti_rep_contact,
    school_rep_name,
    school_rep_contact,
    block,
    gram_panchayat,
    address,
    expert_id,
    attendance_sheets_links,
    feedback_forms_links,
    consent_forms_links,
    "geo-taggedPhotos_links",
    IEC_materials_photos_links,
    session_images_links,
    session_videos_links,
    total_iec_materials_distributed,
    total_feedbackform_filled,
    male_students,
    female_students,
    other_students,
    pwd_students,
    male_parents,
    female_parents,
    other_parents,
    female_staff,
    male_staff,
    other_staff,
    female_community_members,
    male_community_members,
    other_community_members
  `
  const pageSize = 1000
  const sessions = []
  const qualitativeReports = []

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('sessions')
      .select(sessionFields)
      .order('session_date', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1)

    if (error) throw new Error(`Unable to fetch performance sessions: ${error.message}`)
    sessions.push(...(data || []))
    if (!data || data.length < pageSize) break
  }

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('qualitative_reports')
      .select('id, session_id, outreach_type, assesment_data, direct_quotes, remarks')
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1)

    if (error) throw new Error(`Unable to fetch performance qualitative reports: ${error.message}`)
    qualitativeReports.push(...(data || []))
    if (!data || data.length < pageSize) break
  }

  return { sessions, qualitativeReports }
}

export default {
  getOverviewData,
  getAllSessions,
  getPerformanceData,
}