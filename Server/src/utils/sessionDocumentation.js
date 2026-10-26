const hasLinks = (session, field) =>
  Array.isArray(session[field]) && session[field].length > 0

export const getSessionDocumentationStatus = (session) => {
  const allRequiredDocumentsPresent =
    hasLinks(session, 'attendance_sheets_links') &&
    hasLinks(session, 'consent_forms_links') &&
    hasLinks(session, 'feedback_forms_links') &&
    (Number(session.total_iec_materials_distributed || 0) > 0 ||
      hasLinks(session, 'IEC_materials_photos_links')) &&
    hasLinks(session, 'geo-taggedPhotos_links')

  return allRequiredDocumentsPresent ? 'Completed' : 'Needs Attention'
}
