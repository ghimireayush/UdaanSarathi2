import { useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";

/**
 * DraftWizard - Legacy redirect component
 * 
 * This component redirects to the new Job Management system.
 * The old wizard-based draft creation has been replaced with
 * the template-based Job Management approach.
 */
const DraftWizard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  useEffect(() => {
    // Get draft ID from URL params or location state
    const draftId = searchParams.get("id");
    const stateData = location.state;

    if (draftId) {
      // Redirect to edit page for existing draft
      navigate(`/job-management/${draftId}/edit`, { replace: true });
    } else if (stateData?.draft?.id) {
      // Redirect to edit page if draft passed via state
      navigate(`/job-management/${stateData.draft.id}/edit`, { replace: true });
    } else {
      // Redirect to job management for new job creation
      navigate("/job-management", { replace: true });
    }
  }, [navigate, searchParams, location.state]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Redirecting to Job Management...</p>
      </div>
    </div>
  );
};

export default DraftWizard;
