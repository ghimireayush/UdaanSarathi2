import React, { useState, useEffect } from "react";
import {
  Users,
  Briefcase,
  Tag,
  DollarSign,
  Camera,
  CheckCircle,
  FileText,
  Plus,
  ArrowRight,
  ArrowLeft,
  Info,
  HelpCircle,
  X,
  Upload,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  User,
  FileCheck,
  MessageSquare,
  AlertCircle,
  Eye,
  Save,
  Send,
  Edit,
} from "lucide-react";
import countryService from "../services/countryService";

/*
 * JobDraftWizard Component
 *
 * This component provides a comprehensive 8-step wizard for creating job drafts
 * with two main flows: single detailed draft creation and bulk draft creation.
 *
 * API Endpoints Integration:
 *
 * 1. Posting Details (Step 1):
 *    - PATCH /agencies/:license/job-postings/:id
 *    - Updates administrative details like LT number, chalani number, dates
 *
 * 2. Contract (Step 2):
 *    - PATCH /agencies/:license/job-postings/:id/contract
 *    - Updates employment terms, working hours, benefits
 *
 * 3. Positions (Step 3):
 *    - POST /agencies/:license/job-postings/:id/positions
 *    - Creates job positions with salary and contract overrides
 *
 * 4. Tags & Titles (Step 4):
 *    - PATCH /agencies/:license/job-postings/:id/tags
 *    - Updates skills, education, experience requirements, canonical titles
 *
 * 5. Expenses (Step 5):
 *    - POST /agencies/:license/job-postings/:id/expenses
 *    - Adds expense items (medical, visa, training, etc.)
 *
 * 6. Cutout (Step 6):
 *    - POST /agencies/:license/job-postings/:id/cutout (upload)
 *    - DELETE /agencies/:license/job-postings/:id/cutout?deleteFile=true|false (remove)
 *
 * 7. Interview (Step 7):
 *    - PATCH /agencies/:license/job-postings/:id/interview
 *    - Updates interview details and related expenses
 *
 * 8. Review & Publish (Step 8):
 *    - POST /agencies/:license/job-postings/:id/publish
 *    - Publishes the complete job posting
 *
 * Form data structure matches sample JSON files:
 * - jobs.create.sample.json (basic job structure)
 * - jobs.update-tags.sample.json (tags and requirements)
 * - expenses.*.sample.json (expense structures)
 */

const JobDraftWizard = ({
  isOpen,
  onClose,
  onSave,
  editingDraft,
  initialStep = 0,
}) => {
  const [currentFlow, setCurrentFlow] = useState("selection"); // 'selection', 'single', 'bulk'
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [countries, setCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [formData, setFormData] = useState({
    // Single draft data
    posting_title: "",
    country: "",
    employer: "",

    // Posting Details fields
    city: "",
    lt_number: "",
    chalani_number: "",
    approval_date_ad: "",
    approval_date_bs: "",
    posting_date_ad: "",
    posting_date_bs: "",
    date_format: "AD", // 'AD' or 'BS'
    announcement_type: "",
    notes: "",

    // Contract fields
    period_years: "",
    renewable: "yes",
    hours_per_day: "",
    days_per_week: "",
    overtime_policy: "as_per_company_policy",
    weekly_off_days: "",
    food: "not_provided",
    accommodation: "not_provided",
    transport: "not_provided",
    annual_leave_days: "",

    // Positions
    positions: [
      {
        id: 1,
        position_title: "",
        vacancies_male: "",
        vacancies_female: "",
        monthly_salary: "",
        currency: "AED",
        hours_per_day_override: "",
        days_per_week_override: "",
        overtime_policy_override: "",
        weekly_off_days_override: "",
        food_override: "",
        accommodation_override: "",
        transport_override: "",
        position_notes: "",
      },
    ],

    // Tags & Canonical Titles
    skills: [],
    education_requirements: [],
    experience_requirements: {
      min_years: "",
      preferred_years: "",
      domains: [],
    },
    canonical_title_ids: [],
    canonical_title_names: [],

    // Expenses
    expenses: [
      {
        id: 1,
        type: "",
        who_pays: "",
        is_free: true,
        amount: "",
        currency: "AED",
        notes: "",
      },
    ],

    // Cutout
    cutout: {
      file: null,
      preview_url: null,
      uploaded_url: null,
      is_uploaded: false,
    },

    // Interview (Optional)
    interview: {
      date_ad: "",
      date_bs: "",
      date_format: "AD", // 'AD' or 'BS'
      time: "",
      location: "",
      contact_person: "",
      required_documents: [],
      notes: "",
      expenses: [], // Interview-related expenses
    },

    // Bulk draft data
    bulk_countries: [{ country: "", count: 1 }],

    // New simplified bulk fields - support multiple entries
    bulk_entries: [
      {
        id: 1,
        country: "",
        job_count: "",
        position: "",
      },
    ],

    // Bulk position data
    bulk_position_title: "",
    bulk_monthly_salary: "",
    bulk_currency: "AED",
    bulk_vacancies_male: "",
    bulk_vacancies_female: "",
  });

  // Effect to populate form data when editing a draft
  useEffect(() => {
    if (editingDraft && isOpen) {
      // Check if this is expanding from a bulk draft
      if (
        editingDraft.is_expanding_bulk &&
        editingDraft.bulk_entries &&
        Array.isArray(editingDraft.bulk_entries)
      ) {
        // Handle bulk draft expansion - switch to SINGLE flow with pre-filled data from bulk draft
        setCurrentFlow("single");
        setCurrentStep(0);

        // Take the first bulk entry as the base for the single draft
        const firstEntry = editingDraft.bulk_entries[0] || {};

        setFormData((prevData) => ({
          ...prevData,
          // Basic info from bulk draft
          posting_title: firstEntry.position || editingDraft.title || "",
          country: firstEntry.country || "",
          employer: editingDraft.company || "",

          // Posting Details
          city: "",
          lt_number: "",
          chalani_number: "",
          approval_date_ad: "",
          approval_date_bs: "",
          posting_date_ad: "",
          posting_date_bs: "",
          announcement_type: "",
          notes: editingDraft.description || "",

          // Contract details if available
          period_years: editingDraft.period_years || 2,
          renewable: editingDraft.renewable ? "yes" : "no",
          hours_per_day: editingDraft.hours_per_day || 8,
          days_per_week: editingDraft.days_per_week || 6,
          overtime_policy:
            editingDraft.overtime_policy || "as_per_company_policy",
          weekly_off_days: editingDraft.weekly_off_days || 1,
          food: editingDraft.food || "not_provided",
          accommodation: editingDraft.accommodation || "not_provided",
          transport: editingDraft.transport || "not_provided",
          annual_leave_days: editingDraft.annual_leave_days || 21,

          // Create positions based on bulk entries
          positions: [
            {
              id: 1,
              position_title: firstEntry.position || "General Worker",
              vacancies_male: parseInt(firstEntry.job_count) || 1,
              vacancies_female: 0,
              monthly_salary: 0,
              currency: "AED",
              hours_per_day_override: "",
              days_per_week_override: "",
              overtime_policy_override: "",
              weekly_off_days_override: "",
              food_override: "",
              accommodation_override: "",
              transport_override: "",
              position_notes: `Expanded from bulk draft: ${
                editingDraft.title || "Bulk Draft"
              }`,
            },
          ],

          // Skills and requirements - empty for user to fill
          skills: [],
          education_requirements: [],
          experience_requirements: {
            min_years: 0,
            preferred_years: "",
            domains: [],
          },
          canonical_title_ids: [],
          canonical_title_names: [],

          // Expenses - empty for user to fill
          expenses: [
            {
              id: 1,
              type: "",
              who_pays: "",
              is_free: true,
              amount: "",
              currency: "AED",
              notes: "",
            },
          ],

          // Cutout - empty for user to fill
          cutout: {
            file: null,
            preview_url: null,
            uploaded_url: null,
            is_uploaded: false,
          },

          // Interview - empty for user to fill
          interview: {
            date_ad: "",
            date_bs: "",
            date_format: "AD",
            time: "",
            location: "",
            contact_person: "",
            required_documents: [],
            notes: "",
            expenses: [],
          },

          // Store original bulk draft ID for reference
          original_bulk_id: editingDraft.original_bulk_id,
        }));
      } else if (
        editingDraft.is_bulk_draft &&
        editingDraft.bulk_entries &&
        Array.isArray(editingDraft.bulk_entries)
      ) {
        // Handle bulk draft editing - switch to BULK flow to edit the bulk entries
        setCurrentFlow("bulk");
        setCurrentStep(0);

        // Pre-fill bulk entries for editing
        setFormData((prevData) => ({
          ...prevData,
          // Restore bulk entries for editing
          bulk_entries: editingDraft.bulk_entries.map((entry, index) => ({
            id: index + 1,
            country: entry.country || "",
            job_count: entry.job_count || "",
            position: entry.position || "",
          })),

          // Store original bulk draft info for updating
          editing_bulk_draft_id: editingDraft.id,
          bulk_draft_title: editingDraft.title || "",
          bulk_draft_company: editingDraft.company || "",
          bulk_draft_description: editingDraft.description || "",
        }));
      } else {
        // Handle regular single draft editing
        setCurrentFlow("single");
        setCurrentStep(initialStep); // Use initialStep prop instead of hardcoded 0

        // Map existing draft data to form structure
        setFormData((prevData) => ({
          ...prevData,
          // Basic info
          posting_title: editingDraft.title || "",
          country: editingDraft.country || "",
          employer: editingDraft.company || "",

          // Posting Details
          city: editingDraft.city || "",
          lt_number: editingDraft.lt_number || "",
          chalani_number: editingDraft.chalani_number || "",
          approval_date_ad: editingDraft.approval_date_ad || "",
          approval_date_bs: editingDraft.approval_date_bs || "",
          posting_date_ad: editingDraft.posting_date_ad || "",
          posting_date_bs: editingDraft.posting_date_bs || "",
          announcement_type: editingDraft.announcement_type || "",
          notes: editingDraft.notes || "",

          // Contract details
          period_years: editingDraft.period_years || 2,
          renewable: editingDraft.renewable ? "yes" : "no",
          hours_per_day: editingDraft.hours_per_day || 8,
          days_per_week: editingDraft.days_per_week || 6,
          overtime_policy:
            editingDraft.overtime_policy || "as_per_company_policy",
          weekly_off_days: editingDraft.weekly_off_days || 1,
          food: editingDraft.food || "not_provided",
          accommodation: editingDraft.accommodation || "not_provided",
          transport: editingDraft.transport || "not_provided",
          annual_leave_days: editingDraft.annual_leave_days || 21,

          // Positions
          positions:
            editingDraft.positions &&
            Array.isArray(editingDraft.positions) &&
            editingDraft.positions.length > 0
              ? editingDraft.positions.map((pos, index) => ({
                  id: index + 1,
                  position_title: pos.title || "",
                  vacancies_male: pos.vacancies_male || 0,
                  vacancies_female: pos.vacancies_female || 0,
                  monthly_salary:
                    pos.monthly_salary || pos.salary?.monthly_amount || 0,
                  currency: pos.currency || pos.salary?.currency || "AED",
                  hours_per_day_override: pos.hours_per_day_override || "",
                  days_per_week_override: pos.days_per_week_override || "",
                  overtime_policy_override: pos.overtime_policy_override || "",
                  weekly_off_days_override: pos.weekly_off_days_override || "",
                  food_override: pos.food_override || "",
                  accommodation_override: pos.accommodation_override || "",
                  transport_override: pos.transport_override || "",
                  position_notes: pos.position_notes || "",
                }))
              : [
                  {
                    id: 1,
                    position_title: editingDraft.title || "",
                    vacancies_male: 1,
                    vacancies_female: 0,
                    monthly_salary: editingDraft.salary_amount || 0,
                    currency: editingDraft.currency || "AED",
                    hours_per_day_override: "",
                    days_per_week_override: "",
                    overtime_policy_override: "",
                    weekly_off_days_override: "",
                    food_override: "",
                    accommodation_override: "",
                    transport_override: "",
                    position_notes: "",
                  },
                ],

          // Skills and requirements
          skills: editingDraft.skills || editingDraft.tags || [],
          education_requirements: editingDraft.education_requirements || [],
          experience_requirements: editingDraft.experience_requirements || {
            min_years: 0,
            preferred_years: "",
            domains: [],
          },
          canonical_title_ids: editingDraft.canonical_title_ids || [],
          canonical_title_names: editingDraft.canonical_title_names || [],

          // Expenses
          expenses:
            editingDraft.expenses &&
            Array.isArray(editingDraft.expenses) &&
            editingDraft.expenses.length > 0
              ? editingDraft.expenses.map((exp, index) => ({
                  id: index + 1,
                  type: exp.type || "",
                  who_pays: exp.who_pays || "",
                  is_free: exp.is_free !== undefined ? exp.is_free : true,
                  amount: exp.amount || "",
                  currency: exp.currency || "AED",
                  notes: exp.notes || "",
                }))
              : [
                  {
                    id: 1,
                    type: "",
                    who_pays: "",
                    is_free: true,
                    amount: "",
                    currency: "AED",
                    notes: "",
                  },
                ],

          // Cutout
          cutout: editingDraft.cutout || {
            file: null,
            preview_url: null,
            uploaded_url: null,
            is_uploaded: false,
          },

          // Interview
          interview: editingDraft.interview || {
            date_ad: "",
            date_bs: "",
            date_format: "AD",
            time: "",
            location: "",
            contact_person: "",
            required_documents: [],
            notes: "",
            expenses: [],
          },
        }));
      }
    } else if (!editingDraft && isOpen) {
      // Reset form when creating new draft
      setCurrentFlow("selection");
      setCurrentStep(0);
    }
  }, [editingDraft, isOpen, initialStep]);

  // Fetch countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoadingCountries(true);
        const countryNames = await countryService.getCountryNames();
        setCountries(countryNames);
      } catch (error) {
        console.error('[JobDraftWizard] Failed to fetch countries:', error);
      } finally {
        setLoadingCountries(false);
      }
    };
    fetchCountries();
  }, []);

  // Clear errors when changing steps
  useEffect(() => {
    setErrors({});
  }, [currentStep]);

  const singleDraftSteps = [
    {
      id: "details",
      title: "Posting Details",
      icon: Users,
      description: "Administrative fields",
    },
    {
      id: "contract",
      title: "Contract",
      icon: Briefcase,
      description: "Employment terms",
    },
    {
      id: "positions",
      title: "Positions",
      icon: Users,
      description: "Job positions with salary",
    },
    {
      id: "tags",
      title: "Tags & Canonical Titles",
      icon: Tag,
      description: "Skills, education, experience",
    },
    {
      id: "expenses",
      title: "Expenses",
      icon: DollarSign,
      description: "Cost breakdown",
    },
    {
      id: "cutout",
      title: "Cutout",
      icon: Camera,
      description: "Job advertisement image (Required)",
    },
    {
      id: "interview",
      title: "Interview",
      icon: Users,
      description: "Interview process details",
    },
    {
      id: "review",
      title: "Review and Publish",
      icon: CheckCircle,
      description: "Final review",
    },
  ];

  // Countries are now fetched from API via useEffect
  // Cities are free text input since backend stores them as strings

  const announcementTypes = [
    { value: "newspaper", label: "Newspaper" },
    { value: "online", label: "Online" },
    { value: "agency_board", label: "Agency Board" },
    { value: "radio", label: "Radio" },
    { value: "television", label: "Television" },
    { value: "social_media", label: "Social Media" },
  ];

  const currencies = [
    { value: "AED", label: "AED" },
    { value: "SAR", label: "SAR" },
    { value: "QAR", label: "QAR" },
    { value: "KWD", label: "KWD" },
    { value: "OMR", label: "OMR" },
    { value: "BHD", label: "BHD" },
    { value: "MYR", label: "MYR" },
    { value: "USD", label: "USD" },
  ];

  const overtimePolicyOptions = [
    { value: "as_per_company_policy", label: "As per company policy" },
    { value: "paid", label: "Paid" },
    { value: "unpaid", label: "Unpaid" },
    { value: "not_applicable", label: "Not applicable" },
  ];

  const provisionOptions = [
    { value: "free", label: "Free" },
    { value: "paid", label: "Paid" },
    { value: "not_provided", label: "Not provided" },
  ];

  const predefinedSkills = [
    "Cooking",
    "Customer Service",
    "Security",
    "Surveillance",
    "English Communication",
    "Arabic Communication",
    "Driving",
    "Cleaning",
    "Maintenance",
    "Electrical Work",
    "Plumbing",
    "Construction",
    "Welding",
    "Carpentry",
    "Painting",
    "Hospitality",
    "Food Preparation",
    "Housekeeping",
    "Laundry",
    "Gardening",
    "Computer Skills",
    "First Aid",
    "Leadership",
    "Team Work",
    "Problem Solving",
    "Time Management",
  ];

  const educationRequirements = [
    "No formal education",
    "Primary School",
    "Class 5",
    "Class 8",
    "Class 10",
    "SLC/SEE",
    "High School",
    "+2/Intermediate",
    "Diploma",
    "Vocational Training",
    "Bachelor's Degree",
    "Master's Degree",
    "Technical Certification",
    "Trade School",
  ];

  const experienceDomains = [
    "Hospitality",
    "Culinary",
    "Security",
    "Construction",
    "Maintenance",
    "Transportation",
    "Housekeeping",
    "Food Service",
    "Healthcare",
    "Retail",
    "Manufacturing",
    "Agriculture",
    "Education",
    "Office Work",
    "Sales",
    "Customer Service",
    "Technical Support",
    "Guard Duty",
    "Surveillance",
  ];

  const jobTitles = [
    { id: 1, name: "Security Guard", category: "Security" },
    { id: 2, name: "Cook", category: "Food Service" },
    { id: 3, name: "Driver", category: "Transportation" },
    { id: 4, name: "Cleaner", category: "Housekeeping" },
    { id: 5, name: "Security Officer", category: "Security" },
    { id: 6, name: "Waiter", category: "Food Service" },
    { id: 7, name: "Construction Worker", category: "Construction" },
    { id: 8, name: "Watchman", category: "Security" },
    { id: 9, name: "Electrician", category: "Maintenance" },
    { id: 10, name: "Plumber", category: "Maintenance" },
  ];

  const expenseTypes = [
    { value: "medical", label: "Medical" },
    { value: "insurance", label: "Insurance" },
    { value: "travel", label: "Travel" },
    { value: "visa", label: "Visa/Permit" },
    { value: "training", label: "Training" },
    { value: "welfare", label: "Welfare/Service" },
  ];

  const expensePayers = [
    { value: "company", label: "Company" },
    { value: "worker", label: "Worker" },
    { value: "shared", label: "Shared" },
    { value: "not_applicable", label: "Not applicable" },
    { value: "agency", label: "Agency" },
  ];

  const requiredDocuments = [
    "Passport",
    "Resume/CV",
    "Educational Certificates",
    "Experience Certificates",
    "Medical Certificate",
    "Police Clearance",
    "Driving License",
    "Skills Certificate",
    "Photographs",
    "Birth Certificate",
    "Marriage Certificate",
    "Bank Statement",
    "Reference Letters",
    "Training Certificates",
    "Language Proficiency Certificate",
    "Professional License",
    "Insurance Documents",
    "Visa Documents",
  ];

  const validateStep = (step) => {
    const errors = {};

    switch (step) {
      case 0: // Posting Details
        if (!formData.city?.trim()) errors.city = "City selection is required";
        if (!formData.lt_number?.trim())
          errors.lt_number =
            "Please enter a valid LT Number (e.g., LT-2024-001)";
        if (!formData.chalani_number?.trim())
          errors.chalani_number =
            "Please enter a valid Chalani Number (e.g., CH-2024-001)";
        if (!formData.country?.trim())
          errors.country = "Country selection is required";

        if (!formData.approval_date_ad)
          errors.approval_date_ad = "Approval Date is required";
        if (!formData.posting_date_ad)
          errors.posting_date_ad = "Posting Date is required";

        if (!formData.announcement_type?.trim())
          errors.announcement_type = "Please select an announcement type";
        break;

      case 1: // Contract
        if (!formData.period_years || (typeof formData.period_years === 'number' && formData.period_years < 1) || (typeof formData.period_years === 'string' && formData.period_years.trim() === ''))
          errors.period_years = "Contract period must be at least 1 year";
        if (!formData.renewable)
          errors.renewable = "Please specify if contract is renewable";
        if (
          !formData.hours_per_day ||
          (typeof formData.hours_per_day === 'number' && (formData.hours_per_day < 1 || formData.hours_per_day > 16)) ||
          (typeof formData.hours_per_day === 'string' && formData.hours_per_day.trim() === '')
        ) {
          errors.hours_per_day =
            "Working hours must be between 1 and 16 hours per day";
        }
        if (
          !formData.days_per_week ||
          (typeof formData.days_per_week === 'number' && (formData.days_per_week < 1 || formData.days_per_week > 7)) ||
          (typeof formData.days_per_week === 'string' && formData.days_per_week.trim() === '')
        ) {
          errors.days_per_week =
            "Working days must be between 1 and 7 days per week";
        }
        if (!formData.overtime_policy?.trim())
          errors.overtime_policy = "Please select an overtime policy";
        if ((typeof formData.weekly_off_days === 'number' && (formData.weekly_off_days < 0 || formData.weekly_off_days > 7)) || (typeof formData.weekly_off_days === 'string' && formData.weekly_off_days.trim() === '')) {
          errors.weekly_off_days = "Weekly off days must be between 0 and 7";
        }
        if (!formData.food?.trim())
          errors.food = "Please specify food provision";
        if (!formData.accommodation?.trim())
          errors.accommodation = "Please specify accommodation provision";
        if (!formData.transport?.trim())
          errors.transport = "Please specify transport provision";
        if (!formData.annual_leave_days || (typeof formData.annual_leave_days === 'number' && formData.annual_leave_days < 0) || (typeof formData.annual_leave_days === 'string' && formData.annual_leave_days.trim() === '')) {
          errors.annual_leave_days = "Annual leave days must be 0 or greater";
        }
        break;

      case 2: // Positions
        if (!formData.positions || formData.positions.length === 0) {
          errors.positions_general = "At least one position is required";
        } else {
          formData.positions.forEach((position, index) => {
            if (!position.position_title?.trim()) {
              errors[`positions_${position.id}_position_title`] =
                "Position title is required";
            }
            if ((typeof position.vacancies_male === 'number' && position.vacancies_male < 0) || (typeof position.vacancies_male === 'string' && position.vacancies_male.trim() === '')) {
              errors[`positions_${position.id}_vacancies_male`] =
                "Male vacancies must be 0 or greater";
            }
            if ((typeof position.vacancies_female === 'number' && position.vacancies_female < 0) || (typeof position.vacancies_female === 'string' && position.vacancies_female.trim() === '')) {
              errors[`positions_${position.id}_vacancies_female`] =
                "Female vacancies must be 0 or greater";
            }
            const maleVacancies = typeof position.vacancies_male === 'string' ? parseInt(position.vacancies_male) || 0 : position.vacancies_male;
            const femaleVacancies = typeof position.vacancies_female === 'string' ? parseInt(position.vacancies_female) || 0 : position.vacancies_female;
            if (maleVacancies === 0 && femaleVacancies === 0) {
              errors[`positions_${position.id}_vacancies_total`] =
                "Total vacancies must be greater than 0";
            }
            if (!position.monthly_salary || (typeof position.monthly_salary === 'number' && position.monthly_salary <= 0) || (typeof position.monthly_salary === 'string' && position.monthly_salary.trim() === '')) {
              errors[`positions_${position.id}_monthly_salary`] =
                "Monthly salary must be greater than 0";
            }
            if (!position.currency?.trim()) {
              errors[`positions_${position.id}_currency`] =
                "Currency selection is required";
            }
          });
        }
        break;

      case 3: // Tags & Titles
        if (!formData.skills || formData.skills.length === 0) {
          errors.skills = "Please add at least one skill requirement";
        }
        if (
          !formData.education_requirements ||
          formData.education_requirements.length === 0
        ) {
          errors.education_requirements =
            "Please specify education requirements";
        }
        if (
          formData.experience_requirements.min_years === "" ||
          formData.experience_requirements.min_years === null ||
          formData.experience_requirements.min_years === undefined ||
          (typeof formData.experience_requirements.min_years === 'number' && formData.experience_requirements.min_years < 0)
        ) {
          errors.experience_min_years =
            "Minimum experience years is required (use 0 for no experience)";
        }
        if (
          !formData.experience_requirements.domains ||
          formData.experience_requirements.domains.length === 0
        ) {
          errors.experience_domains =
            "Please specify at least one experience domain";
        }
        if (
          !formData.canonical_title_ids ||
          formData.canonical_title_ids.length === 0
        ) {
          errors.canonical_titles =
            "Please select at least one canonical job title";
        }
        break;

      case 4: // Expenses (Optional step)
        if (formData.expenses && formData.expenses.length > 0) {
          formData.expenses.forEach((expense) => {
            if (!expense.type?.trim()) {
              errors[`expenses_${expense.id}_type`] =
                "Expense type is required";
            }
            if (!expense.who_pays?.trim()) {
              errors[`expenses_${expense.id}_who_pays`] =
                "Please specify who pays for this expense";
            }
            if (expense.is_free === false) {
              if (!expense.amount || (typeof expense.amount === 'number' && expense.amount <= 0) || (typeof expense.amount === 'string' && expense.amount.trim() === '')) {
                errors[`expenses_${expense.id}_amount`] =
                  "Please enter a valid amount greater than 0";
              }
              if (!expense.currency?.trim()) {
                errors[`expenses_${expense.id}_currency`] =
                  "Currency is required for paid expenses";
              }
            }
          });
        }
        break;

      case 5: // Cutout (Required)
        if (!formData.cutout.file && !formData.cutout.uploaded_url) {
          errors.cutout_file = "Job advertisement image is required";
        }
        break;

      case 6: // Interview (Optional)
        if (
          formData.interview?.date_ad ||
          formData.interview?.time ||
          formData.interview?.location
        ) {
          // If any interview field is filled, validate time format
          if (
            formData.interview.time &&
            !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]\s?(AM|PM)?$/i.test(
              formData.interview.time
            )
          ) {
            errors.interview_time =
              "Please enter a valid time format (e.g., 10:00 AM or 14:30)";
          }
        }

        // Validate interview expenses if any
        if (
          formData.interview?.expenses &&
          formData.interview.expenses.length > 0
        ) {
          formData.interview.expenses.forEach((expense) => {
            if (!expense.type?.trim()) {
              errors[`interview_expense_${expense.id}_type`] =
                "Expense type is required";
            }
            if (!expense.who_pays?.trim()) {
              errors[`interview_expense_${expense.id}_who_pays`] =
                "Please specify who pays";
            }
            if (expense.is_free === false) {
              if (!expense.amount || expense.amount <= 0) {
                errors[`interview_expense_${expense.id}_amount`] =
                  "Amount is required for paid expenses";
              }
            }
          });
        }
        break;
    }

    return errors;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear any existing errors for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const addPosition = () => {
    const newPosition = {
      id: Date.now(),
      position_title: "",
      vacancies_male: 0,
      vacancies_female: 0,
      monthly_salary: 0,
      currency: "AED",
      hours_per_day_override: "",
      days_per_week_override: "",
      overtime_policy_override: "",
      weekly_off_days_override: "",
      food_override: "",
      accommodation_override: "",
      transport_override: "",
      position_notes: "",
    };
    setFormData((prev) => ({
      ...prev,
      positions: [...prev.positions, newPosition],
    }));
  };

  const removePosition = (positionId) => {
    setFormData((prev) => ({
      ...prev,
      positions: prev.positions.filter((pos) => pos.id !== positionId),
    }));
  };

  const updatePosition = (positionId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      positions: prev.positions.map((pos) =>
        pos.id === positionId ? { ...pos, [field]: value } : pos
      ),
    }));
    // Clear position-specific errors
    const errorKey = `positions_${positionId}_${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: null }));
    }
  };

  const addTag = (field, value) => {
    if (value && !formData[field].includes(value)) {
      setFormData((prev) => ({
        ...prev,
        [field]: [...prev[field], value],
      }));
      // Clear related errors when adding tags
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: null }));
      }
    }
  };

  const removeTag = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((item) => item !== value),
    }));
    // Clear related errors when removing tags
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const addExperienceDomain = (domain) => {
    if (domain && !formData.experience_requirements.domains.includes(domain)) {
      setFormData((prev) => ({
        ...prev,
        experience_requirements: {
          ...prev.experience_requirements,
          domains: [...prev.experience_requirements.domains, domain],
        },
      }));
      // Clear related errors when adding experience domains
      if (errors.experience_domains) {
        setErrors((prev) => ({ ...prev, experience_domains: null }));
      }
    }
  };

  const removeExperienceDomain = (domain) => {
    setFormData((prev) => ({
      ...prev,
      experience_requirements: {
        ...prev.experience_requirements,
        domains: prev.experience_requirements.domains.filter(
          (item) => item !== domain
        ),
      },
    }));
    // Clear related errors when removing experience domains
    if (errors.experience_domains) {
      setErrors((prev) => ({ ...prev, experience_domains: null }));
    }
  };

  const addCanonicalTitle = (title) => {
    if (title && !formData.canonical_title_ids.includes(title.id)) {
      setFormData((prev) => ({
        ...prev,
        canonical_title_ids: [...prev.canonical_title_ids, title.id],
        canonical_title_names: [...prev.canonical_title_names, title.name],
      }));
      // Clear related errors when adding canonical titles
      if (errors.canonical_titles) {
        setErrors((prev) => ({ ...prev, canonical_titles: null }));
      }
    }
  };

  const removeCanonicalTitle = (titleId) => {
    const titleIndex = formData.canonical_title_ids.indexOf(titleId);
    if (titleIndex > -1) {
      setFormData((prev) => ({
        ...prev,
        canonical_title_ids: prev.canonical_title_ids.filter(
          (id) => id !== titleId
        ),
        canonical_title_names: prev.canonical_title_names.filter(
          (_, index) => index !== titleIndex
        ),
      }));
      // Clear related errors when removing canonical titles
      if (errors.canonical_titles) {
        setErrors((prev) => ({ ...prev, canonical_titles: null }));
      }
    }
  };

  const addExpense = () => {
    const newExpense = {
      id: Date.now(),
      type: "",
      who_pays: "",
      is_free: true,
      amount: "",
      currency: "AED",
      notes: "",
    };
    setFormData((prev) => ({
      ...prev,
      expenses: [...prev.expenses, newExpense],
    }));
  };

  const removeExpense = (expenseId) => {
    setFormData((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((exp) => exp.id !== expenseId),
    }));
  };

  const updateExpense = (expenseId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      expenses: prev.expenses.map((exp) => {
        if (exp.id === expenseId) {
          const updatedExpense = { ...exp, [field]: value };
          // Clear amount and currency if switching to free
          if (field === "is_free" && value === true) {
            updatedExpense.amount = "";
            updatedExpense.currency = "AED";
          }
          return updatedExpense;
        }
        return exp;
      }),
    }));
    // Clear expense-specific errors
    const errorKey = `expenses_${expenseId}_${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: null }));
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          cutout_file: "Please select a valid image file (JPG, PNG)",
        }));
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setErrors((prev) => ({
          ...prev,
          cutout_file: "File size must be less than 10MB",
        }));
        return;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);

      setFormData((prev) => ({
        ...prev,
        cutout: {
          ...prev.cutout,
          file: file,
          preview_url: previewUrl,
          is_uploaded: false,
        },
      }));

      // Clear any existing errors
      if (errors.cutout_file) {
        setErrors((prev) => ({ ...prev, cutout_file: null }));
      }
    }
  };

  const removeCutout = () => {
    // Clean up preview URL to prevent memory leaks
    if (formData.cutout.preview_url) {
      URL.revokeObjectURL(formData.cutout.preview_url);
    }

    // Reset cutout state - only removes from the form, doesn't delete server files
    setFormData((prev) => ({
      ...prev,
      cutout: {
        file: null,
        preview_url: null,
        uploaded_url: null,
        is_uploaded: false,
      },
    }));
  };

  const uploadCutout = async () => {
    if (!formData.cutout.file) return;

    try {
      // Here you would normally make API call:
      // POST /agencies/:license/job-postings/:id/cutout
      // with FormData containing the file

      // Simulate upload success
      const mockUploadedUrl = `/public/mock-license/mock-job-id/cutout.jpg`;

      setFormData((prev) => ({
        ...prev,
        cutout: {
          ...prev.cutout,
          uploaded_url: mockUploadedUrl,
          is_uploaded: true,
        },
      }));

      return true;
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        cutout_upload: "Failed to upload cutout. Please try again.",
      }));
      return false;
    }
  };

  const updateInterviewField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      interview: {
        ...prev.interview,
        [field]: value,
      },
    }));
    // Clear any existing errors for this field
    if (errors[`interview_${field}`]) {
      setErrors((prev) => ({ ...prev, [`interview_${field}`]: null }));
    }
  };

  const addInterviewDocument = (document) => {
    if (document && !formData.interview.required_documents.includes(document)) {
      setFormData((prev) => ({
        ...prev,
        interview: {
          ...prev.interview,
          required_documents: [...prev.interview.required_documents, document],
        },
      }));
    }
  };

  const removeInterviewDocument = (document) => {
    setFormData((prev) => ({
      ...prev,
      interview: {
        ...prev.interview,
        required_documents: prev.interview.required_documents.filter(
          (doc) => doc !== document
        ),
      },
    }));
  };

  const addInterviewExpense = () => {
    const newExpense = {
      id: Date.now(),
      type: "travel", // Default to travel for interview expenses
      who_pays: "",
      is_free: true,
      amount: "",
      currency: "AED",
      notes: "Interview-related expense",
    };
    setFormData((prev) => ({
      ...prev,
      interview: {
        ...prev.interview,
        expenses: [...(prev.interview?.expenses || []), newExpense],
      },
    }));
  };

  const removeInterviewExpense = (expenseId) => {
    setFormData((prev) => ({
      ...prev,
      interview: {
        ...prev.interview,
        expenses: (prev.interview?.expenses || []).filter(
          (exp) => exp.id !== expenseId
        ),
      },
    }));
  };

  const updateInterviewExpense = (expenseId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      interview: {
        ...prev.interview,
        expenses: (prev.interview?.expenses || []).map((exp) => {
          if (exp.id === expenseId) {
            const updatedExpense = { ...exp, [field]: value };
            // Clear amount and currency if switching to free
            if (field === "is_free" && value === true) {
              updatedExpense.amount = "";
              updatedExpense.currency = "AED";
            }
            return updatedExpense;
          }
          return exp;
        }),
      },
    }));
  };

  // AI Insights for each step
  const getAIInsights = (step) => {
    const insights = {
      0: {
        // Posting Details
        title: "🎯 Make Your Job Stand Out",
        tips: [
          "Use clear, specific job titles that candidates actually search for (e.g., 'Head Chef' instead of 'Kitchen Leader')",
          "Include the city name in your posting - workers prefer jobs close to their location",
          "Double-check your LT and Chalani numbers - incorrect numbers can delay your approval",
          "Choose the right announcement type based on your target audience - online postings reach more young workers",
        ],
      },
      1: {
        // Contract
        title: "📋 Create Fair & Attractive Terms",
        tips: [
          "2-year contracts are most popular - they give workers stability while keeping flexibility for employers",
          "8 hours/day and 6 days/week is the standard that most workers expect in the Gulf region",
          "Offering free accommodation and food makes your job much more attractive than competitors",
          "21+ annual leave days shows you care about work-life balance - this attracts better candidates",
        ],
      },
      2: {
        // Positions
        title: "💰 Price Your Jobs Competitively",
        tips: [
          "Research current market rates - underpaying by 10% can reduce applications by 50%",
          "Be realistic with vacancy numbers - hiring 20+ people at once is very difficult",
          "Consider offering slightly higher salaries for female positions if you need female workers urgently",
          "Position-specific contract overrides help when you need different terms for senior roles",
        ],
      },
      3: {
        // Tags & Canonical Titles
        title: "🔍 Help Workers Find Your Job",
        tips: [
          "Add both basic and advanced skills - this helps match workers of different experience levels",
          "Don't ask for too much education - many skilled workers have experience but limited formal education",
          "0-2 years experience requirements get 3x more applications than 5+ years requirements",
          "Choose canonical titles that workers actually use - avoid internal company job titles",
        ],
      },
      4: {
        // Expenses
        title: "💸 Be Transparent About Costs",
        tips: [
          "Clearly stating who pays what builds trust and reduces candidate drop-off",
          "Free medical insurance is highly valued - mention it prominently if you provide it",
          "If workers pay for visa/permits, consider offering reimbursement after 6 months of service",
          "Training expenses paid by company show you're investing in worker development",
        ],
      },
      5: {
        // Cutout
        title: "📸 Make a Great First Impression",
        tips: [
          "High-quality images get 40% more clicks than text-only postings",
          "Show actual workplace photos when possible - workers want to see where they'll work",
          "Include company logo for credibility and brand recognition",
          "Keep file sizes under 2MB for faster loading on mobile devices",
        ],
      },
      6: {
        // Interview
        title: "🤝 Plan Your Interview Process",
        tips: [
          "Schedule interviews within 1-2 weeks to keep good candidates interested",
          "Video interviews save time and money for both you and the candidates",
          "Ask for basic documents only - requesting too many papers scares away good workers",
          "If you cover interview travel costs, mention it - this shows you value their time",
        ],
      },
      7: {
        // Review & Publish
        title: "🚀 Ready to Go Live!",
        tips: [
          "Double-check all salary figures and dates before publishing - corrections after publishing are difficult",
          "Published jobs typically get 80% of their applications in the first 2 weeks",
          "Monitor your job posting performance and be ready to adjust salary or requirements if needed",
          "Good job postings get 20-50 quality applications - if you're getting less, consider improving your offer",
        ],
      },
    };

    return (
      insights[step] || {
        title: "💡 Keep Going!",
        tips: [
          "You're doing great! Each step brings you closer to finding the perfect workers for your business.",
        ],
      }
    );
  };

  const handleFlowSelection = (flow) => {
    setCurrentFlow(flow);
    setCurrentStep(0);

    // Auto-proceed with the selected flow
    if (flow === "bulk") {
      // For bulk creation, proceed to bulk setup
      // This will be handled in renderBulkCreation
    } else if (flow === "single") {
      // For single draft, proceed to step-by-step flow
      // This will be handled in renderSingleDraftFlow
    }
  };

  const validatePostingDetails = () => {
    const newErrors = {};

    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.lt_number.trim())
      newErrors.lt_number = "LT Number is required";
    if (!formData.chalani_number.trim())
      newErrors.chalani_number = "Chalani Number is required";

    if (!formData.approval_date_ad)
      newErrors.approval_date_ad = "Approval Date is required";
    if (!formData.posting_date_ad)
      newErrors.posting_date_ad = "Posting Date is required";

    if (!formData.announcement_type)
      newErrors.announcement_type = "Announcement Type is required";

    return newErrors;
  };

  const validateContract = () => {
    const newErrors = {};

    if (!formData.period_years || formData.period_years < 1) {
      newErrors.period_years = "Period Years must be at least 1";
    }
    if (!formData.renewable) {
      newErrors.renewable = "Renewable option is required";
    }
    if (
      !formData.hours_per_day ||
      formData.hours_per_day < 1 ||
      formData.hours_per_day > 16
    ) {
      newErrors.hours_per_day = "Hours Per Day must be between 1 and 16";
    }
    if (
      !formData.days_per_week ||
      formData.days_per_week < 1 ||
      formData.days_per_week > 7
    ) {
      newErrors.days_per_week = "Days Per Week must be between 1 and 7";
    }
    if (!formData.overtime_policy) {
      newErrors.overtime_policy = "Overtime Policy is required";
    }
    if (formData.weekly_off_days < 0 || formData.weekly_off_days > 7) {
      newErrors.weekly_off_days = "Weekly Off Days must be between 0 and 7";
    }
    if (!formData.food) {
      newErrors.food = "Food option is required";
    }
    if (!formData.accommodation) {
      newErrors.accommodation = "Accommodation option is required";
    }
    if (!formData.transport) {
      newErrors.transport = "Transport option is required";
    }
    if (!formData.annual_leave_days || formData.annual_leave_days < 0) {
      newErrors.annual_leave_days = "Annual Leave Days must be 0 or greater";
    }

    return newErrors;
  };

  const validatePositions = () => {
    const newErrors = {};

    if (!formData.positions || formData.positions.length === 0) {
      newErrors.positions_general = "At least one position is required";
      return newErrors;
    }

    formData.positions.forEach((position, index) => {
      const positionId = position.id;

      if (!position.position_title.trim()) {
        newErrors[`positions_${positionId}_position_title`] =
          "Position Title is required";
      }

      if (position.vacancies_male < 0) {
        newErrors[`positions_${positionId}_vacancies_male`] =
          "Vacancies (Male) must be 0 or greater";
      }

      if (position.vacancies_female < 0) {
        newErrors[`positions_${positionId}_vacancies_female`] =
          "Vacancies (Female) must be 0 or greater";
      }

      if (position.vacancies_male === 0 && position.vacancies_female === 0) {
        newErrors[`positions_${positionId}_vacancies_total`] =
          "Total vacancies must be greater than 0";
      }

      if (!position.monthly_salary || position.monthly_salary <= 0) {
        newErrors[`positions_${positionId}_monthly_salary`] =
          "Monthly Salary must be greater than 0";
      }

      if (!position.currency) {
        newErrors[`positions_${positionId}_currency`] = "Currency is required";
      }

      // Validate override fields if provided
      if (
        position.hours_per_day_override &&
        (position.hours_per_day_override < 1 ||
          position.hours_per_day_override > 16)
      ) {
        newErrors[`positions_${positionId}_hours_per_day_override`] =
          "Hours Per Day must be between 1 and 16";
      }

      if (
        position.days_per_week_override &&
        (position.days_per_week_override < 1 ||
          position.days_per_week_override > 7)
      ) {
        newErrors[`positions_${positionId}_days_per_week_override`] =
          "Days Per Week must be between 1 and 7";
      }

      if (
        position.weekly_off_days_override &&
        (position.weekly_off_days_override < 0 ||
          position.weekly_off_days_override > 7)
      ) {
        newErrors[`positions_${positionId}_weekly_off_days_override`] =
          "Weekly Off Days must be between 0 and 7";
      }
    });

    return newErrors;
  };

  const validateTagsAndTitles = () => {
    const newErrors = {};

    if (!formData.skills || formData.skills.length === 0) {
      newErrors.skills = "At least one skill is required";
    }

    if (
      !formData.education_requirements ||
      formData.education_requirements.length === 0
    ) {
      newErrors.education_requirements =
        "At least one education requirement is required";
    }

    if (
      formData.experience_requirements.min_years === "" ||
      formData.experience_requirements.min_years === null ||
      formData.experience_requirements.min_years === undefined ||
      (typeof formData.experience_requirements.min_years === 'number' && formData.experience_requirements.min_years < 0)
    ) {
      newErrors.experience_min_years =
        "Minimum years of experience is required and must be 0 or greater";
    }

    if (
      formData.experience_requirements.preferred_years &&
      formData.experience_requirements.preferred_years <
        formData.experience_requirements.min_years
    ) {
      newErrors.experience_preferred_years =
        "Preferred years must be greater than or equal to minimum years";
    }

    if (
      !formData.experience_requirements.domains ||
      formData.experience_requirements.domains.length === 0
    ) {
      newErrors.experience_domains =
        "At least one experience domain is required";
    }

    if (
      !formData.canonical_title_ids ||
      formData.canonical_title_ids.length === 0
    ) {
      newErrors.canonical_titles =
        "At least one canonical job title is required";
    }

    return newErrors;
  };

  const validateExpenses = () => {
    const newErrors = {};

    if (!formData.expenses || formData.expenses.length === 0) {
      newErrors.expenses_general = "At least one expense is required";
      return newErrors;
    }

    formData.expenses.forEach((expense, index) => {
      const expenseId = expense.id;

      if (!expense.type) {
        newErrors[`expenses_${expenseId}_type`] = "Expense Type is required";
      }

      if (!expense.who_pays) {
        newErrors[`expenses_${expenseId}_who_pays`] = "Who Pays is required";
      }

      // If expense is not free, amount and currency are required
      if (expense.is_free === false) {
        if (!expense.amount || expense.amount <= 0) {
          newErrors[`expenses_${expenseId}_amount`] =
            "Amount is required when expense is not free and must be greater than 0";
        }
        if (!expense.currency) {
          newErrors[`expenses_${expenseId}_currency`] =
            "Currency is required when expense is not free";
        }
      }
    });

    return newErrors;
  };

  const validateCutout = () => {
    const newErrors = {};

    if (!formData.cutout.file && !formData.cutout.uploaded_url) {
      newErrors.cutout_file = "Job advertisement image is required";
    }

    return newErrors;
  };

  const validateInterview = () => {
    const newErrors = {};

    // Interview is optional, but validate if any fields are filled
    if (
      formData.interview.time &&
      !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]\s?(AM|PM)?$/i.test(
        formData.interview.time
      )
    ) {
      newErrors.interview_time =
        "Please enter a valid time format (e.g., 10:00 AM or 14:30)";
    }

    // Validate interview expenses if any are added
    (formData.interview?.expenses || []).forEach((expense, index) => {
      const expenseId = expense.id;

      if (!expense.type) {
        newErrors[`interview_expense_${expenseId}_type`] =
          "Expense Type is required";
      }

      if (!expense.who_pays) {
        newErrors[`interview_expense_${expenseId}_who_pays`] =
          "Who Pays is required";
      }

      // If expense is not free, amount and currency are required
      if (expense.is_free === false) {
        if (!expense.amount || expense.amount <= 0) {
          newErrors[`interview_expense_${expenseId}_amount`] =
            "Amount is required when expense is not free";
        }
        if (!expense.currency) {
          newErrors[`interview_expense_${expenseId}_currency`] =
            "Currency is required when expense is not free";
        }
      }
    });

    return newErrors;
  };

  const addBulkEntry = () => {
    const newId =
      Math.max(...formData.bulk_entries.map((entry) => entry.id)) + 1;
    setFormData((prev) => ({
      ...prev,
      bulk_entries: [
        ...prev.bulk_entries,
        {
          id: newId,
          country: "",
          job_count: "",
          position: "",
        },
      ],
    }));
  };

  const removeBulkEntry = (id) => {
    setFormData((prev) => ({
      ...prev,
      bulk_entries: prev.bulk_entries.filter((entry) => entry.id !== id),
    }));
  };

  const updateBulkEntry = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      bulk_entries: prev.bulk_entries.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry
      ),
    }));
  };

  const addBulkCountry = () => {
    setFormData((prev) => ({
      ...prev,
      bulk_countries: [...prev.bulk_countries, { country: "", count: 1 }],
    }));
  };

  const removeBulkCountry = (index) => {
    setFormData((prev) => ({
      ...prev,
      bulk_countries: prev.bulk_countries.filter((_, i) => i !== index),
    }));
  };

  const updateBulkCountry = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      bulk_countries: prev.bulk_countries.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleSaveAndExit = () => {
    console.log("Saving partial draft:", formData);
    // Mark this as a partial draft
    const partialDraftData = {
      ...formData,
      is_partial: true,
      last_completed_step: currentStep,
      saved_at: new Date().toISOString(),
    };
    onSave({ type: "partial_draft", data: partialDraftData });
    onClose();
  };

  const handleContinue = () => {
    if (currentFlow === "bulk") {
      // Handle bulk creation or editing with multiple entries
      const bulkData = {
        entries: formData.bulk_entries.filter(
          (entry) => entry.country && entry.job_count
        ),
      };

      // Check if we're editing an existing bulk draft
      if (formData.editing_bulk_draft_id) {
        console.log("Updating existing bulk draft with data:", bulkData);
        // Include the editing ID for updating the existing bulk draft
        onSave({
          type: "bulk_edit",
          data: {
            ...bulkData,
            id: formData.editing_bulk_draft_id,
            title: formData.bulk_draft_title,
            company: formData.bulk_draft_company,
            description: formData.bulk_draft_description,
          },
        });
      } else {
        console.log("Creating new bulk drafts with data:", bulkData);
        onSave({ type: "bulk", data: bulkData });
      }
      onClose();
    } else {
      // Validate current step before proceeding
      const stepErrors = validateStep(currentStep);
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        return;
      }

      // Clear errors and move to next step
      setErrors({});
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else {
      setCurrentFlow("selection");
    }
  };

  // Check if all 8 steps are completed
  const areAllStepsCompleted = () => {
    // Validate steps 0-6 (step 7 is the review step)
    for (let step = 0; step <= 6; step++) {
      const stepErrors = validateStep(step);
      if (Object.keys(stepErrors).length > 0) {
        return false;
      }
    }
    return true;
  };

  const handlePublish = () => {
    // Final validation before publishing - validate ALL 8 steps (0-7)
    const allErrors = {};

    // Validate all required steps (0-6, step 7 is review)
    for (let step = 0; step <= 6; step++) {
      const stepErrors = validateStep(step);
      Object.assign(allErrors, stepErrors);
    }

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      // Navigate to first step with errors
      for (let step = 0; step <= 6; step++) {
        const stepErrors = validateStep(step);
        if (Object.keys(stepErrors).length > 0) {
          setCurrentStep(step);
          const remainingCount = Object.keys(stepErrors).length;
          alert(
            `${remainingCount} field${remainingCount > 1 ? 's' : ''} remaining in step ${step + 1}: ${
              singleDraftSteps[step].title
            }. Please complete to continue.`
          );
          break;
        }
      }
      return;
    }

    // Transform data to match API format
    const apiData = {
      // Basic job information (matches jobs.create.sample.json)
      posting_title:
        formData.posting_title ||
        `${formData.positions[0]?.position_title} Position`,
      country: formData.country,
      employer: formData.employer,
      contract: {
        period_years: formData.period_years,
        renewable: formData.renewable === "yes",
        hours_per_day: formData.hours_per_day,
        days_per_week: formData.days_per_week,
        overtime_policy: formData.overtime_policy,
        weekly_off_days: formData.weekly_off_days,
        food: formData.food,
        accommodation: formData.accommodation,
        transport: formData.transport,
        annual_leave_days: formData.annual_leave_days,
      },
      positions: formData.positions.map((pos) => ({
        title: pos.position_title,
        vacancies: {
          male: pos.vacancies_male,
          female: pos.vacancies_female,
        },
        salary: {
          monthly_amount: pos.monthly_salary,
          currency: pos.currency,
        },
        // Position-specific contract overrides
        contract_overrides: {
          hours_per_day: pos.hours_per_day_override || null,
          days_per_week: pos.days_per_week_override || null,
          overtime_policy: pos.overtime_policy_override || null,
          weekly_off_days: pos.weekly_off_days_override || null,
          food: pos.food_override || null,
          accommodation: pos.accommodation_override || null,
          transport: pos.transport_override || null,
        },
        notes: pos.position_notes || null,
      })),
      // Administrative details (for PATCH requests)
      administrative_details: {
        city: formData.city,
        lt_number: formData.lt_number,
        chalani_number: formData.chalani_number,
        approval_date_ad: formData.approval_date_ad,
        posting_date_ad: formData.posting_date_ad,
        announcement_type: formData.announcement_type,
        notes: formData.notes,
      },
      // Tags and requirements (matches jobs.update-tags.sample.json)
      tags_and_requirements: {
        skills: formData.skills,
        education_requirements: formData.education_requirements,
        experience_requirements: formData.experience_requirements,
        canonical_title_ids: formData.canonical_title_ids,
        canonical_title_names: formData.canonical_title_names,
      },
      // Expenses (matches expense sample files)
      expenses:
        formData.expenses
          ?.filter((exp) => exp.type && exp.who_pays)
          .map((exp) => ({
            type: exp.type,
            who_pays: exp.who_pays,
            is_free: exp.is_free,
            amount: exp.is_free ? null : exp.amount,
            currency: exp.is_free ? null : exp.currency,
            notes: exp.notes,
          })) || [],
      // Interview details (if provided)
      interview:
        formData.interview?.date_ad
          ? {
              date_ad: formData.interview.date_ad,
              time: formData.interview.time,
              location: formData.interview.location,
              contact_person: formData.interview.contact_person,
              required_documents: formData.interview.required_documents,
              notes: formData.interview.notes,
              expenses:
                formData.interview.expenses?.filter(
                  (exp) => exp.type && exp.who_pays
                ) || [],
            }
          : null,
      // Cutout file info
      cutout:
        formData.cutout?.file || formData.cutout?.uploaded_url
          ? {
              has_file: Boolean(
                formData.cutout.file || formData.cutout.uploaded_url
              ),
              is_uploaded: formData.cutout.is_uploaded,
              file_name: formData.cutout.file?.name || null,
              file_size: formData.cutout.file?.size || null,
              file_type: formData.cutout.file?.type || null,
            }
          : null,
    };

    // Proceed with publishing
    console.log("Publishing job with API-compatible data:", apiData);
    onSave({
      type: "single_publish",
      data: apiData,
      original_form_data: formData,
    });
    onClose();
  };

  const renderFlowSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-3">
          <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Create Job Draft
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          Choose how you'd like to create your job posting
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Single Draft Creation */}
        <div
          onClick={() => handleFlowSelection("single")}
          className={`group relative p-6 border-2 rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg ${
            currentFlow === "single"
              ? "border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 shadow-md"
              : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100 dark:hover:from-blue-900/20 dark:hover:to-blue-800/20 shadow-sm"
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div
                className={`p-2 rounded-lg transition-colors ${
                  currentFlow === "single"
                    ? "bg-blue-500 text-white"
                    : "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500 group-hover:text-white"
                }`}
              >
                <FileText className="w-6 h-6" />
              </div>
              <div
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  currentFlow === "single"
                    ? "bg-blue-500 text-white"
                    : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                }`}
              >
                Recommended
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                Draft Creation
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3 text-sm leading-relaxed">
                Create a single job posting with detailed information through
                our 7-step process
              </p>
            </div>

            <div className="bg-white/70 dark:bg-gray-700/70 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-blue-500 dark:bg-blue-400 rounded-full mr-2"></div>
                  <span>
                    <strong>Process:</strong> Single detailed job → Complete
                    steps → Publish
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-blue-500 dark:bg-blue-400 rounded-full mr-2"></div>
                  <span>
                    <strong>Best for:</strong> Detailed job specifications
                  </span>
                </div>
              </div>
            </div>
          </div>

          {currentFlow === "single" && (
            <div className="absolute top-3 right-3">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Draft Creation */}
        <div
          onClick={() => handleFlowSelection("bulk")}
          className={`group relative p-6 border-2 rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg ${
            currentFlow === "bulk"
              ? "border-green-500 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 shadow-md"
              : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-green-300 dark:hover:border-green-600 hover:bg-gradient-to-br hover:from-green-50 hover:to-green-100 dark:hover:from-green-900/20 dark:hover:to-green-800/20 shadow-sm"
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div
                className={`p-2 rounded-lg transition-colors ${
                  currentFlow === "bulk"
                    ? "bg-green-500 text-white"
                    : "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 group-hover:bg-green-500 group-hover:text-white"
                }`}
              >
                <Users className="w-6 h-6" />
              </div>
              <div
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  currentFlow === "bulk"
                    ? "bg-green-500 text-white"
                    : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                }`}
              >
                Quick Setup
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                Bulk Create Drafts
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3 text-sm leading-relaxed">
                Create multiple job drafts quickly by specifying countries and
                quantities
              </p>
            </div>

            <div className="bg-white/70 dark:bg-gray-700/70 rounded-lg p-3 border border-green-200 dark:border-green-700">
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-green-500 dark:bg-green-400 rounded-full mr-2"></div>
                  <span>
                    <strong>Example:</strong> \"12 from UAE, 3 from Malaysia\"
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-green-500 dark:bg-green-400 rounded-full mr-2"></div>
                  <span>
                    <strong>Best for:</strong> Multiple similar positions
                  </span>
                </div>
              </div>
            </div>
          </div>

          {currentFlow === "bulk" && (
            <div className="absolute top-3 right-3">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>

      {currentFlow && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              🤖 AI Insights
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {currentFlow === "single"
                ? "Comprehensive 8-step process for detailed job postings with high conversion rates"
                : "Efficient batch creation strategy for scaling recruitment across multiple locations"}
            </p>
          </div>

          {currentFlow === "single" && (
            <div className="overflow-x-auto">
              <div className="flex items-center justify-between min-w-max px-4">
                {singleDraftSteps.map((step, index) => {
                  const StepIcon = step.icon;

                  return (
                    <div key={step.id} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-600 flex items-center justify-center">
                          <StepIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="mt-2 text-center">
                          <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                            {step.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {step.description}
                          </p>
                        </div>
                      </div>
                      {index < singleDraftSteps.length - 1 && (
                        <div className="w-16 h-0.5 bg-blue-200 dark:bg-blue-700 mx-4 mt-[-20px]" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {currentFlow === "bulk" && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-700">
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-8">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">1</span>
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Create Bulk Drafts
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">2</span>
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Fill Details Individually
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">3</span>
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Publish from Draft List
                    </span>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-300 dark:border-green-600">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-medium text-green-700 dark:text-green-400 mb-1">
                        ⚡ Speed
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        Create 10+ drafts in under 2 minutes
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-green-700 dark:text-green-400 mb-1">
                        🎯 Efficiency
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        Perfect for multi-location hiring
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-green-700 dark:text-green-400 mb-1">
                        📊 Scale
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        Ideal for 5+ similar positions
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderBulkCreation = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Bulk Create Drafts
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Create multiple job drafts quickly and efficiently
          </p>
        </div>
        <button
          onClick={() => setCurrentFlow("selection")}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 rounded-md transition-colors shadow-sm"
        >
          Back to Selection
        </button>
      </div>

      {/* Bulk Creation Form */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Create Bulk Drafts
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Specify the country, number of jobs, and position type to create
          multiple drafts
        </p>

        <div className="space-y-4">
          {formData.bulk_entries.map((entry, index) => (
            <div
              key={entry.id}
              className="border border-gray-100 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Bulk Entry #{index + 1}
                </h4>
                {formData.bulk_entries.length > 1 && (
                  <button
                    onClick={() => removeBulkEntry(entry.id)}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Country Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={entry.country}
                    onChange={(e) =>
                      updateBulkEntry(entry.id, "country", e.target.value)
                    }
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Select country</option>
                    {countries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Number of Jobs Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    No of Jobs <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={entry.job_count}
                    onChange={(e) =>
                      updateBulkEntry(entry.id, "job_count", e.target.value)
                    }
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="e.g., 12"
                  />
                </div>

                {/* Position Field (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Position{" "}
                    <span className="text-gray-500 dark:text-gray-400">
                      (Optional)
                    </span>
                  </label>
                  <select
                    value={entry.position}
                    onChange={(e) =>
                      updateBulkEntry(entry.id, "position", e.target.value)
                    }
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Select position</option>
                    <option value="Security Guard">Security Guard</option>
                    <option value="Cook">Cook</option>
                    <option value="Cleaner">Cleaner</option>
                    <option value="Driver">Driver</option>
                    <option value="Helper">Helper</option>
                    <option value="Technician">Technician</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Manager">Manager</option>
                    <option value="Engineer">Engineer</option>
                    <option value="Accountant">Accountant</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={() => setCurrentFlow("selection")}
          className="flex items-center px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back to Selection
        </button>

        {(() => {
          const validEntries = formData.bulk_entries.filter(
            (entry) => entry.country && entry.job_count
          );
          const totalJobs = validEntries.reduce(
            (sum, entry) => sum + (parseInt(entry.job_count) || 0),
            0
          );
          const hasValidEntries = validEntries.length > 0;

          return (
            <div className="flex items-center space-x-4">
              {hasValidEntries && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total: {totalJobs} job{totalJobs !== 1 ? "s" : ""} from{" "}
                  {validEntries.length} entr
                  {validEntries.length !== 1 ? "ies" : "y"}
                </div>
              )}
              <button
                onClick={handleContinue}
                disabled={!hasValidEntries}
                className="flex items-center px-6 py-3 bg-green-600 dark:bg-green-600 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-700 transition-colors disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                Generate {totalJobs} Job Draft{totalJobs !== 1 ? "s" : ""}
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          );
        })()}
      </div>
    </div>
  );

  const renderSingleDraftFlow = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Create Job Draft
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Step {currentStep + 1} of {singleDraftSteps.length}:{" "}
            {singleDraftSteps[currentStep]?.description}
          </p>
        </div>
        <button
          onClick={() => setCurrentFlow("selection")}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 rounded-md transition-colors shadow-sm"
        >
          Back to Selection
        </button>
      </div>

      {/* Progress Steps */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-center justify-between">
          {singleDraftSteps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    isCompleted
                      ? "bg-green-100 border-green-500 text-green-700"
                      : isActive
                      ? "bg-blue-100 border-blue-500 text-blue-700"
                      : "bg-gray-100 border-gray-300 text-gray-500"
                  }`}
                >
                  <StepIcon className="w-4 h-4" />
                </div>
                <div className="ml-2 hidden sm:block">
                  <p
                    className={`text-xs font-medium ${
                      isActive
                        ? "text-blue-700"
                        : isCompleted
                        ? "text-green-700"
                        : "text-gray-500"
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
                {index < singleDraftSteps.length - 1 && (
                  <div className="w-8 h-0.5 bg-gray-300 mx-2" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {currentStep === 0 && (
          // Posting Details Form
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Administrative Details
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Enrich the draft posting with administrative details via a
                partial update (PATCH) to the posting.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Country <span className="text-red-500 dark:text-red-400">*</span>
                  <HelpCircle
                    className="inline w-4 h-4 ml-1 text-gray-400 dark:text-gray-500 cursor-help"
                    title="Select the country where the job will be located"
                  />
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => handleInputChange("country", e.target.value)}
                  disabled={loadingCountries}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    errors.country
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                >
                  <option value="">
                    {loadingCountries ? "Loading countries..." : "Select a country"}
                  </option>
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
                {errors.country && (
                  <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                    {errors.country}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  e.g., United Arab Emirates
                </p>
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  City <span className="text-red-500 dark:text-red-400">*</span>
                  <HelpCircle
                    className="inline w-4 h-4 ml-1 text-gray-400 dark:text-gray-500 cursor-help"
                    title="Enter the city where the job will be located"
                  />
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="Enter city name"
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                    errors.city
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {errors.city && (
                  <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                    {errors.city}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  e.g., Dubai
                </p>
              </div>

              {/* LT Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  LT Number{" "}
                  <span className="text-red-500 dark:text-red-400">*</span>
                  <HelpCircle
                    className="inline w-4 h-4 ml-1 text-gray-400 dark:text-gray-500 cursor-help"
                    title="Labor Token Number issued by the government"
                  />
                </label>
                <input
                  type="text"
                  value={formData.lt_number}
                  onChange={(e) =>
                    handleInputChange("lt_number", e.target.value)
                  }
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                    errors.lt_number
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder="Enter LT Number"
                />
                {errors.lt_number && (
                  <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                    {errors.lt_number}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  e.g., LT-2024-001
                </p>
              </div>

              {/* Chalani Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Chalani Number{" "}
                  <span className="text-red-500 dark:text-red-400">*</span>
                  <HelpCircle
                    className="inline w-4 h-4 ml-1 text-gray-400 dark:text-gray-500 cursor-help"
                    title="Government chalani/reference number"
                  />
                </label>
                <input
                  type="text"
                  value={formData.chalani_number}
                  onChange={(e) =>
                    handleInputChange("chalani_number", e.target.value)
                  }
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                    errors.chalani_number
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder="Enter Chalani Number"
                />
                {errors.chalani_number && (
                  <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                    {errors.chalani_number}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  e.g., CH-2024-001
                </p>
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Approval Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Approval Date{" "}
                  <span className="text-red-500 dark:text-red-400">*</span>
                  <HelpCircle
                    className="inline w-4 h-4 ml-1 text-gray-400 dark:text-gray-500 cursor-help"
                    title="Date when the job posting was approved by authorities"
                  />
                </label>
                <input
                  type="date"
                  value={formData.approval_date_ad}
                  onChange={(e) =>
                    handleInputChange("approval_date_ad", e.target.value)
                  }
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    errors.approval_date_ad
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {errors.approval_date_ad && (
                  <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                    {errors.approval_date_ad}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  e.g., 2025-09-12
                </p>
              </div>

              {/* Posting Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Posting Date{" "}
                  <span className="text-red-500 dark:text-red-400">*</span>
                  <HelpCircle
                    className="inline w-4 h-4 ml-1 text-gray-400 dark:text-gray-500 cursor-help"
                    title="Date when the job will be posted/published"
                  />
                </label>
                <input
                  type="date"
                  value={formData.posting_date_ad}
                  onChange={(e) =>
                    handleInputChange("posting_date_ad", e.target.value)
                  }
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    errors.posting_date_ad
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {errors.posting_date_ad && (
                  <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                    {errors.posting_date_ad}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  e.g., 2025-09-12
                </p>
              </div>
            </div>

            {/* Announcement Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Announcement Type{" "}
                <span className="text-red-500 dark:text-red-400">*</span>
                <HelpCircle
                  className="inline w-4 h-4 ml-1 text-gray-400 dark:text-gray-500 cursor-help"
                  title="Medium through which the job will be announced"
                />
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {announcementTypes.map((type) => (
                  <label
                    key={type.value}
                    className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    <input
                      type="radio"
                      name="announcement_type"
                      value={type.value}
                      checked={formData.announcement_type === type.value}
                      onChange={(e) =>
                        handleInputChange("announcement_type", e.target.value)
                      }
                      className="mr-3"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {type.label}
                    </span>
                  </label>
                ))}
              </div>
              {errors.announcement_type && (
                <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                  {errors.announcement_type}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                e.g., Newspaper, Online, Agency Board
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes{" "}
                <span className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                  (Optional)
                </span>
                <HelpCircle
                  className="inline w-4 h-4 ml-1 text-gray-400 dark:text-gray-500 cursor-help"
                  title="Additional administrative remarks or special instructions"
                />
              </label>
              <textarea
                rows={4}
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Additional administrative remarks..."
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                e.g., Additional administrative remarks
              </p>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Contract Details
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Define the employment terms for the job posting.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Period Years */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Period Years <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.period_years}
                  onChange={(e) =>
                    handleInputChange(
                      "period_years",
                      e.target.value === "" ? "" : parseInt(e.target.value) || ""
                    )
                  }
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.period_years ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="2"
                  min="1"
                  max="10"
                />
                {errors.period_years && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.period_years}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">e.g., 2</p>
              </div>

              {/* Renewable */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Renewable <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="renewable"
                      value="yes"
                      checked={formData.renewable === "yes"}
                      onChange={(e) => handleInputChange("renewable", "yes")}
                      className="mr-2 text-blue-600"
                    />
                    Yes
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="renewable"
                      value="no"
                      checked={formData.renewable === "no"}
                      onChange={(e) => handleInputChange("renewable", "no")}
                      className="mr-2 text-blue-600"
                    />
                    No
                  </label>
                </div>
                {errors.renewable && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.renewable}
                  </p>
                )}
              </div>

              {/* Hours Per Day */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hours Per Day <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.hours_per_day}
                  onChange={(e) =>
                    handleInputChange(
                      "hours_per_day",
                      e.target.value === "" ? "" : parseInt(e.target.value) || ""
                    )
                  }
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.hours_per_day ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="8"
                  min="1"
                  max="16"
                />
                {errors.hours_per_day && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.hours_per_day}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">e.g., 8</p>
              </div>

              {/* Days Per Week */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Days Per Week <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.days_per_week}
                  onChange={(e) =>
                    handleInputChange(
                      "days_per_week",
                      e.target.value === "" ? "" : parseInt(e.target.value) || ""
                    )
                  }
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.days_per_week ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="6"
                  min="1"
                  max="7"
                />
                {errors.days_per_week && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.days_per_week}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">e.g., 6</p>
              </div>

              {/* Overtime Policy */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Overtime Policy <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.overtime_policy}
                  onChange={(e) =>
                    handleInputChange("overtime_policy", e.target.value)
                  }
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.overtime_policy
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                >
                  <option value="as_per_company_policy">
                    As per company policy
                  </option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="not_applicable">Not applicable</option>
                </select>
                {errors.overtime_policy && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.overtime_policy}
                  </p>
                )}
              </div>

              {/* Weekly Off Days */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Weekly Off Days <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.weekly_off_days}
                  onChange={(e) =>
                    handleInputChange(
                      "weekly_off_days",
                      e.target.value === "" ? "" : parseInt(e.target.value) || ""
                    )
                  }
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.weekly_off_days
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="1"
                  min="0"
                  max="7"
                />
                {errors.weekly_off_days && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.weekly_off_days}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">e.g., 1</p>
              </div>

              {/* Food */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Food <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.food}
                  onChange={(e) => handleInputChange("food", e.target.value)}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.food ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                  <option value="not_provided">Not provided</option>
                </select>
                {errors.food && (
                  <p className="text-red-500 text-xs mt-1">{errors.food}</p>
                )}
              </div>

              {/* Accommodation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Accommodation <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.accommodation}
                  onChange={(e) =>
                    handleInputChange("accommodation", e.target.value)
                  }
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.accommodation ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                  <option value="not_provided">Not provided</option>
                </select>
                {errors.accommodation && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.accommodation}
                  </p>
                )}
              </div>

              {/* Transport */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Transport <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.transport}
                  onChange={(e) =>
                    handleInputChange("transport", e.target.value)
                  }
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.transport ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                  <option value="not_provided">Not provided</option>
                </select>
                {errors.transport && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.transport}
                  </p>
                )}
              </div>

              {/* Annual Leave Days */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Annual Leave Days <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.annual_leave_days}
                  onChange={(e) =>
                    handleInputChange(
                      "annual_leave_days",
                      e.target.value === "" ? "" : parseInt(e.target.value) || ""
                    )
                  }
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.annual_leave_days
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="21"
                  min="0"
                  max="365"
                />
                {errors.annual_leave_days && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.annual_leave_days}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">e.g., 21</p>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Job Positions
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Define one or more job positions, including salary and optional
                overrides for contract terms.
              </p>
            </div>

            {errors.positions_general && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-600 text-sm">
                  {errors.positions_general}
                </p>
              </div>
            )}

            {formData.positions.map((position, index) => (
              <div
                key={position.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-6 bg-white dark:bg-gray-800"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">
                    Position {index + 1}
                  </h4>
                  {formData.positions.length > 1 && (
                    <button
                      onClick={() => removePosition(position.id)}
                      className="text-red-600 hover:text-red-800 text-sm px-3 py-1 border border-red-300 rounded-md hover:bg-red-50"
                    >
                      Remove Position
                    </button>
                  )}
                </div>

                {/* Basic Position Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Position Title */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Position Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={position.position_title}
                      onChange={(e) =>
                        updatePosition(
                          position.id,
                          "position_title",
                          e.target.value
                        )
                      }
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[`positions_${position.id}_position_title`]
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="e.g., Cook"
                    />
                    {errors[`positions_${position.id}_position_title`] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors[`positions_${position.id}_position_title`]}
                      </p>
                    )}
                  </div>

                  {/* Vacancies Male */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Vacancies (Male) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={position.vacancies_male}
                      onChange={(e) =>
                        updatePosition(
                          position.id,
                          "vacancies_male",
                          e.target.value === "" ? "" : parseInt(e.target.value) || ""
                        )
                      }
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                        errors[`positions_${position.id}_vacancies_male`]
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      placeholder="5"
                      min="0"
                    />
                    {errors[`positions_${position.id}_vacancies_male`] && (
                      <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                        {errors[`positions_${position.id}_vacancies_male`]}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      e.g., 5
                    </p>
                  </div>

                  {/* Vacancies Female */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Vacancies (Female) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={position.vacancies_female}
                      onChange={(e) =>
                        updatePosition(
                          position.id,
                          "vacancies_female",
                          e.target.value === "" ? "" : parseInt(e.target.value) || ""
                        )
                      }
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                        errors[`positions_${position.id}_vacancies_female`]
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      placeholder="3"
                      min="0"
                    />
                    {errors[`positions_${position.id}_vacancies_female`] && (
                      <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                        {errors[`positions_${position.id}_vacancies_female`]}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      e.g., 3
                    </p>
                  </div>

                  {/* Total Vacancies Error */}
                  {errors[`positions_${position.id}_vacancies_total`] && (
                    <div className="md:col-span-2">
                      <p className="text-red-500 dark:text-red-400 text-xs">
                        {errors[`positions_${position.id}_vacancies_total`]}
                      </p>
                    </div>
                  )}

                  {/* Monthly Salary */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Monthly Salary <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={position.monthly_salary}
                      onChange={(e) =>
                        updatePosition(
                          position.id,
                          "monthly_salary",
                          e.target.value === "" ? "" : parseInt(e.target.value) || ""
                        )
                      }
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                        errors[`positions_${position.id}_monthly_salary`]
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      placeholder="1800"
                      min="1"
                    />
                    {errors[`positions_${position.id}_monthly_salary`] && (
                      <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                        {errors[`positions_${position.id}_monthly_salary`]}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      e.g., 1800
                    </p>
                  </div>

                  {/* Currency */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Currency <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={position.currency}
                      onChange={(e) =>
                        updatePosition(position.id, "currency", e.target.value)
                      }
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                        errors[`positions_${position.id}_currency`]
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      {currencies.map((curr) => (
                        <option key={curr.value} value={curr.value}>
                          {curr.label}
                        </option>
                      ))}
                    </select>
                    {errors[`positions_${position.id}_currency`] && (
                      <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                        {errors[`positions_${position.id}_currency`]}
                      </p>
                    )}
                  </div>
                </div>

                {/* Contract Overrides Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Contract Term Overrides (Optional)
                  </h5>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    Override default contract terms for this specific position.
                    Leave blank to use defaults from Contract step.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Hours Per Day Override */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Hours Per Day Override
                      </label>
                      <input
                        type="number"
                        value={position.hours_per_day_override}
                        onChange={(e) =>
                          updatePosition(
                            position.id,
                            "hours_per_day_override",
                            e.target.value === "" ? "" : parseInt(e.target.value) || ""
                          )
                        }
                        className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                          errors[
                            `positions_${position.id}_hours_per_day_override`
                          ]
                            ? "border-red-500"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                        placeholder={`Default: ${formData.hours_per_day}`}
                        min="1"
                        max="16"
                      />
                      {errors[
                        `positions_${position.id}_hours_per_day_override`
                      ] && (
                        <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                          {
                            errors[
                              `positions_${position.id}_hours_per_day_override`
                            ]
                          }
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        e.g., 9
                      </p>
                    </div>

                    {/* Days Per Week Override */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Days Per Week Override
                      </label>
                      <input
                        type="number"
                        value={position.days_per_week_override}
                        onChange={(e) =>
                          updatePosition(
                            position.id,
                            "days_per_week_override",
                            e.target.value === "" ? "" : parseInt(e.target.value) || ""
                          )
                        }
                        className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                          errors[
                            `positions_${position.id}_days_per_week_override`
                          ]
                            ? "border-red-500"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                        placeholder={`Default: ${formData.days_per_week}`}
                        min="1"
                        max="7"
                      />
                      {errors[
                        `positions_${position.id}_days_per_week_override`
                      ] && (
                        <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                          {
                            errors[
                              `positions_${position.id}_days_per_week_override`
                            ]
                          }
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        e.g., 5
                      </p>
                    </div>

                    {/* Overtime Policy Override */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Overtime Policy Override
                      </label>
                      <select
                        value={position.overtime_policy_override}
                        onChange={(e) =>
                          updatePosition(
                            position.id,
                            "overtime_policy_override",
                            e.target.value
                          )
                        }
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="">
                          Use default (
                          {
                            overtimePolicyOptions.find(
                              (opt) => opt.value === formData.overtime_policy
                            )?.label
                          }
                          )
                        </option>
                        {overtimePolicyOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Weekly Off Days Override */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Weekly Off Days Override
                      </label>
                      <input
                        type="number"
                        value={position.weekly_off_days_override}
                        onChange={(e) =>
                          updatePosition(
                            position.id,
                            "weekly_off_days_override",
                            e.target.value === "" ? "" : parseInt(e.target.value) || ""
                          )
                        }
                        className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                          errors[
                            `positions_${position.id}_weekly_off_days_override`
                          ]
                            ? "border-red-500"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                        placeholder={`Default: ${formData.weekly_off_days}`}
                        min="0"
                        max="7"
                      />
                      {errors[
                        `positions_${position.id}_weekly_off_days_override`
                      ] && (
                        <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                          {
                            errors[
                              `positions_${position.id}_weekly_off_days_override`
                            ]
                          }
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        e.g., 2
                      </p>
                    </div>

                    {/* Food Override */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Food Override
                      </label>
                      <select
                        value={position.food_override}
                        onChange={(e) =>
                          updatePosition(
                            position.id,
                            "food_override",
                            e.target.value
                          )
                        }
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="">
                          Use default (
                          {
                            provisionOptions.find(
                              (opt) => opt.value === formData.food
                            )?.label
                          }
                          )
                        </option>
                        {provisionOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Accommodation Override */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Accommodation Override
                      </label>
                      <select
                        value={position.accommodation_override}
                        onChange={(e) =>
                          updatePosition(
                            position.id,
                            "accommodation_override",
                            e.target.value
                          )
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">
                          Use default (
                          {
                            provisionOptions.find(
                              (opt) => opt.value === formData.accommodation
                            )?.label
                          }
                          )
                        </option>
                        {provisionOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Transport Override */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Transport Override
                      </label>
                      <select
                        value={position.transport_override}
                        onChange={(e) =>
                          updatePosition(
                            position.id,
                            "transport_override",
                            e.target.value
                          )
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">
                          Use default (
                          {
                            provisionOptions.find(
                              (opt) => opt.value === formData.transport
                            )?.label
                          }
                          )
                        </option>
                        {provisionOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Position Notes */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Position Notes
                      </label>
                      <textarea
                        rows={3}
                        value={position.position_notes}
                        onChange={(e) =>
                          updatePosition(
                            position.id,
                            "position_notes",
                            e.target.value
                          )
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        placeholder="e.g., Specific requirements for this position"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Optional notes specific to this position
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Position Button */}
            <div className="flex justify-center">
              <button
                onClick={addPosition}
                className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another Position
              </button>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-medium mb-1">💡 Pro Tip</p>
                  <p>
                    You can override contract terms for individual positions. If
                    left blank, the general contract terms will apply.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Tags & Canonical Titles
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Add skills, education, experience requirements, and canonical
                job titles.
              </p>
            </div>

            <div className="space-y-8">
              {/* Skills Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Skills{" "}
                  <span className="text-red-500 dark:text-red-400">*</span>
                  <HelpCircle
                    className="inline w-4 h-4 ml-1 text-gray-400 dark:text-gray-500 cursor-help"
                    title="Required skills and competencies for this job"
                  />
                </label>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                      >
                        {skill}
                        <button
                          onClick={() => removeTag("skills", skill)}
                          className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        addTag("skills", e.target.value);
                        e.target.value = "";
                      }
                    }}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Select a skill to add...</option>
                    {predefinedSkills
                      .filter((skill) => !formData.skills.includes(skill))
                      .map((skill) => (
                        <option key={skill} value={skill}>
                          {skill}
                        </option>
                      ))}
                  </select>
                  {errors.skills && (
                    <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                      {errors.skills}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    e.g., Cooking, Customer Service
                  </p>
                </div>
              </div>

              {/* Education Requirements Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Education Requirements{" "}
                  <span className="text-red-500 dark:text-red-400">*</span>
                  <HelpCircle
                    className="inline w-4 h-4 ml-1 text-gray-400 dark:text-gray-500 cursor-help"
                    title="Minimum educational qualifications required"
                  />
                </label>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {formData.education_requirements.map((edu, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                      >
                        {edu}
                        <button
                          onClick={() =>
                            removeTag("education_requirements", edu)
                          }
                          className="ml-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        addTag("education_requirements", e.target.value);
                        e.target.value = "";
                      }
                    }}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">
                      Select an education requirement to add...
                    </option>
                    {educationRequirements
                      .filter(
                        (edu) => !formData.education_requirements.includes(edu)
                      )
                      .map((edu) => (
                        <option key={edu} value={edu}>
                          {edu}
                        </option>
                      ))}
                  </select>
                  {errors.education_requirements && (
                    <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                      {errors.education_requirements}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    e.g., High School, Vocational Training
                  </p>
                </div>
              </div>

              {/* Experience Requirements Section */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800">
                <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-4">
                  Experience Requirements
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Minimum Years */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Minimum Years{" "}
                      <span className="text-red-500 dark:text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.experience_requirements.min_years}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          experience_requirements: {
                            ...prev.experience_requirements,
                            min_years: e.target.value === "" ? "" : parseInt(e.target.value) || "",
                          },
                        }));
                        // Clear related errors when updating min years
                        if (errors.experience_min_years) {
                          setErrors((prev) => ({
                            ...prev,
                            experience_min_years: null,
                          }));
                        }
                      }}
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                        errors.experience_min_years
                          ? "border-red-500 dark:border-red-400"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      placeholder="2"
                      min="0"
                    />
                    {errors.experience_min_years && (
                      <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                        {errors.experience_min_years}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      e.g., 2
                    </p>
                  </div>

                  {/* Preferred Years */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Preferred Years (Optional)
                    </label>
                    <input
                      type="number"
                      value={formData.experience_requirements.preferred_years}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          experience_requirements: {
                            ...prev.experience_requirements,
                            preferred_years: e.target.value === "" ? "" : parseInt(e.target.value) || "",
                          },
                        }))
                      }
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                        errors.experience_preferred_years
                          ? "border-red-500 dark:border-red-400"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      placeholder="5"
                      min={formData.experience_requirements.min_years}
                    />
                    {errors.experience_preferred_years && (
                      <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                        {errors.experience_preferred_years}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      e.g., 5
                    </p>
                  </div>
                </div>

                {/* Experience Domains */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Domains{" "}
                    <span className="text-red-500 dark:text-red-400">*</span>
                  </label>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {formData.experience_requirements.domains.map(
                        (domain, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300"
                          >
                            {domain}
                            <button
                              onClick={() => removeExperienceDomain(domain)}
                              className="ml-2 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200"
                            >
                              ×
                            </button>
                          </span>
                        )
                      )}
                    </div>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          addExperienceDomain(e.target.value);
                          e.target.value = "";
                        }
                      }}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Select a domain to add...</option>
                      {experienceDomains
                        .filter(
                          (domain) =>
                            !formData.experience_requirements.domains.includes(
                              domain
                            )
                        )
                        .map((domain) => (
                          <option key={domain} value={domain}>
                            {domain}
                          </option>
                        ))}
                    </select>
                    {errors.experience_domains && (
                      <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                        {errors.experience_domains}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      e.g., Hospitality, Culinary
                    </p>
                  </div>
                </div>
              </div>

              {/* Canonical Job Titles Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Canonical Job Titles{" "}
                  <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {formData.canonical_title_names.map((titleName, index) => {
                      const titleId = formData.canonical_title_ids[index];
                      const title = jobTitles.find((t) => t.id === titleId);
                      return (
                        <span
                          key={titleId}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300"
                        >
                          {titleName}{" "}
                          {title && (
                            <span className="ml-1 text-indigo-600 dark:text-indigo-400">
                              ({title.category})
                            </span>
                          )}
                          <button
                            onClick={() => removeCanonicalTitle(titleId)}
                            className="ml-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        const selectedTitle = jobTitles.find(
                          (title) => title.id === parseInt(e.target.value)
                        );
                        if (selectedTitle) {
                          addCanonicalTitle(selectedTitle);
                          e.target.value = "";
                        }
                      }
                    }}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">
                      Select a canonical job title to add...
                    </option>
                    {jobTitles
                      .filter(
                        (title) =>
                          !formData.canonical_title_ids.includes(title.id)
                      )
                      .map((title) => (
                        <option key={title.id} value={title.id}>
                          {title.name} ({title.category})
                        </option>
                      ))}
                  </select>
                  {errors.canonical_titles && (
                    <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                      {errors.canonical_titles}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    e.g., Professional Cook, Security Guard
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 7 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Review and Publish
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Review all entered information and publish your job posting when
                ready.
              </p>

              {/* Completion Status */}
              <div
                className={`p-4 rounded-lg border ${
                  areAllStepsCompleted()
                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                    : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                }`}
              >
                <div className="flex items-center">
                  {areAllStepsCompleted() ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                      <span className="text-sm font-medium text-green-800 dark:text-green-300">
                        All 8 steps completed! Ready to publish.
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 mr-2" />
                      <span className="text-sm font-medium text-orange-800 dark:text-orange-300">
                        Some fields are still incomplete. Please complete all steps before
                        publishing.
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Basic Job Information */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">
                    Basic Job Information
                  </h4>
                  <button
                    onClick={() => setCurrentStep(0)}
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
                  <div>
                    <span className="font-medium">Posting Title:</span>{" "}
                    <span className="ml-2">
                      {formData.posting_title || "Not specified"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Country:</span>{" "}
                    <span className="ml-2">
                      {formData.country || "Not specified"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Employer:</span>{" "}
                    <span className="ml-2">
                      {formData.employer || "Not specified"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Contract Period:</span>{" "}
                    <span className="ml-2">{formData.period_years} years</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-medium">Positions:</span>
                    <span className="ml-2">
                      {formData.positions
                        .filter((p) => p.position_title)
                        .map(
                          (p) =>
                            `${p.position_title} (${p.monthly_salary} ${p.currency})`
                        )
                        .join(", ") || "No positions defined"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Posting Details */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">
                    Posting Details
                  </h4>
                  <button
                    onClick={() => setCurrentStep(0)}
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
                  <div>
                    <span className="font-medium">City:</span>{" "}
                    <span className="ml-2">
                      {formData.city || "Not specified"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">LT Number:</span>{" "}
                    <span className="ml-2">
                      {formData.lt_number || "Not specified"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Chalani Number:</span>{" "}
                    <span className="ml-2">
                      {formData.chalani_number || "Not specified"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Approval Date:</span>{" "}
                    <span className="ml-2">
                      {formData.date_format === "AD"
                        ? formData.approval_date_ad
                        : formData.approval_date_bs || "Not specified"}
                      {(formData.approval_date_ad ||
                        formData.approval_date_bs) &&
                        ` (${formData.date_format})`}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Posting Date:</span>{" "}
                    <span className="ml-2">
                      {formData.date_format === "AD"
                        ? formData.posting_date_ad
                        : formData.posting_date_bs || "Not specified"}
                      {(formData.posting_date_ad || formData.posting_date_bs) &&
                        ` (${formData.date_format})`}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Announcement Type:</span>{" "}
                    <span className="ml-2">
                      {formData.announcement_type || "Not specified"}
                    </span>
                  </div>
                  {formData.notes && (
                    <div className="md:col-span-2">
                      <span className="font-medium">Notes:</span>{" "}
                      <span className="ml-2">{formData.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contract */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">
                    Contract Terms
                  </h4>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700 dark:text-gray-300">
                  <div>
                    <span className="font-medium">Period Years:</span>{" "}
                    <span className="ml-2">{formData.period_years}</span>
                  </div>
                  <div>
                    <span className="font-medium">Renewable:</span>{" "}
                    <span className="ml-2">
                      {formData.renewable === "yes" ? "Yes" : "No"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Hours Per Day:</span>{" "}
                    <span className="ml-2">{formData.hours_per_day}</span>
                  </div>
                  <div>
                    <span className="font-medium">Days Per Week:</span>{" "}
                    <span className="ml-2">{formData.days_per_week}</span>
                  </div>
                  <div>
                    <span className="font-medium">Overtime Policy:</span>{" "}
                    <span className="ml-2">
                      {
                        overtimePolicyOptions.find(
                          (opt) => opt.value === formData.overtime_policy
                        )?.label
                      }
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Weekly Off Days:</span>{" "}
                    <span className="ml-2">{formData.weekly_off_days}</span>
                  </div>
                  <div>
                    <span className="font-medium">Food:</span>{" "}
                    <span className="ml-2">
                      {
                        provisionOptions.find(
                          (opt) => opt.value === formData.food
                        )?.label
                      }
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Accommodation:</span>{" "}
                    <span className="ml-2">
                      {
                        provisionOptions.find(
                          (opt) => opt.value === formData.accommodation
                        )?.label
                      }
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Transport:</span>{" "}
                    <span className="ml-2">
                      {
                        provisionOptions.find(
                          (opt) => opt.value === formData.transport
                        )?.label
                      }
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Annual Leave Days:</span>{" "}
                    <span className="ml-2">{formData.annual_leave_days}</span>
                  </div>
                </div>
              </div>

              {/* Positions */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">
                    Job Positions ({formData.positions.length})
                  </h4>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                </div>
                <div className="space-y-4">
                  {formData.positions.map((position, index) => (
                    <div
                      key={position.id}
                      className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700 dark:text-gray-300">
                        <div>
                          <span className="font-medium">Title:</span>{" "}
                          <span className="ml-2">
                            {position.position_title || "Not specified"}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Salary:</span>{" "}
                          <span className="ml-2">
                            {position.monthly_salary} {position.currency}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Vacancies (M/F):</span>{" "}
                          <span className="ml-2">
                            {position.vacancies_male}/
                            {position.vacancies_female}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Total Vacancies:</span>{" "}
                          <span className="ml-2">
                            {position.vacancies_male +
                              position.vacancies_female}
                          </span>
                        </div>
                        {(position.hours_per_day_override ||
                          position.days_per_week_override ||
                          position.overtime_policy_override ||
                          position.weekly_off_days_override ||
                          position.food_override ||
                          position.accommodation_override ||
                          position.transport_override) && (
                          <div className="md:col-span-2">
                            <span className="font-medium">Overrides:</span>
                            <span className="ml-2">
                              {[
                                position.hours_per_day_override &&
                                  `Hours: ${position.hours_per_day_override}`,
                                position.days_per_week_override &&
                                  `Days: ${position.days_per_week_override}`,
                                position.overtime_policy_override &&
                                  `Overtime: ${position.overtime_policy_override}`,
                                position.weekly_off_days_override &&
                                  `Off Days: ${position.weekly_off_days_override}`,
                                position.food_override &&
                                  `Food: ${position.food_override}`,
                                position.accommodation_override &&
                                  `Accommodation: ${position.accommodation_override}`,
                                position.transport_override &&
                                  `Transport: ${position.transport_override}`,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </span>
                          </div>
                        )}
                        {position.position_notes && (
                          <div className="md:col-span-2">
                            <span className="font-medium">Notes:</span>{" "}
                            <span className="ml-2">
                              {position.position_notes}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags & Canonical Titles */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">
                    Tags & Canonical Titles
                  </h4>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                </div>
                <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                  <div>
                    <span className="font-medium">Skills:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {formData.skills.length > 0 ? (
                        formData.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">
                          No skills specified
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Education Requirements:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {formData.education_requirements.length > 0 ? (
                        formData.education_requirements.map((edu) => (
                          <span
                            key={edu}
                            className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs"
                          >
                            {edu}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">
                          No education requirements specified
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Experience:</span>
                    <span className="ml-2">
                      Min: {formData.experience_requirements.min_years} years
                      {formData.experience_requirements.preferred_years &&
                        `, Preferred: ${formData.experience_requirements.preferred_years} years`}
                    </span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {formData.experience_requirements.domains.length > 0 ? (
                        formData.experience_requirements.domains.map(
                          (domain) => (
                            <span
                              key={domain}
                              className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-xs"
                            >
                              {domain}
                            </span>
                          )
                        )
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">
                          No domains specified
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Canonical Titles:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {formData.canonical_title_names.length > 0 ? (
                        formData.canonical_title_names.map((title) => (
                          <span
                            key={title}
                            className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs"
                          >
                            {title}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500">
                          No canonical titles specified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expenses */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">
                    Expenses ({formData.expenses.length})
                  </h4>
                  <button
                    onClick={() => setCurrentStep(4)}
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.expenses.map((expense, index) => (
                    <div
                      key={expense.id}
                      className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <span className="font-medium">Type:</span>{" "}
                          <span className="ml-2">
                            {expenseTypes.find((t) => t.value === expense.type)
                              ?.label || expense.type}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Who Pays:</span>{" "}
                          <span className="ml-2">
                            {expensePayers.find(
                              (p) => p.value === expense.who_pays
                            )?.label || expense.who_pays}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Cost:</span>{" "}
                          <span className="ml-2">
                            {expense.is_free
                              ? "Free"
                              : `${expense.amount} ${expense.currency}`}
                          </span>
                        </div>
                        {expense.notes && (
                          <div className="md:col-span-3">
                            <span className="font-medium">Notes:</span>{" "}
                            <span className="ml-2">{expense.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {formData.expenses.length === 0 && (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      No expenses specified
                    </p>
                  )}
                </div>
              </div>

              {/* Cutout */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">
                    Job Advertisement Image <span className="text-red-500 dark:text-red-400">*</span>
                  </h4>
                  <button
                    onClick={() => setCurrentStep(5)}
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                </div>
                {formData.cutout.preview_url || formData.cutout.uploaded_url ? (
                  <div className="flex items-center space-x-4">
                    <img
                      src={
                        formData.cutout.preview_url ||
                        formData.cutout.uploaded_url
                      }
                      alt="Job Advertisement"
                      className="w-24 h-24 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                    />
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <div>
                        <span className="font-medium">Status:</span>{" "}
                        <span className="ml-2 text-green-600 dark:text-green-400">
                          {formData.cutout.is_uploaded
                            ? "✓ Uploaded"
                            : "✓ Ready to Upload"}
                        </span>
                      </div>
                      {formData.cutout.file && (
                        <div>
                          <span className="font-medium">File:</span>{" "}
                          <span className="ml-2">
                            {formData.cutout.file.name}
                          </span>
                        </div>
                      )}
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Required field completed
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
                    <p className="text-red-500 dark:text-red-400 text-sm font-medium">
                      Required: Job advertisement image must be uploaded
                    </p>
                  </div>
                )}
              </div>

              {/* Interview */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-gray-800">
                    Interview Process
                  </h4>
                  <button
                    onClick={() => setCurrentStep(6)}
                    className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                </div>
                {formData.interview.date_ad ||
                formData.interview.date_bs ||
                formData.interview.time ||
                formData.interview.location ||
                formData.interview.contact_person ||
                formData.interview.required_documents.length > 0 ||
                formData.interview.notes ||
                (formData.interview?.expenses &&
                  formData.interview.expenses.length > 0) ? (
                  <div className="space-y-3 text-sm">
                    {(formData.interview.date_ad ||
                      formData.interview.date_bs) && (
                      <div>
                        <span className="font-medium">Date:</span>{" "}
                        <span className="ml-2">
                          {formData.interview.date_format === "AD"
                            ? formData.interview.date_ad
                            : formData.interview.date_bs}
                          {` (${formData.interview.date_format})`}
                        </span>
                      </div>
                    )}
                    {formData.interview.time && (
                      <div>
                        <span className="font-medium">Time:</span>{" "}
                        <span className="ml-2">{formData.interview.time}</span>
                      </div>
                    )}
                    {formData.interview.location && (
                      <div>
                        <span className="font-medium">Location:</span>{" "}
                        <span className="ml-2">
                          {formData.interview.location}
                        </span>
                      </div>
                    )}
                    {formData.interview.contact_person && (
                      <div>
                        <span className="font-medium">Contact Person:</span>{" "}
                        <span className="ml-2">
                          {formData.interview.contact_person}
                        </span>
                      </div>
                    )}
                    {formData.interview.required_documents.length > 0 && (
                      <div>
                        <span className="font-medium">Required Documents:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {formData.interview.required_documents.map((doc) => (
                            <span
                              key={doc}
                              className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs"
                            >
                              {doc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {formData.interview.notes && (
                      <div>
                        <span className="font-medium">Notes:</span>{" "}
                        <span className="ml-2">{formData.interview.notes}</span>
                      </div>
                    )}
                    {formData.interview?.expenses &&
                      formData.interview.expenses.length > 0 && (
                        <div>
                          <span className="font-medium">
                            Interview Expenses (
                            {formData.interview.expenses.length}):
                          </span>
                          <div className="mt-2 space-y-2">
                            {formData.interview.expenses.map(
                              (expense, index) => (
                                <div
                                  key={expense.id}
                                  className="bg-gray-50 rounded p-2"
                                >
                                  <div className="text-xs">
                                    <span className="font-medium">
                                      {
                                        expenseTypes.find(
                                          (t) => t.value === expense.type
                                        )?.label
                                      }
                                    </span>
                                    <span className="ml-2">
                                      (
                                      {
                                        expensePayers.find(
                                          (p) => p.value === expense.who_pays
                                        )?.label
                                      }
                                      )
                                    </span>
                                    <span className="ml-2">
                                      {expense.is_free
                                        ? "Free"
                                        : `${expense.amount} ${expense.currency}`}
                                    </span>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">
                    No interview details specified
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    onSave({ type: "draft", data: formData });
                    // Could show success message here
                  }}
                  className="flex items-center px-6 py-3 bg-gray-600 dark:bg-gray-600 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-700 transition-colors"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save as Draft
                </button>

                {areAllStepsCompleted() ? (
                  <button
                    onClick={() => {
                      onSave({ type: "publish", data: formData });
                      onClose();
                    }}
                    className="flex items-center px-6 py-3 bg-green-600 dark:bg-green-600 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-700 transition-colors"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Publish Job Posting
                  </button>
                ) : (
                  <button
                    disabled
                    className="flex items-center px-6 py-3 bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-400 rounded-lg cursor-not-allowed"
                    title="Complete all 8 steps to publish"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Publish Job Posting (Complete All Steps)
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Expenses
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Attach cost-related details (e.g., medical, insurance, travel)
                to the posting.
              </p>
            </div>

            {errors.expenses_general && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                <p className="text-red-600 dark:text-red-400 text-sm">
                  {errors.expenses_general}
                </p>
              </div>
            )}

            {formData.expenses.map((expense, index) => (
              <div
                key={expense.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-6 bg-white dark:bg-gray-800"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">
                    Expense {index + 1}
                  </h4>
                  {formData.expenses.length > 1 && (
                    <button
                      onClick={() => removeExpense(expense.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm px-3 py-1 border border-red-300 dark:border-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      Remove Expense
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Expense Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Expense Type{" "}
                      <span className="text-red-500 dark:text-red-400">*</span>
                    </label>
                    <select
                      value={expense.type}
                      onChange={(e) =>
                        updateExpense(expense.id, "type", e.target.value)
                      }
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                        errors[`expenses_${expense.id}_type`]
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      <option value="">Select expense type</option>
                      {expenseTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    {errors[`expenses_${expense.id}_type`] && (
                      <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                        {errors[`expenses_${expense.id}_type`]}
                      </p>
                    )}
                  </div>

                  {/* Who Pays */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Who Pays{" "}
                      <span className="text-red-500 dark:text-red-400">*</span>
                    </label>
                    <select
                      value={expense.who_pays}
                      onChange={(e) =>
                        updateExpense(expense.id, "who_pays", e.target.value)
                      }
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                        errors[`expenses_${expense.id}_who_pays`]
                          ? "border-red-500 dark:border-red-400"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      <option value="">Select who pays</option>
                      {expensePayers.map((payer) => (
                        <option key={payer.value} value={payer.value}>
                          {payer.label}
                        </option>
                      ))}
                    </select>
                    {errors[`expenses_${expense.id}_who_pays`] && (
                      <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                        {errors[`expenses_${expense.id}_who_pays`]}
                      </p>
                    )}
                  </div>

                  {/* Is Free */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Is Free{" "}
                      <span className="text-red-500 dark:text-red-400">*</span>
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center text-gray-700 dark:text-gray-300">
                        <input
                          type="radio"
                          name={`is_free_${expense.id}`}
                          value="true"
                          checked={expense.is_free === true}
                          onChange={(e) =>
                            updateExpense(expense.id, "is_free", true)
                          }
                          className="mr-2 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                        />
                        Yes
                      </label>
                      <label className="flex items-center text-gray-700 dark:text-gray-300">
                        <input
                          type="radio"
                          name={`is_free_${expense.id}`}
                          value="false"
                          checked={expense.is_free === false}
                          onChange={(e) =>
                            updateExpense(expense.id, "is_free", false)
                          }
                          className="mr-2 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                        />
                        No
                      </label>
                    </div>
                  </div>

                  {/* Amount (shown only if not free) */}
                  {expense.is_free === false && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Amount{" "}
                          <span className="text-red-500 dark:text-red-400">
                            *
                          </span>
                        </label>
                        <input
                          type="number"
                          value={expense.amount}
                          onChange={(e) =>
                            updateExpense(
                              expense.id,
                              "amount",
                              e.target.value === "" ? "" : parseFloat(e.target.value) || ""
                            )
                          }
                          className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                            errors[`expenses_${expense.id}_amount`]
                              ? "border-red-500 dark:border-red-400"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                          placeholder="500"
                          min="0"
                          step="0.01"
                        />
                        {errors[`expenses_${expense.id}_amount`] && (
                          <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                            {errors[`expenses_${expense.id}_amount`]}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          e.g., 500
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Currency{" "}
                          <span className="text-red-500 dark:text-red-400">
                            *
                          </span>
                        </label>
                        <select
                          value={expense.currency}
                          onChange={(e) =>
                            updateExpense(
                              expense.id,
                              "currency",
                              e.target.value
                            )
                          }
                          className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                            errors[`expenses_${expense.id}_currency`]
                              ? "border-red-500 dark:border-red-400"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                        >
                          {currencies.map((curr) => (
                            <option key={curr.value} value={curr.value}>
                              {curr.label}
                            </option>
                          ))}
                        </select>
                        {errors[`expenses_${expense.id}_currency`] && (
                          <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                            {errors[`expenses_${expense.id}_currency`]}
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  {/* Notes */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={expense.notes}
                      onChange={(e) =>
                        updateExpense(expense.id, "notes", e.target.value)
                      }
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                      placeholder="e.g., Covers annual medical checkup"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Additional details about this expense
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Expense Button */}
            <div className="flex justify-center">
              <button
                onClick={addExpense}
                className="flex items-center px-6 py-3 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-800 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another Expense
              </button>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-yellow-800 dark:text-yellow-300">
                  <p className="font-medium mb-1">💰 Cost Management</p>
                  <p>
                    This step is optional. Add expenses only if they are
                    specific costs that candidates or the company needs to
                    cover.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Job Advertisement Image
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Upload and manage the job advertisement image (e.g., newspaper
                scan). <span className="text-red-500 dark:text-red-400 font-medium">This field is required.</span>
              </p>
            </div>

            <div className="space-y-6">
              {/* File Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload File{" "}
                  <span className="text-red-500 dark:text-red-400">*</span>
                  <HelpCircle
                    className="inline w-4 h-4 ml-1 text-gray-400 dark:text-gray-500 cursor-help"
                    title="Upload a job advertisement image like a newspaper scan or digital poster"
                  />
                </label>

                {/* File Input */}
                <div className="mt-2">
                  <div className="flex items-center justify-center w-full">
                    <label className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      errors.cutout_file 
                        ? "border-red-500 dark:border-red-400 hover:border-red-600 dark:hover:border-red-300" 
                        : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                    }`}>
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-semibold">Click to upload</span>{" "}
                          or drag and drop
                        </p>
                        <p className="text-xs text-red-500 dark:text-red-400 mb-1">
                          Required field
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          JPG, PNG (MAX. 10MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                </div>

                {errors.cutout_file && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.cutout_file}
                  </p>
                )}
                {errors.cutout_upload && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.cutout_upload}
                  </p>
                )}

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Supported formats: JPG, PNG. Maximum file size: 10MB
                </p>
              </div>

              {/* Preview Section */}
              {(formData.cutout.preview_url ||
                formData.cutout.uploaded_url) && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">
                      Image Preview
                    </h4>
                    <div className="flex space-x-2">
                      {formData.cutout.file && !formData.cutout.is_uploaded && (
                        <button
                          onClick={uploadCutout}
                          className="flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                        >
                          <Upload className="w-4 h-4 mr-1" />
                          Upload
                        </button>
                      )}

                      {/* Remove Option */}
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              "Are you sure you want to remove this image from the form?"
                            )
                          )
                            removeCutout();
                        }}
                        className="flex items-center px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                        title="Remove image from form"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Image Display */}
                  <div className="flex justify-center">
                    <div className="max-w-md w-full">
                      <img
                        src={
                          formData.cutout.preview_url ||
                          formData.cutout.uploaded_url
                        }
                        alt="Job Advertisement"
                        className="w-full h-auto rounded-lg shadow-lg border border-gray-300"
                        style={{ maxHeight: "400px", objectFit: "contain" }}
                      />
                    </div>
                  </div>

                  {/* File Info */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {formData.cutout.file && (
                        <>
                          <div>
                            <span className="font-medium text-gray-700">
                              File Name:
                            </span>
                            <span className="ml-2 text-gray-600">
                              {formData.cutout.file.name}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">
                              File Size:
                            </span>
                            <span className="ml-2 text-gray-600">
                              {(
                                formData.cutout.file.size /
                                1024 /
                                1024
                              ).toFixed(2)}{" "}
                              MB
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">
                              File Type:
                            </span>
                            <span className="ml-2 text-gray-600">
                              {formData.cutout.file.type}
                            </span>
                          </div>
                        </>
                      )}
                      <div>
                        <span className="font-medium text-gray-700">
                          Status:
                        </span>
                        <span
                          className={`ml-2 px-2 py-1 rounded-full text-xs ${
                            formData.cutout.is_uploaded
                              ? "bg-green-100 text-green-800"
                              : formData.cutout.file
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {formData.cutout.is_uploaded
                            ? "Uploaded"
                            : formData.cutout.file
                            ? "Ready to Upload"
                            : "No File"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 6 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Interview Process
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Provide details for the interview process.
                <span className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                  All fields in this section are optional.
                </span>
              </p>
            </div>

            <div className="space-y-8">
              {/* Interview Date and Time */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800">
                <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-4">
                  Date & Time
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Interview Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Interview Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <input
                        type="date"
                        value={formData.interview.date_ad}
                        onChange={(e) =>
                          updateInterviewField("date_ad", e.target.value)
                        }
                        className={`w-full pl-10 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                          errors.interview_date
                            ? "border-red-500"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      />
                    </div>
                    {errors.interview_date && (
                      <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                        {errors.interview_date}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      e.g., 2025-09-20
                    </p>
                  </div>

                  {/* Interview Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Interview Time
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <input
                        type="text"
                        value={formData.interview.time}
                        onChange={(e) =>
                          updateInterviewField("time", e.target.value)
                        }
                        className={`w-full pl-10 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                          errors.interview_time
                            ? "border-red-500"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                        placeholder="10:00 AM"
                      />
                    </div>
                    {errors.interview_time && (
                      <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                        {errors.interview_time}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      e.g., 10:00 AM or 14:30
                    </p>
                  </div>
                </div>
              </div>

              {/* Location and Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.interview.location}
                    onChange={(e) =>
                      updateInterviewField("location", e.target.value)
                    }
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="e.g., Agency Office, Dubai"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Interview venue or location
                  </p>
                </div>

                {/* Contact Person */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={formData.interview.contact_person}
                    onChange={(e) =>
                      updateInterviewField("contact_person", e.target.value)
                    }
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="e.g., John Doe"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Person to contact for interview
                  </p>
                </div>
              </div>

              {/* Required Documents */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Required Documents
                </label>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {formData.interview.required_documents.map(
                      (document, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300"
                        >
                          {document}
                          <button
                            onClick={() => removeInterviewDocument(document)}
                            className="ml-2 text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200"
                          >
                            ×
                          </button>
                        </span>
                      )
                    )}
                  </div>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        addInterviewDocument(e.target.value);
                        e.target.value = "";
                      }
                    }}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Select a document to add...</option>
                    {requiredDocuments
                      .filter(
                        (doc) =>
                          !formData.interview.required_documents.includes(doc)
                      )
                      .map((doc) => (
                        <option key={doc} value={doc}>
                          {doc}
                        </option>
                      ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    e.g., Passport, Resume, Certificates
                  </p>
                </div>
              </div>

              {/* Interview Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  rows={4}
                  value={formData.interview.notes}
                  onChange={(e) =>
                    updateInterviewField("notes", e.target.value)
                  }
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                  placeholder="e.g., Bring original documents for verification"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Additional instructions for candidates
                </p>
              </div>

              {/* Interview Expenses */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-gray-800">
                    Interview-Related Expenses
                  </h4>
                  <button
                    onClick={addInterviewExpense}
                    className="flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Expense
                  </button>
                </div>

                {!formData.interview.expenses ||
                formData.interview.expenses.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">
                    No interview expenses added yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {formData.interview.expenses.map((expense, index) => (
                      <div
                        key={expense.id}
                        className="border border-gray-100 rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700">
                            Interview Expense {index + 1}
                          </span>
                          <button
                            onClick={() => removeInterviewExpense(expense.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Expense Type */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Type
                            </label>
                            <select
                              value={expense.type}
                              onChange={(e) =>
                                updateInterviewExpense(
                                  expense.id,
                                  "type",
                                  e.target.value
                                )
                              }
                              className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="">Select type</option>
                              {expenseTypes.map((type) => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Who Pays */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Who Pays
                            </label>
                            <select
                              value={expense.who_pays}
                              onChange={(e) =>
                                updateInterviewExpense(
                                  expense.id,
                                  "who_pays",
                                  e.target.value
                                )
                              }
                              className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="">Select payer</option>
                              {expensePayers.map((payer) => (
                                <option key={payer.value} value={payer.value}>
                                  {payer.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Is Free */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Is Free
                            </label>
                            <div className="flex space-x-2">
                              <label className="flex items-center text-sm">
                                <input
                                  type="radio"
                                  name={`interview_expense_free_${expense.id}`}
                                  checked={expense.is_free === true}
                                  onChange={() =>
                                    updateInterviewExpense(
                                      expense.id,
                                      "is_free",
                                      true
                                    )
                                  }
                                  className="mr-1 text-blue-600"
                                />
                                Yes
                              </label>
                              <label className="flex items-center text-sm">
                                <input
                                  type="radio"
                                  name={`interview_expense_free_${expense.id}`}
                                  checked={expense.is_free === false}
                                  onChange={() =>
                                    updateInterviewExpense(
                                      expense.id,
                                      "is_free",
                                      false
                                    )
                                  }
                                  className="mr-1 text-blue-600"
                                />
                                No
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Amount and Currency (if not free) */}
                        {expense.is_free === false && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Amount
                              </label>
                              <input
                                type="number"
                                value={expense.amount}
                                onChange={(e) =>
                                  updateInterviewExpense(
                                    expense.id,
                                    "amount",
                                    e.target.value === "" ? "" : parseFloat(e.target.value) || ""
                                  )
                                }
                                className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="0"
                                min="0"
                                step="0.01"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Currency
                              </label>
                              <select
                                value={expense.currency}
                                onChange={(e) =>
                                  updateInterviewExpense(
                                    expense.id,
                                    "currency",
                                    e.target.value
                                  )
                                }
                                className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                {currencies.map((curr) => (
                                  <option key={curr.value} value={curr.value}>
                                    {curr.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Notes
                          </label>
                          <textarea
                            rows={2}
                            value={expense.notes}
                            onChange={(e) =>
                              updateInterviewExpense(
                                expense.id,
                                "notes",
                                e.target.value
                              )
                            }
                            className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                            placeholder="Expense details..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Insights Section */}
      {currentFlow === "single" && (
        <div className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <span className="text-purple-600 dark:text-purple-400 font-bold text-sm">
                  AI
                </span>
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-200 mb-2">
                {getAIInsights(currentStep).title}
              </h4>
              <ul className="text-xs text-purple-800 dark:text-purple-300 space-y-1">
                {getAIInsights(currentStep).tips.map((tip, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-purple-400 dark:text-purple-500 mr-2 mt-0.5">
                      •
                    </span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleBack}
          className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {currentStep === 0 ? "Back to Selection" : "Previous"}
        </button>

        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Step {currentStep + 1} of {singleDraftSteps.length}
          </div>

          {/* Validation Summary - Show remaining fields instead of errors */}
          {(() => {
            const currentStepErrors = validateStep(currentStep);
            const remainingFieldsCount = Object.keys(currentStepErrors).length;
            return (
              remainingFieldsCount > 0 && (
                <div className="flex items-center text-sm text-orange-600 dark:text-orange-400">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {remainingFieldsCount} field
                  {remainingFieldsCount > 1 ? "s" : ""} remaining to complete
                </div>
              )
            );
          })()}
        </div>

        <div className="flex items-center space-x-3">
          {/* Save and Exit Button - Available on all steps except final review */}
          {currentStep < singleDraftSteps.length - 1 && (
            <button
              onClick={handleSaveAndExit}
              className="flex items-center px-4 py-2 bg-blue-600 dark:bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              Save & Exit
            </button>
          )}

          {currentStep === singleDraftSteps.length - 1 ? (
            // Review & Publish step buttons
            <>
              <button
                onClick={() => {
                  console.log("Saving as draft:", formData);
                  onSave({ type: "single_draft", data: formData });
                  onClose();
                }}
                className="flex items-center px-4 py-2 bg-gray-600 dark:bg-gray-600 text-white rounded-md hover:bg-gray-700 dark:hover:bg-gray-700 transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                Save as Draft
              </button>
              {areAllStepsCompleted() ? (
                <button
                  onClick={handlePublish}
                  className="flex items-center px-6 py-2 bg-green-600 dark:bg-green-600 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-700 transition-colors"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Publish Job
                </button>
              ) : (
                <button
                  disabled
                  className="flex items-center px-6 py-2 bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-400 rounded-md cursor-not-allowed"
                  title="Complete all 8 steps to publish"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Publish Job (Complete All Steps)
                </button>
              )}
            </>
          ) : (
            // Regular next button
            <button
              onClick={handleContinue}
              className="flex items-center px-6 py-2 bg-blue-600 dark:bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-700 transition-colors"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-end z-50">
      <div className="bg-white dark:bg-gray-800 h-full w-full max-w-6xl overflow-y-auto animate-slide-in-right">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Job Creation
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Create and manage job postings
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          {currentFlow === "selection" && renderFlowSelection()}
          {currentFlow === "bulk" && renderBulkCreation()}
          {currentFlow === "single" && renderSingleDraftFlow()}
        </div>
      </div>
    </div>
  );
};

export default JobDraftWizard;

// CSS for slide-in animation (add to your global CSS)
/* 
.animate-slide-in-right {
  animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}
*/
