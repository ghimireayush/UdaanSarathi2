import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import JobDraftWizard from "../components/JobDraftWizard";
import { jobService } from "../services/index.js";

// Helper function to format draft data for API
const formatDraftData = (data) => {
  // If data is already formatted (has administrative_details), return as is
  if (data.administrative_details) {
    return data;
  }

  // Otherwise, format the raw form data
  return {
    // Basic info - ensure preview fields are populated
    title: data.posting_title || data.title || "",
    company: data.employer || data.company || "",
    country: data.country || "",
    city: data.city || "",
    description: data.notes || data.description || "",

    // Administrative details
    lt_number: data.lt_number || "",
    chalani_number: data.chalani_number || "",
    approval_date_ad: data.approval_date_ad || "",
    approval_date_bs: data.approval_date_bs || "",
    posting_date_ad: data.posting_date_ad || "",
    posting_date_bs: data.posting_date_bs || "",
    date_format: data.date_format || "AD",
    announcement_type: data.announcement_type || "",
    notes: data.notes || "",

    // Contract details
    period_years: data.period_years || 2,
    renewable: data.renewable === "yes",
    hours_per_day: data.hours_per_day || 8,
    days_per_week: data.days_per_week || 6,
    overtime_policy: data.overtime_policy || "as_per_company_policy",
    weekly_off_days: data.weekly_off_days || 1,
    food: data.food || "not_provided",
    accommodation: data.accommodation || "not_provided",
    transport: data.transport || "not_provided",
    annual_leave_days: data.annual_leave_days || 21,
    visa_status: data.visa_status || "Company will provide",
    contract_duration: data.period_years
      ? `${data.period_years} years`
      : "2 years",
    employment_type: data.employment_type || "Full-time",
    working_hours: data.hours_per_day
      ? `${data.hours_per_day} hours/day`
      : "8 hours/day",

    // Positions - map to preview-compatible format
    positions:
      data.positions?.map((pos) => ({
        // Preview expects these field names
        position_title: pos.position_title || pos.title || "",
        title: pos.position_title || pos.title || "",
        vacancies_male: pos.vacancies_male || 0,
        vacancies_female: pos.vacancies_female || 0,
        monthly_salary: pos.monthly_salary || 0,
        salary_amount: pos.monthly_salary || 0,
        currency: pos.currency || "AED",
        job_description: pos.position_notes || pos.job_description || "",
        // Contract overrides
        hours_per_day_override: pos.hours_per_day_override || null,
        days_per_week_override: pos.days_per_week_override || null,
        overtime_policy_override: pos.overtime_policy_override || null,
        weekly_off_days_override: pos.weekly_off_days_override || null,
        food_override: pos.food_override || null,
        accommodation_override: pos.accommodation_override || null,
        transport_override: pos.transport_override || null,
        position_notes: pos.position_notes || "",
      })) || [],

    // Tags and requirements - ensure both formats
    skills: data.skills || [],
    tags: data.skills || data.tags || [],
    requirements: data.education_requirements || data.requirements || [],
    education_requirements: data.education_requirements || [],
    experience_requirements: data.experience_requirements || {
      min_years: 0,
      preferred_years: "",
      domains: [],
    },
    canonical_title_ids: data.canonical_title_ids || [],
    canonical_title_names: data.canonical_title_names || [],
    category: data.category || "General",

    // Expenses - map to preview-compatible format
    expenses:
      data.expenses
        ?.filter((exp) => exp.type && exp.who_pays)
        .map((exp) => ({
          type: exp.type,
          description: exp.type, // Preview looks for description
          who_pays: exp.who_pays,
          is_free: exp.is_free,
          amount: exp.is_free ? null : exp.amount,
          currency: exp.is_free ? null : exp.currency,
          notes: exp.notes || "",
        })) || [],

    // Cutout - ensure preview fields
    cutout: data.cutout
      ? {
          file: data.cutout.file || null,
          file_name: data.cutout.file?.name || data.cutout.file_name || null,
          file_url:
            data.cutout.uploaded_url ||
            data.cutout.preview_url ||
            data.cutout.file_url ||
            null,
          file_size: data.cutout.file?.size || data.cutout.file_size || null,
          file_type: data.cutout.file?.type || data.cutout.file_type || null,
          has_file: Boolean(
            data.cutout.file ||
              data.cutout.uploaded_url ||
              data.cutout.preview_url
          ),
          is_uploaded: data.cutout.is_uploaded || false,
          preview_url:
            data.cutout.preview_url || data.cutout.uploaded_url || null,
          uploaded_url: data.cutout.uploaded_url || null,
        }
      : null,

    // Interview - ensure all fields
    interview: data.interview
      ? {
          date_ad: data.interview.date_ad || "",
          date_bs: data.interview.date_bs || "",
          date_format: data.interview.date_format || "AD",
          time: data.interview.time || "",
          location: data.interview.location || "",
          contact_person: data.interview.contact_person || "",
          required_documents: data.interview.required_documents || [],
          notes: data.interview.notes || "",
          expenses: data.interview.expenses || [],
        }
      : null,

    // Metadata
    status: data.status || "draft",
    is_partial: data.is_partial || false,
    last_completed_step: data.last_completed_step || 0,
    created_at: data.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

const DraftWizard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [editingDraft, setEditingDraft] = useState(null);
  const [initialStep, setInitialStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Get draft ID and step from URL params or location state
  const draftId = searchParams.get("id");
  const stepParam = searchParams.get("step");
  const stateData = location.state;

  useEffect(() => {
    const loadDraft = async () => {
      try {
        setIsLoading(true);

        // Check if draft data is passed via location state
        if (stateData?.draft) {
          setEditingDraft(stateData.draft);
          setInitialStep(stateData.step || 0);
        }
        // Otherwise, fetch draft by ID if provided
        else if (draftId) {
          const draft = await jobService.getJobById(draftId);
          setEditingDraft(draft);
          setInitialStep(stepParam ? parseInt(stepParam) : 0);
        }
        // No draft - creating new
        else {
          setEditingDraft(null);
          setInitialStep(0);
        }
      } catch (error) {
        console.error("Failed to load draft:", error);
        // Redirect back to drafts page on error
        navigate("/drafts");
      } finally {
        setIsLoading(false);
      }
    };

    loadDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId, stepParam]);

  const handleSave = async (draftData) => {
    try {
      if (draftData.type === "bulk") {
        // Handle bulk draft creation
        const totalJobs = draftData.data.entries.reduce(
          (sum, entry) => sum + parseInt(entry.job_count || 0),
          0
        );
        const countries = draftData.data.entries
          .map((entry) => entry.country)
          .filter(Boolean);
        const positions = draftData.data.entries
          .map((entry) => entry.position)
          .filter(Boolean);

        const bulkDraft = {
          title:
            positions.length > 0 ? positions.join(", ") : "Multiple Positions",
          company: "Multiple Companies",
          country: countries.length === 1 ? countries[0] : "Multiple Countries",
          city: "",
          published_at: null,
          salary: "",
          currency: "AED",
          salary_amount: 0,
          requirements: [],
          description: `Bulk job creation for ${totalJobs} positions across ${countries.length} countries`,
          tags: [],
          category: "Bulk Creation",
          employment_type: "Full-time",
          working_hours: "8 hours/day",
          accommodation: "Provided",
          food: "Provided",
          visa_status: "Company will provide",
          contract_duration: "2 years",
          contact_person: "",
          contact_phone: "",
          contact_email: "",
          expenses: [],
          notes: `Bulk draft containing ${totalJobs} jobs`,
          created_at: new Date().toISOString(),
          is_bulk_draft: true,
          bulk_entries: draftData.data.entries,
          total_jobs: totalJobs,
        };

        await jobService.createDraftJob(bulkDraft);

        // Navigate back to drafts with success message
        navigate("/drafts", {
          state: {
            message: `Successfully created ${totalJobs} job drafts`,
            type: "success",
          },
        });
      } else if (draftData.type === "bulk_edit") {
        // Handle bulk draft editing
        const totalJobs = draftData.data.entries.reduce(
          (sum, entry) => sum + parseInt(entry.job_count || 0),
          0
        );
        const countries = draftData.data.entries
          .map((entry) => entry.country)
          .filter(Boolean);
        const positions = draftData.data.entries
          .map((entry) => entry.position)
          .filter(Boolean);

        const updatedBulkDraft = {
          title:
            draftData.data.title ||
            (positions.length > 0
              ? positions.join(", ")
              : "Multiple Positions"),
          company: draftData.data.company || "Multiple Companies",
          country: countries.length === 1 ? countries[0] : "Multiple Countries",
          description:
            draftData.data.description ||
            `Bulk job creation for ${totalJobs} positions across ${countries.length} countries`,
          bulk_entries: draftData.data.entries,
          total_jobs: totalJobs,
          updated_at: new Date().toISOString(),
        };

        await jobService.updateJob(draftData.data.id, updatedBulkDraft);

        navigate("/drafts", {
          state: {
            message: `Successfully updated bulk draft with ${totalJobs} jobs`,
            type: "success",
          },
        });
      } else if (draftData.type === "partial_draft") {
        // Handle partial draft save (Save & Exit)
        const formattedData = formatDraftData(draftData.data);

        if (editingDraft) {
          const updatedDraft = {
            ...formattedData,
            id: editingDraft.id,
            is_partial: true,
            last_completed_step: draftData.data.last_completed_step,
            updated_at: new Date().toISOString(),
          };
          await jobService.updateJob(editingDraft.id, updatedDraft);
        } else {
          const partialDraft = {
            ...formattedData,
            is_partial: true,
            last_completed_step: draftData.data.last_completed_step,
            created_at: new Date().toISOString(),
          };
          await jobService.createDraftJob(partialDraft);
        }

        navigate("/drafts", {
          state: {
            message: "Progress saved successfully",
            type: "success",
            refetch: true,
          },
        });
      } else if (draftData.type === "single_draft") {
        // Handle single draft save
        const formattedData = formatDraftData(draftData.data);

        if (editingDraft) {
          await jobService.updateJob(editingDraft.id, formattedData);
          navigate("/drafts", {
            state: {
              message: "Draft updated successfully",
              type: "success",
              refetch: true,
            },
          });
        } else {
          await jobService.createDraftJob(formattedData);
          navigate("/drafts", {
            state: {
              message: "Draft created successfully",
              type: "success",
              refetch: true,
            },
          });
        }
      } else if (draftData.type === "single_publish") {
        // Handle publish
        const formattedData = formatDraftData(draftData.data);

        if (editingDraft) {
          await jobService.updateJob(editingDraft.id, formattedData);
          await jobService.publishJob(editingDraft.id);
        } else {
          const created = await jobService.createDraftJob(formattedData);
          await jobService.publishJob(created.id);
        }

        navigate("/jobs", {
          state: {
            message: "Job published successfully",
            type: "success",
          },
        });
      } else {
        // Default save behavior
        const formattedData = formatDraftData(draftData);

        if (editingDraft) {
          await jobService.updateJob(editingDraft.id, formattedData);
        } else {
          await jobService.createDraftJob(formattedData);
        }

        navigate("/drafts", {
          state: {
            message: editingDraft
              ? "Draft updated successfully"
              : "Draft created successfully",
            type: "success",
            refetch: true,
          },
        });
      }
    } catch (error) {
      console.error("Failed to save draft:", error);
      // Show error but stay on page
      alert("Failed to save draft. Please try again.");
    }
  };

  const handleClose = () => {
    // Navigate back to drafts page
    navigate("/drafts");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading draft...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Full-page wizard */}
      <JobDraftWizard
        isOpen={true}
        onClose={handleClose}
        onSave={handleSave}
        editingDraft={editingDraft}
        initialStep={initialStep}
      />
    </div>
  );
};

export default DraftWizard;
