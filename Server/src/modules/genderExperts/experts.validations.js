import { z } from "zod";

const sessionStatus = ["Pending review", "Completed", "Needs Attention"];
const sessionType = ["School", "Community"];
const schoolOutreachTypes = [
  "School Outreach",
  "School Visit",
  "ITI Visit",
  "School Sessions- Girl Students",
  "School Session- Principal/Teacher",
  "School girls",
  "Staff",
];
const outreachByType = {
  School: schoolOutreachTypes,
  Community: ["Community Outreach", "Community session", "Community"],
};
const sessionActivities = [...new Set([
  ...schoolOutreachTypes,
  ...outreachByType.Community,
])];

const nullableText = z.string().trim().nullable().optional();
const nullableCount = z
  .number({ invalid_type_error: "Must be a number." })
  .finite()
  .int("Must be a whole number.")
  .min(0, "Cannot be negative.")
  .nullable()
  .optional();
const nullableContact = z.number({ invalid_type_error: "Contact must be numeric." })
  .finite()
  .nullable()
  .optional();
const mediaLinks = z.array(z.string().trim().min(1)).nullable().optional();

const sessionFields = {
  session_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format.")
    .refine((date) => {
      const parsed = new Date(`${date}T00:00:00.000Z`);
      return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
    }, "Invalid session date."),
  status: z.enum(sessionStatus).default("Pending review"),
  state: z.string().trim().min(1, "State is required."),
  district: z.string().trim().min(1, "District is required."),
  type_of_session: z.enum(sessionType).nullable().optional(),
  type_of_outreach: z.enum(sessionActivities).nullable().optional(),
  name_of_session: z.string().trim().min(1, "Session name is required."),
  remarks: nullableText,
  observation: nullableText,
  expert_id: z.string().uuid("Invalid expert ID.").nullable(),
  attendance_sheets_links: mediaLinks,
  feedback_forms_links: mediaLinks,
  "geo-taggedPhotos_links": mediaLinks,
  total_iec_materials_distributed: z.number({
    invalid_type_error: "IEC materials distributed must be a number.",
  }).int("IEC materials distributed must be a whole number.")
    .min(0, "IEC materials distributed cannot be negative.")
    .default(0),
  total_feedbackform_filled: z.number({
    invalid_type_error: "Feedback forms filled must be a number.",
  }).int("Feedback forms filled must be a whole number.")
    .min(0, "Feedback forms filled cannot be negative.")
    .default(0),
  IEC_materials_photos_links: mediaLinks,
  consent_forms_links: mediaLinks,
  session_images_links: mediaLinks,
  session_videos_links: mediaLinks,
  ITI_name: z.string().trim().min(1).default("NA"),
  ITI_code: z.string().trim().min(1).default("NA"),
  iti_rep_name: nullableText,
  iti_rep_contact: nullableContact,
  block: nullableText,
  gram_panchayat: nullableText,
  address: nullableText,
  school_rep_name: nullableText,
  school_rep_contact: nullableContact,
  male_students: nullableCount,
  female_students: nullableCount,
  other_students: nullableCount,
  pwd_students: nullableCount,
  male_parents: nullableCount,
  female_parents: nullableCount,
  other_parents: nullableCount,
  female_staff: nullableCount,
  male_staff: nullableCount,
  other_staff: nullableCount,
  female_community_members: nullableCount,
  male_community_members: nullableCount,
  other_community_members: nullableCount,
};

const validateOutreachType = (data, ctx) => {
  if (data.type_of_session && !outreachByType[data.type_of_session]?.includes(data.type_of_outreach)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["type_of_outreach"],
      message: data.type_of_session === "School Outreach"
        ? "Select a School session activity."
        : "Select a Community session activity.",
    });
  }
  if (!data.type_of_session && data.type_of_outreach) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["type_of_session"],
      message: "Session type is required when outreach type is selected.",
    });
  }
};

export const createSessionSchema = z.object(sessionFields)
  .superRefine((data, ctx) => validateOutreachType(data, ctx));
export const updateSessionSchema = z.object(sessionFields).partial()
  .superRefine((data, ctx) => {
    if (data.type_of_session !== undefined && data.type_of_outreach === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["type_of_outreach"],
        message: "Outreach type is required when changing the session type.",
      });
    }
    if (data.type_of_outreach !== undefined && data.type_of_session === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["type_of_session"],
        message: "Session type is required when changing outreach type.",
      });
    }
    validateOutreachType(data, ctx);
  });

const qualitativeReportFields = {
  outreach_type: z.enum(["SCHOOL", "COMMUNITY"]),
  assesment_data: z.array(z.object({
    type: z.enum(["Student", "Teacher/Principal", "Community Member", "Parent"]),
    session_assesment: z.enum(["STRONG", "MODERATE", "LIMITED"]).nullable().optional(),
    key_concern: nullableText,
    perception_change: nullableText,
    suggestion: nullableText,
  })).length(4).superRefine((assessments, ctx) => {
    const types = assessments.map((assessment) => assessment.type);
    if (new Set(types).size !== 4) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide one assessment for each target group.",
      });
    }
  }),
  direct_quotes: z.array(z.object({
    type: z.enum(["Student", "Teacher/Principal", "Community Member", "Parent"]),
    name: z.string().trim().min(1, "Speaker name is required."),
    quote: z.string().trim().min(1, "Quote text is required."),
  })).default([]),
  remarks: nullableText,
};

export const createQualitativeAnalysisSchema = z.object({
  session_id: z.string().uuid("Select a valid outreach record."),
  ...qualitativeReportFields,
});

export const createSessionRequestSchema = z.object({
  session: createSessionSchema,
  qualitative_report: z.object(qualitativeReportFields).optional(),
}).superRefine((request, ctx) => {
  const { session, qualitative_report: report } = request;
  if (!report) return;

  if (session.type_of_session?.toUpperCase() !== report.outreach_type) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["qualitative_report", "outreach_type"],
      message: "Qualitative report type must match the selected session.",
    });
  }
  if (["School Visit", "ITI Visit"].includes(session.type_of_outreach)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["qualitative_report"],
      message: "Qualitative analysis is not available for visit sessions.",
    });
  }
});
