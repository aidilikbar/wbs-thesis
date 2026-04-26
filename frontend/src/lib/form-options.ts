import type {
  InternalUserPayload,
  ReportedPartyClassification,
  SubmissionPayload,
} from "@/lib/types";

const internalRoleLabels: Record<InternalUserPayload["role"], string> = {
  supervisor_of_verificator: "Verification Supervisor",
  verificator: "Verification Officer",
  supervisor_of_investigator: "Investigation Supervisor",
  investigator: "Investigator",
  director: "Director",
  system_administrator: "System Administrator",
  auditor: "Auditor",
};

export const governanceTagOptions = [
  { value: "bribery", label: "Bribery" },
  { value: "gratuity", label: "Gratuity" },
  { value: "procurement_irregularity", label: "Procurement irregularity" },
  { value: "abuse_of_authority", label: "Abuse of authority" },
  { value: "conflict_of_interest", label: "Conflict of interest" },
  { value: "state_financial_loss", label: "State financial loss" },
  { value: "obstruction_of_justice", label: "Obstruction of justice" },
  { value: "other", label: "Other corruption aspect" },
];

export const reportedPartyClassificationOptions: Array<{
  value: ReportedPartyClassification;
  label: string;
}> = [
  { value: "state_official", label: "State official" },
  { value: "civil_servant", label: "Civil servant" },
  { value: "law_enforcement", label: "Law enforcement officer" },
  { value: "other", label: "Other" },
];

export const verificationRecommendationOptions = [
  { value: "review", label: "Investigation" },
  { value: "forward", label: "Forward" },
  { value: "archive", label: "Archive" },
];

export const reviewRecommendationOptions = [
  { value: "internal_forwarding", label: "Forward internally" },
  { value: "external_forwarding", label: "Forward externally" },
  { value: "archive", label: "Archive" },
];

export const delictOptions = [
  { value: "state_financial_loss", label: "State financial loss" },
  { value: "bribery", label: "Bribery" },
  { value: "embezzlement_in_office", label: "Embezzlement in office" },
  { value: "extortion", label: "Extortion" },
  { value: "fraudulent_act", label: "Fraudulent act" },
  { value: "procurement_conflict_of_interest", label: "Conflict of interest in procurement" },
  { value: "gratification", label: "Gratification" },
  { value: "obstruction_of_justice", label: "Obstruction of justice" },
  { value: "other", label: "Other" },
];

export const corruptionArticleOptions = [
  { value: "article_2_31_1999", label: "Law 31/1999 Article 2" },
  { value: "article_3_31_1999", label: "Law 31/1999 Article 3" },
  { value: "article_5_31_1999", label: "Law 31/1999 Article 5" },
  { value: "article_11_31_1999", label: "Law 31/1999 Article 11" },
  { value: "article_12_31_1999", label: "Law 31/1999 Article 12" },
  { value: "article_12b_20_2001", label: "Law 20/2001 Article 12B" },
  { value: "article_21_31_1999", label: "Law 31/1999 Article 21" },
  { value: "article_22_31_1999", label: "Law 31/1999 Article 22" },
  { value: "article_23_31_1999", label: "Law 31/1999 Article 23" },
  { value: "article_55_criminal_code", label: "Criminal Code Article 55" },
];

export const monthOptions = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export const internalRoleOptions: Array<{
  value: InternalUserPayload["role"];
  label: string;
}> = [
  { value: "supervisor_of_verificator", label: internalRoleLabels.supervisor_of_verificator },
  { value: "verificator", label: internalRoleLabels.verificator },
  { value: "supervisor_of_investigator", label: internalRoleLabels.supervisor_of_investigator },
  { value: "investigator", label: internalRoleLabels.investigator },
  { value: "director", label: internalRoleLabels.director },
  { value: "system_administrator", label: internalRoleLabels.system_administrator },
  { value: "auditor", label: internalRoleLabels.auditor },
];

export const initialSubmissionPayload: SubmissionPayload = {
  title: "",
  description: "",
  reported_parties: [
    {
      full_name: "",
      position: "",
      classification: "other",
    },
  ],
  category: "kpk_report",
  confidentiality_level: "identified",
  requested_follow_up: true,
  witness_available: false,
  governance_tags: [],
};
