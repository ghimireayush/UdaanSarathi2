// Draft Job Data Mapper - Transform between frontend and backend formats

/**
 * Map frontend draft data to backend format
 */
export const mapFrontendToBackend = (frontendDraft) => {
  return {
    // Basic info
    posting_title: frontendDraft.title || frontendDraft.posting_title,
    country: frontendDraft.country,
    city: frontendDraft.city,
    
    // Administrative details
    lt_number: frontendDraft.lt_number,
    chalani_number: frontendDraft.chalani_number,
    approval_date_ad: frontendDraft.approval_date_ad,
    approval_date_bs: frontendDraft.approval_date_bs,
    posting_date_ad: frontendDraft.posting_date_ad,
    posting_date_bs: frontendDraft.posting_date_bs,
    announcement_type: frontendDraft.announcement_type,
    notes: frontendDraft.notes || frontendDraft.description,
    
    // Employer
    employer: {
      company_name: frontendDraft.company || frontendDraft.employer?.company_name || frontendDraft.employer,
      country: frontendDraft.employer?.country || frontendDraft.country,
      city: frontendDraft.employer?.city || frontendDraft.city,
    },
    
    // Contract
    contract: frontendDraft.contract ? {
      period_years: frontendDraft.contract.period_years || frontendDraft.period_years,
      renewable: frontendDraft.contract.renewable !== undefined 
        ? frontendDraft.contract.renewable 
        : frontendDraft.renewable === 'yes' || frontendDraft.renewable === true,
      hours_per_day: frontendDraft.contract.hours_per_day || frontendDraft.hours_per_day,
      days_per_week: frontendDraft.contract.days_per_week || frontendDraft.days_per_week,
      overtime_policy: frontendDraft.contract.overtime_policy || frontendDraft.overtime_policy,
      weekly_off_days: frontendDraft.contract.weekly_off_days || frontendDraft.weekly_off_days,
      food: frontendDraft.contract.food || frontendDraft.food,
      accommodation: frontendDraft.contract.accommodation || frontendDraft.accommodation,
      transport: frontendDraft.contract.transport || frontendDraft.transport,
      annual_leave_days: frontendDraft.contract.annual_leave_days || frontendDraft.annual_leave_days,
    } : null,
    
    // Positions - map frontend field names to backend
    positions: frontendDraft.positions?.map(pos => ({
      title: pos.position_title || pos.title,
      vacancies: {
        male: pos.vacancies_male || pos.vacancies?.male || 0,
        female: pos.vacancies_female || pos.vacancies?.female || 0,
      },
      salary: {
        monthly_amount: pos.monthly_salary || pos.salary_amount || pos.salary?.monthly_amount,
        currency: pos.currency || pos.salary?.currency || 'AED',
      },
      hours_per_day_override: pos.hours_per_day_override,
      days_per_week_override: pos.days_per_week_override,
      overtime_policy_override: pos.overtime_policy_override,
      weekly_off_days_override: pos.weekly_off_days_override,
      food_override: pos.food_override,
      accommodation_override: pos.accommodation_override,
      transport_override: pos.transport_override,
      position_notes: pos.position_notes || pos.job_description,
    })) || [],
    
    // Tags and requirements
    skills: frontendDraft.skills || frontendDraft.tags || [],
    education_requirements: frontendDraft.education_requirements || frontendDraft.requirements || [],
    experience_requirements: frontendDraft.experience_requirements,
    canonical_title_names: frontendDraft.canonical_title_names,
    
    // Expenses
    expenses: frontendDraft.expenses,
    
    // Cutout
    cutout: frontendDraft.cutout,
    
    // Interview
    interview: frontendDraft.interview,
    
    // Progress tracking
    is_partial: frontendDraft.is_partial || false,
    last_completed_step: frontendDraft.last_completed_step || 0,
    is_complete: frontendDraft.is_complete || frontendDraft.ready_to_publish || false,
    ready_to_publish: frontendDraft.ready_to_publish || false,
    reviewed: frontendDraft.reviewed || false,
    
    // Bulk draft support
    is_bulk_draft: frontendDraft.is_bulk_draft || false,
    bulk_entries: frontendDraft.bulk_entries,
    total_jobs: frontendDraft.total_jobs,
  };
};

/**
 * Map backend draft data to frontend format
 */
export const mapBackendToFrontend = (backendDraft) => {
  return {
    id: backendDraft.id,
    
    // Basic info - map to frontend field names
    title: backendDraft.posting_title,
    posting_title: backendDraft.posting_title,
    company: backendDraft.employer?.company_name,
    employer: backendDraft.employer?.company_name,
    country: backendDraft.country,
    city: backendDraft.city,
    description: backendDraft.notes,
    notes: backendDraft.notes,
    
    // Administrative details
    lt_number: backendDraft.lt_number,
    chalani_number: backendDraft.chalani_number,
    approval_date_ad: backendDraft.approval_date_ad,
    approval_date_bs: backendDraft.approval_date_bs,
    posting_date_ad: backendDraft.posting_date_ad,
    posting_date_bs: backendDraft.posting_date_bs,
    announcement_type: backendDraft.announcement_type,
    
    // Contract
    period_years: backendDraft.contract?.period_years,
    renewable: backendDraft.contract?.renewable ? 'yes' : 'no',
    hours_per_day: backendDraft.contract?.hours_per_day,
    days_per_week: backendDraft.contract?.days_per_week,
    overtime_policy: backendDraft.contract?.overtime_policy,
    weekly_off_days: backendDraft.contract?.weekly_off_days,
    food: backendDraft.contract?.food,
    accommodation: backendDraft.contract?.accommodation,
    transport: backendDraft.contract?.transport,
    annual_leave_days: backendDraft.contract?.annual_leave_days,
    contract: backendDraft.contract,
    
    // Positions - map to frontend field names
    positions: backendDraft.positions?.map(pos => ({
      position_title: pos.title,
      title: pos.title,
      vacancies_male: pos.vacancies?.male || 0,
      vacancies_female: pos.vacancies?.female || 0,
      vacancies: pos.vacancies,
      monthly_salary: pos.salary?.monthly_amount,
      salary_amount: pos.salary?.monthly_amount,
      currency: pos.salary?.currency,
      salary: pos.salary,
      job_description: pos.position_notes,
      position_notes: pos.position_notes,
      hours_per_day_override: pos.hours_per_day_override,
      days_per_week_override: pos.days_per_week_override,
      overtime_policy_override: pos.overtime_policy_override,
      weekly_off_days_override: pos.weekly_off_days_override,
      food_override: pos.food_override,
      accommodation_override: pos.accommodation_override,
      transport_override: pos.transport_override,
    })) || [],
    
    // Tags and requirements
    skills: backendDraft.skills || [],
    tags: backendDraft.skills || [],
    education_requirements: backendDraft.education_requirements || [],
    requirements: backendDraft.education_requirements || [],
    experience_requirements: backendDraft.experience_requirements,
    canonical_title_names: backendDraft.canonical_title_names,
    
    // Expenses
    expenses: backendDraft.expenses || [],
    
    // Cutout
    cutout: backendDraft.cutout,
    
    // Interview
    interview: backendDraft.interview,
    
    // Progress tracking
    is_partial: backendDraft.is_partial,
    last_completed_step: backendDraft.last_completed_step,
    is_complete: backendDraft.is_complete,
    ready_to_publish: backendDraft.ready_to_publish,
    reviewed: backendDraft.reviewed,
    
    // Bulk draft support
    is_bulk_draft: backendDraft.is_bulk_draft,
    bulk_entries: backendDraft.bulk_entries,
    total_jobs: backendDraft.total_jobs,
    
    // Status
    status: backendDraft.status,
    
    // Timestamps
    created_at: backendDraft.created_at,
    updated_at: backendDraft.updated_at,
    published_at: backendDraft.published_at,
  };
};

/**
 * Map array of backend drafts to frontend format
 */
export const mapBackendArrayToFrontend = (backendDrafts) => {
  return backendDrafts.map(mapBackendToFrontend);
};
