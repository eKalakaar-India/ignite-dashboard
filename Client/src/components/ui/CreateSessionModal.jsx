import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays,
  Camera,
  ClipboardList,
  MapPin,
  MessageSquareText,
  School,
  UsersRound,
  X,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { useAFCStore } from "../../store/afcStore";
import { getStates, getClustersByState, getITIsByCluster } from "../../data/ITIData.js";
import QualitativeAssessmentFields from "./QualitativeAssessmentFields.jsx";
import {
  createAssessmentData,
  hasAssessmentResponses,
  normalizeAssessmentData,
} from "../../utils/qualitativeAssessment.js";

const SESSION_TYPES = [
  { value: "School Outreach", category: "School" },
  // { value: "School Session- Principal/Teacher", category: "School" },
  { value: "Community Outreach", category: "Community" },
  { value: "School Visit", category: "School" },
  { value: "ITI Visit", category: "School" },
];
const LEGACY_OUTREACH_TYPES = {
  "School girls": "School Sessions- Girl Students",
  Staff: "School Session- Principal/Teacher",
  Community: "Community session",
};
const MEDIA_FIELDS = [
  "attendance_sheets_links",
  "feedback_forms_links",
  "geo-taggedPhotos_links",
  "IEC_materials_photos_links",
  "consent_forms_links",
  "session_images_links",
  "session_videos_links",
];
const STUDENT_FIELDS = ["male_students", "female_students", "other_students", "pwd_students"];
const STAFF_FIELDS = ["female_staff", "male_staff", "other_staff"];
const PARENT_FIELDS = ["male_parents", "female_parents", "other_parents"];
const COMMUNITY_FIELDS = [
  "female_community_members",
  "male_community_members",
  "other_community_members",
];
const MAX_IMAGE_COUNT = 5;
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const UPLOAD_CATEGORIES = [
  // { key: "session_images", label: "Session images", folder: "session_media/images" },
  { key: "geo_tagged_photos", label: "Geo-tagged photos", folder: "geo-taggedPhotos" },
  { key: "attendance_sheets", label: "Attendance sheet / Consent form", folder: "attendance_sheets" },
  // { key: "consent_forms", label: "Consent form", folder: "consent_forms" },
  { key: "feedback_forms", label: "Feedback form", folder: "feedback_forms" },
];

function createDefaultValues() {
  return {
    session_date: "",
    state: "",
    district: "",
    session_activity: "",
    name_of_session: "",
    remarks: "",
    observation: "",
    expert_id: "",
    total_iec_materials_distributed: 0,
    ITI_name: "NA",
    ITI_code: "NA",
    iti_rep_name: "",
    iti_rep_contact: null,
    block: "",
    gram_panchayat: "",
    address: "",
    assesment_data: createAssessmentData(),
    qualitative_remarks: "",
    direct_quotes: [],
    school_rep_name: "",
    school_rep_contact: null,
    ...Object.fromEntries(
      [...STUDENT_FIELDS, ...PARENT_FIELDS, ...STAFF_FIELDS, ...COMMUNITY_FIELDS]
        .map((field) => [field, null])
    ),
    ...Object.fromEntries(MEDIA_FIELDS.map((field) => [field, []])),
  };
}

function toFormValues(session) {
  if (!session) return createDefaultValues();
  return {
    ...createDefaultValues(),
    ...session,
    session_activity: SESSION_TYPES.some(({ value }) => value === session.type_of_outreach)
      ? session.type_of_outreach
      : LEGACY_OUTREACH_TYPES[session.type_of_outreach] ||
        (session.type_of_session === "Community" ? "Community session" : ""),
    assesment_data: normalizeAssessmentData(session.qualitative_report?.assesment_data),
    qualitative_remarks: session.qualitative_report?.remarks || "",
    direct_quotes: session.qualitative_report?.direct_quotes || [],
    session_date: session.session_date || "",
    expert_id: session.expert_id || "",
    ITI_name: session.ITI_name || "NA",
    ITI_code: session.ITI_code || "NA",
    ...Object.fromEntries(MEDIA_FIELDS.map((field) => [field, session[field] || []])),
  };
}

const nullableText = (value) => value?.trim() || null;
const nullableNumber = (value) => (value === "" || value == null || Number.isNaN(value) ? null : Number(value));

export function SessionForm({
  onSubmit,
  onCancel,
  submitLabel = "Create Session",
  initialSession = null,
}) {
  const [serverError, setServerError] = useState("");
  const [selectedUploads, setSelectedUploads] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});
  const [savedSessionId, setSavedSessionId] = useState(null);
  const [savedSession, setSavedSession] = useState(null);
  const uploadInputRefs = useRef({});
  const user = useAFCStore((store) => store.user);
  const createQualitativeAnalysis = useAFCStore((store) => store.createQualitativeAnalysis);
  const uploadImages = useAFCStore((store) => store.uploadImages);
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: toFormValues(initialSession), mode: "onBlur" });

  useEffect(() => {
    reset(toFormValues(initialSession));
    setServerError("");
    setSelectedUploads({});
    setUploadErrors({});
    setSavedSessionId(null);
    setSavedSession(null);
  }, [initialSession, reset]);

  const sessionActivity = watch("session_activity");
  const selectedSessionType = SESSION_TYPES.find(({ value }) => value === sessionActivity);
  const typeOfSession = selectedSessionType?.category || "";
  const isSchoolSession = sessionActivity === "School Outreach"
  const isCommunitySession = sessionActivity === "Community Outreach";
  const isVisit = sessionActivity === "School Visit" || sessionActivity === "ITI Visit";
  const selectedState = watch("state");
  const selectedDistrict = watch("district");
  const states = getStates();
  const districts = getClustersByState(selectedState);
  const itis = getITIsByCluster(selectedState, selectedDistrict);

  useEffect(() => {
    if (!isVisit) return;
    setSelectedUploads({});
    setUploadErrors({});
    Object.values(uploadInputRefs.current).forEach((input) => {
      if (input) input.value = "";
    });
  }, [isVisit]);

  const submitHandler = async (data) => {
    setServerError("");
    const isSchool = typeOfSession === "School";
    const payload = {
      session_date: data.session_date,
      state: data.state.trim(),
      district: data.district.trim(),
      type_of_session: typeOfSession,
      type_of_outreach: data.session_activity,
      name_of_session: data.name_of_session.trim(),
      remarks: nullableText(data.remarks),
      observation: nullableText(data.observation),
      expert_id: user?.id || null,
      attendance_sheets_links: data.attendance_sheets_links || [],
      feedback_forms_links: data.feedback_forms_links || [],
      "geo-taggedPhotos_links": data["geo-taggedPhotos_links"] || [],
      total_iec_materials_distributed: isVisit ? 0 : Number(data.total_iec_materials_distributed),
      total_feedbackform_filled: isVisit ? 0 : Number(data.total_feedbackform_filled),
      IEC_materials_photos_links: data.IEC_materials_photos_links || [],
      consent_forms_links: data.consent_forms_links || [],
      session_images_links: data.session_images_links || [],
      session_videos_links: data.session_videos_links || [],
      ITI_name: nullableText(data.ITI_name) || "NA",
      ITI_code: nullableText(data.ITI_code) || "NA",
      iti_rep_name: isSchool ? nullableText(data.iti_rep_name) : null,
      iti_rep_contact: isSchool ? nullableNumber(data.iti_rep_contact) : null,
      block: nullableText(data.block),
      gram_panchayat: nullableText(data.gram_panchayat),
      address: nullableText(data.address),
      school_rep_name: isSchool ? nullableText(data.school_rep_name) : null,
      school_rep_contact: isSchool ? nullableNumber(data.school_rep_contact) : null,
      male_students: isSchool ? nullableNumber(data.male_students) : null,
      female_students: isSchool ? nullableNumber(data.female_students) : null,
      other_students: isSchool ? nullableNumber(data.other_students) : null,
      pwd_students: isSchool ? nullableNumber(data.pwd_students) : null,
      male_parents: isSchool ? nullableNumber(data.male_parents) : null,
      female_parents: isSchool ? nullableNumber(data.female_parents) : null,
      other_parents: isSchool ? nullableNumber(data.other_parents) : null,
      female_staff: isSchool ? nullableNumber(data.female_staff) : null,
      male_staff: isSchool ? nullableNumber(data.male_staff) : null,
      other_staff: isSchool ? nullableNumber(data.other_staff) : null,
      female_community_members: !isSchool ? nullableNumber(data.female_community_members) : null,
      male_community_members: !isSchool ? nullableNumber(data.male_community_members) : null,
      other_community_members: !isSchool ? nullableNumber(data.other_community_members) : null,
    };

    console.log(payload)
    try {
      const sessionPayload = savedSession
        ? {
            ...payload,
            ...Object.fromEntries(MEDIA_FIELDS.map((field) => [
              field,
              savedSession[field] || payload[field],
            ])),
          }
        : payload;
      const qualitativeReport = {
        outreach_type: typeOfSession.toUpperCase(),
        assesment_data: data.assesment_data.map((assessment) => ({
          type: assessment.type,
          session_assesment: assessment.session_assesment || null,
          key_concern: nullableText(assessment.key_concern),
          perception_change: nullableText(assessment.perception_change),
          suggestion: nullableText(assessment.suggestion),
        })),
        direct_quotes: (data.direct_quotes || []).map(({ type, name, quote }) => ({
          type: type.trim(),
          name: name.trim(),
          quote: quote.trim(),
        })),
        remarks: nullableText(data.qualitative_remarks),
      };
      const hasQualitativeReport = (
        hasAssessmentResponses(qualitativeReport.assesment_data) ||
        qualitativeReport.remarks ||
        qualitativeReport.direct_quotes.length > 0
      ) && !isVisit;

      const uploadsPending = !isVisit &&
        UPLOAD_CATEGORIES.some(({ key }) => selectedUploads[key]?.length);
      const isCombinedCreate = !initialSession && !savedSessionId;
      const updatedSession = await onSubmit(
        sessionPayload,
        savedSessionId,
        isCombinedCreate ? selectedUploads : undefined,
        isCombinedCreate && hasQualitativeReport ? qualitativeReport : undefined
      );
      const currentSession = updatedSession?.session || updatedSession || savedSession;
      const sessionId = savedSessionId || currentSession?.id;
      if (sessionId) setSavedSessionId(sessionId);
      if (currentSession?.id) setSavedSession(currentSession);

      if ((hasQualitativeReport || uploadsPending) && !sessionId) {
        throw new Error("The session was saved but its ID was not returned. Please retry.");
      }
      if (hasQualitativeReport && !isCombinedCreate) {
        await createQualitativeAnalysis({ ...qualitativeReport, session_id: sessionId });
      }
      if (!isVisit && !isCombinedCreate) {
        for (const { key, folder } of UPLOAD_CATEGORIES) {
          const files = selectedUploads[key] || [];
          if (files.length === 0) continue;
          const result = await uploadImages(folder, files, sessionId);
          if (result?.session) setSavedSession(result.session);
          setSelectedUploads((uploads) => ({ ...uploads, [key]: [] }));
          setUploadErrors((errorsByCategory) => ({ ...errorsByCategory, [key]: "" }));
          if (uploadInputRefs.current[key]) uploadInputRefs.current[key].value = "";
        }
      }

      reset(createDefaultValues());
      setSavedSessionId(null);
      setSavedSession(null);
      onCancel();
    } catch (error) {
      setServerError(error?.message || "Failed to save session. Please try again.");
    }
  };

  const handleUploadChange = (categoryKey, event) => {
    setUploadErrors((errorsByCategory) => ({ ...errorsByCategory, [categoryKey]: "" }));
    const files = Array.from(event.target.files || []);
    if (files.length > MAX_IMAGE_COUNT) {
      setUploadErrors((errorsByCategory) => ({
        ...errorsByCategory,
        [categoryKey]: `Select no more than ${MAX_IMAGE_COUNT} images.`,
      }));
      setSelectedUploads((uploads) => ({ ...uploads, [categoryKey]: [] }));
      event.target.value = "";
      return;
    }
    const invalidFile = files.find((file) => !ALLOWED_IMAGE_TYPES.includes(file.type));
    if (invalidFile) {
      setUploadErrors((errorsByCategory) => ({
        ...errorsByCategory,
        [categoryKey]: `"${invalidFile.name}" is not a supported image. Use JPG, PNG, WebP, HEIC, or HEIF.`,
      }));
      setSelectedUploads((uploads) => ({ ...uploads, [categoryKey]: [] }));
      event.target.value = "";
      return;
    }
    const oversizedFile = files.find((file) => file.size > MAX_IMAGE_SIZE_BYTES);
    if (oversizedFile) {
      setUploadErrors((errorsByCategory) => ({
        ...errorsByCategory,
        [categoryKey]: `"${oversizedFile.name}" exceeds the 10 MB size limit.`,
      }));
      setSelectedUploads((uploads) => ({ ...uploads, [categoryKey]: [] }));
      event.target.value = "";
      return;
    }
    setSelectedUploads((uploads) => ({ ...uploads, [categoryKey]: files }));
  };

  const inputClass = (hasError) =>
    `w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:ring-4 ${
      hasError
        ? "border-rose-400 focus:border-rose-400 focus:ring-rose-100"
        : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-100"
    }`;

  const countRules = {
    setValueAs: (value) => value === "" ? null : Number(value),
    min: { value: 0, message: "Cannot be negative" },
    validate: (value) => value == null || Number.isInteger(value) || "Must be a whole number",
  };
  const contactRules = {
    setValueAs: (value) => value === "" ? null : Number(value),
    validate: (value) => value == null || (Number.isFinite(value) && value >= 0) || "Enter a valid numeric contact",
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-slate-50/70 px-4 py-5 sm:px-7 sm:py-6">
      {serverError && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
          {serverError}
        </div>
      )}

      <SectionCard
        icon={School}
        title="Session details"
        description="Choose the session activity and enter its name, date, and nearby ITI."
      >
        <FormSelect label="Type of session" name="session_activity" register={register} errors={errors} inputClass={inputClass}
          rules={{ required: "Select a session type" }}>
          <option value="">Select type</option>
          {SESSION_TYPES.map(({ value }) => <option key={value} value={value}>{value}</option>)}
        </FormSelect>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormSelect label="State" name="state" register={register} errors={errors} inputClass={inputClass}
          rules={{
            required: "State is required",
            onChange: () => {
              setValue("district", "", { shouldDirty: true, shouldValidate: true });
              setValue("ITI_name", "NA", { shouldDirty: true });
              setValue("ITI_code", "NA", { shouldDirty: true });
            },
          }}>
          <option value="">Select State</option>
          {states.map((state) => <option key={state} value={state}>{state}</option>)}
        </FormSelect>
        <FormSelect label="District / Clusters" name="district" register={register} errors={errors} inputClass={inputClass}
          disabled={!selectedState}
          rules={{
            required: "District is required",
            onChange: () => {
              setValue("ITI_name", "NA", { shouldDirty: true });
              setValue("ITI_code", "NA", { shouldDirty: true });
            },
          }}>
          <option value="">{selectedState ? "Select District" : "Select State first"}</option>
          {districts.map((district) => <option key={district} value={district}>{district}</option>)}
        </FormSelect>
      </div>

      <FormSelect label="Name of nearest ITI" name="ITI_name" register={register} errors={errors} inputClass={inputClass}
        disabled={!selectedDistrict}
        rules={{
          required: "Select nearest ITI",
          validate: (value) => value !== "NA" || "Select nearest ITI",
          onChange: (event) => {
            const selectedITI = itis.find((iti) => iti.itiName === event.target.value);
            setValue("ITI_code", selectedITI?.itiCode || "NA", { shouldDirty: true });
          },
        }}>
        <option value="NA">{selectedDistrict ? "Select nearest ITI" : "Select District first"}</option>
        {watch("ITI_name") !== "NA" && !itis.some((iti) => iti.itiName === watch("ITI_name")) && (
          <option value={watch("ITI_name")}>{watch("ITI_name")}</option>
        )}
        {itis.map((iti) => <option key={iti.itiCode} value={iti.itiName}>{iti.itiName}</option>)}
      </FormSelect>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormInput
          label={sessionActivity === "Community session"
            ? "Name of Community"
            : sessionActivity === "ITI Visit" ? "Name of ITI" : "Name of School"}
          name="name_of_session"
          register={register}
          errors={errors}
          inputClass={inputClass}
          rules={{ required: "Session name is required" }}
        />
        <FormInput label="Date of outreach" name="session_date" type="date" register={register} errors={errors}
          inputClass={inputClass} rules={{ required: "Session date is required" }} />
      </div>
      </SectionCard>

      <SectionCard
        icon={MapPin}
        title="Location details"
        description="Add the local administrative area and address."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormInput label="Block" name="block" register={register} errors={errors} inputClass={inputClass} />
          <FormInput label="Gram Panchayat" name="gram_panchayat" register={register} errors={errors} inputClass={inputClass} />
          <FormInput label="Address" name="address" register={register} errors={errors} inputClass={inputClass} />
        </div>
      </SectionCard>

      {isSchoolSession && (
        <>
          <SectionCard
            icon={UsersRound}
            title="School and ITI representatives"
            description="Add representative contact details where available."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormInput label="ITI representative name" name="iti_rep_name" register={register} errors={errors} inputClass={inputClass} />
              <FormInput label="ITI representative contact" name="iti_rep_contact" type="number" register={register} errors={errors} inputClass={inputClass} rules={contactRules} />
              <FormInput label="School representative name" name="school_rep_name" register={register} errors={errors} inputClass={inputClass} />
              <FormInput label="School representative contact" name="school_rep_contact" type="number" register={register} errors={errors} inputClass={inputClass} rules={contactRules} />
            </div>
          </SectionCard>
          <CountGroup title="Students" fields={STUDENT_FIELDS} countRules={countRules} errors={errors} inputClass={inputClass} register={register} />
          <CountGroup title="Principals / Teachers" fields={STAFF_FIELDS} countRules={countRules} errors={errors} inputClass={inputClass} register={register} />
          <CountGroup title="Parents" fields={PARENT_FIELDS} countRules={countRules} errors={errors} inputClass={inputClass} register={register} />
          <CountGroup title="Community participants" fields={COMMUNITY_FIELDS} countRules={countRules} errors={errors} inputClass={inputClass} register={register} />
        </>
      )}

      {isCommunitySession && (
        <CountGroup title="Community participants" fields={COMMUNITY_FIELDS} countRules={countRules} errors={errors} inputClass={inputClass} register={register} />
      )}

      <SectionCard
        icon={ClipboardList}
        title="Materials and observations"
        description="Record materials distributed and key field notes."
      >
      {!isVisit && (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput label="IEC materials distributed" name="total_iec_materials_distributed" type="number" register={register}
            errors={errors} inputClass={inputClass}
            rules={{
              required: "Required",
              setValueAs: (value) => value === "" ? 0 : Number(value),
              min: { value: 0, message: "Cannot be negative" },
              validate: (value) => Number.isInteger(value) || "Must be a whole number",
            }} />
          <FormInput label="Total Feedback Form Filled" name="total_feedbackform_filled" type="number" register={register}
            errors={errors} inputClass={inputClass}
            rules={{
              required: "Required",
              setValueAs: (value) => value === "" ? 0 : Number(value),
              min: { value: 0, message: "Cannot be negative" },
              validate: (value) => Number.isInteger(value) || "Must be a whole number",
            }} />
      </div>
        )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormTextarea label="Observation" name="observation" register={register} inputClass={inputClass} />
        <FormTextarea label="Remarks" name="remarks" register={register} inputClass={inputClass} />
      </div>
      </SectionCard>
      
      {!isVisit && (
          <SectionCard
            icon={MessageSquareText}
            title="Qualitative analysis"
            description={typeOfSession === "School"
              ? "Include School / ITI principal and teacher perspectives alongside student feedback where relevant."
              : typeOfSession === "Community"
                ? "Include community perspectives alongside student feedback where relevant."
                : "Record session reflections and supporting context for this outreach."}
          >
            <QualitativeAssessmentFields
              control={control}
              register={register}
              inputClass={inputClass}
              errors={errors}
              remarksName="qualitative_remarks"
            />
          </SectionCard>
        )}

      {!isVisit && (
        <SectionCard
          icon={Camera}
          title="Supporting documents and photos"
          description={`Choose up to ${MAX_IMAGE_COUNT} images per category. Each image can be up to 10 MB.`}
        >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {UPLOAD_CATEGORIES.map(({ key, label }) => (
            <div key={key} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30">
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor={`upload-${key}`}>
                {label}
              </label>
              <input
                ref={(element) => { uploadInputRefs.current[key] = element; }}
                id={`upload-${key}`}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                onChange={(event) => handleUploadChange(key, event)}
                className="w-full text-xs text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-100 file:px-2.5 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
              />
              <p className="mt-1 text-xs text-slate-400">
                {selectedUploads[key]?.length || 0}/{MAX_IMAGE_COUNT} selected · up to 10 MB each
              </p>
              {uploadErrors[key] && (
                <p role="alert" className="mt-1 text-xs text-rose-600">{uploadErrors[key]}</p>
              )}
            </div>
          ))}
        </div>
        </SectionCard>
      )}
      {isVisit && (
        <SectionCard
          icon={Camera}
          title="Supporting documents and photos"
          description={`Choose up to ${MAX_IMAGE_COUNT} images per category. Each image can be up to 10 MB.`}
        >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div  className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30">
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor={`upload-${UPLOAD_CATEGORIES[0].key}`}>
                {UPLOAD_CATEGORIES[0].label}
              </label>
                  <input
                    ref={(element) => { uploadInputRefs.current[UPLOAD_CATEGORIES[0].key] = element; }}
                    id={`upload-${UPLOAD_CATEGORIES[0].key}`}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                    onChange={(event) => handleUploadChange(UPLOAD_CATEGORIES[0].key, event)}
                    className="w-full text-xs text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-100 file:px-2.5 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    {selectedUploads[UPLOAD_CATEGORIES[0].key]?.length || 0}/{MAX_IMAGE_COUNT} selected · up to 10 MB each
                  </p>
                  {uploadErrors[UPLOAD_CATEGORIES[0].key] && (
                    <p role="alert" className="mt-1 text-xs text-rose-600">{uploadErrors[UPLOAD_CATEGORIES[0].key]}</p>
                  )}
                </div>
            </div>
            </SectionCard>
          )}

          
        
      </div>

      
      <div className="flex shrink-0 justify-end gap-3 border-t border-slate-200 bg-white px-4 py-4 shadow-[0_-4px_12px_rgba(15,23,42,0.04)] sm:px-7">
        <button type="button" onClick={onCancel} disabled={isSubmitting}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting}
          className="inline-flex min-w-36 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 hover:shadow disabled:cursor-not-allowed disabled:opacity-60">
          {isSubmitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Saving...
            </>
          ) : submitLabel}
        </button>
      </div>
    </form>
  );
}

function FormSelect({ label, name, register, errors, inputClass, rules, disabled, children }) {
  return (
    <div className="min-w-0">
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>
      <select className={`${inputClass(Boolean(errors[name]))} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`} disabled={disabled} {...register(name, rules)}>
        {children}
      </select>
      {errors[name]?.message && <p role="alert" className="mt-1.5 text-xs font-medium text-rose-600">{errors[name].message}</p>}
    </div>
  );
}

function FormInput({ label, name, register, errors, inputClass, type = "text", rules }) {
  return (
    <div className="min-w-0">
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>
      <input type={type} min={type === "number" ? 0 : undefined} step={type === "number" ? 1 : undefined}
        className={inputClass(errors[name])} {...register(name, rules)} />
      {errors[name]?.message && <p role="alert" className="mt-1.5 text-xs font-medium text-rose-600">{errors[name].message}</p>}
    </div>
  );
}

function FormTextarea({ label, name, register, inputClass }) {
  return (
    <div className="min-w-0">
      <label className="mb-1.5 block text-sm font-semibold leading-5 text-slate-700">{label}</label>
      <textarea rows={3} placeholder="Add details..." className={`${inputClass(false)} min-h-24 resize-y leading-relaxed`} {...register(name)} />
    </div>
  );
}

function CountGroup({ title, fields, countRules, errors, inputClass, register }) {
  return (
    <SectionCard icon={UsersRound} title={title} compact>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {fields.map((name) => (
          <FormInput
            key={name}
            label={name.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())}
            name={name}
            type="number"
            register={register}
            rules={countRules}
            errors={errors}
            inputClass={inputClass}
          />
        ))}
      </div>
    </SectionCard>
  );
}

function SectionCard({ icon: Icon, title, description, compact = false, children }) {
  return (
    <section className={`rounded-2xl border border-slate-200/80 bg-white shadow-sm ${compact ? "p-4 sm:p-5" : "p-4 sm:p-6"}`}>
      <div className={`flex items-start gap-3 ${description ? "mb-5" : "mb-4"}`}>
        {Icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
            <Icon size={18} strokeWidth={1.9} />
          </span>
        )}
        <div className="min-w-0 pt-0.5">
          <h3 className="text-sm font-bold tracking-tight text-slate-800 sm:text-base">{title}</h3>
          {description && <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-sm">{description}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export default function CreateSessionModal({
  isOpen,
  onClose,
  onCreateSession,
  onUpdateSession,
  session = null,
}) {
  if (!isOpen) return null;
  const isEditing = Boolean(session);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5">
      <button
        type="button"
        aria-label="Close create session dialog"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-slate-950/60 backdrop-blur-sm"
      />
      <div role="dialog" aria-modal="true" aria-labelledby="create-session-title" className="relative z-10 flex max-h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 sm:rounded-3xl">
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 px-5 py-5 text-white sm:px-8 sm:py-6">
          <div className="absolute -right-8 -top-16 h-48 w-48 rounded-full bg-white/10" />
          <div className="absolute right-28 -top-24 h-48 w-48 rounded-full bg-white/5" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                <CalendarDays size={21} />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-100">Field monitoring</p>
                <h2 id="create-session-title" className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
                  {isEditing ? "Edit session" : "Create a session"}
                </h2>
                <p className="mt-1 max-w-xl text-xs leading-relaxed text-indigo-100 sm:text-sm">
                  Capture session details, participation, observations, and supporting documents.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close create session dialog"
              className="shrink-0 rounded-xl bg-white/10 p-2 text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              <X size={19} />
            </button>
          </div>
        </div>
        <SessionForm
          onSubmit={(payload, createdSessionId, selectedUploads, qualitativeReport) =>
            isEditing || createdSessionId
              ? onUpdateSession(isEditing ? session.id : createdSessionId, payload)
              : onCreateSession(payload, selectedUploads, qualitativeReport)
          }
          onCancel={onClose}
          initialSession={session}
          submitLabel={isEditing ? "Update Session" : "Create Session"}
        />
      </div>
    </div>,
    document.body
  );
}
