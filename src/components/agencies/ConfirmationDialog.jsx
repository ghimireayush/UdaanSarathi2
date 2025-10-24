const ConfirmationDialog = ({
  type,
  data,
  confirmText,
  setConfirmText,
  onConfirm,
  onCancel,
  tPage,
  deleteReason,
  setDeleteReason,
}) => {
  const canConfirm = () => {
    if (type === "delete") {
      return confirmText === data?.name;
    }
    if (type === "bulkDelete") {
      // Require both reason and confirmation text "DELETE ALL"
      const hasReason = deleteReason && deleteReason.trim().length > 0;
      const hasConfirmation = confirmText === "DELETE ALL";
      return hasReason && hasConfirmation;
    }
    return true;
  };

  const getButtonColor = () => {
    if (type === "delete" || type === "bulkDelete") {
      return canConfirm()
        ? "bg-red-600 hover:bg-red-700"
        : "bg-gray-400 cursor-not-allowed";
    }
    return canConfirm()
      ? "bg-blue-600 hover:bg-blue-700"
      : "bg-gray-400 cursor-not-allowed";
  };

  const getTitle = () => {
    switch (type) {
      case "delete":
        return tPage("confirmDialog.delete.title") || "Delete Agency";
      case "bulkDelete":
        return tPage("confirmDialog.bulkDelete.title") || "Delete Multiple Agencies";
      case "statusChange":
        return tPage("confirmDialog.statusChange.title") || "Change Status";
      case "singleStatusChange":
        return tPage("confirmDialog.singleStatusChange.title") || "Change Agency Status";
      default:
        return "Confirm Action";
    }
  };

  const getMessage = () => {
    switch (type) {
      case "delete":
        return tPage("confirmDialog.delete.message") || "Are you sure you want to delete this agency?";
      case "bulkDelete":
        return tPage("confirmDialog.bulkDelete.message", { count: data?.ids?.length || 0 }) || 
               `Are you sure you want to delete ${data?.ids?.length || 0} agencies?`;
      case "statusChange":
        return tPage("confirmDialog.statusChange.message", {
          count: data?.ids?.length || 0,
          status: tPage(`status.${data?.status}`) || data?.status,
        }) || `Change status for ${data?.ids?.length || 0} agencies?`;
      case "singleStatusChange":
        return tPage("confirmDialog.singleStatusChange.message", {
          agencyName: data?.agencyName || "this agency",
          status: tPage(`status.${data?.newStatus}`) || data?.newStatus,
        }) || `Change status of ${data?.agencyName || "this agency"}?`;
      default:
        return "Are you sure you want to proceed?";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" onClick={onCancel} />
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
          {getTitle()}
        </h3>

        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {getMessage()}
        </p>

        {type === "delete" && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {tPage("confirmDialog.delete.typeToConfirm") || "Type the agency name to confirm:"}
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={tPage("confirmDialog.delete.placeholder") || "Agency name"}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Type: <span className="font-mono font-semibold">{data?.name}</span>
            </p>
          </div>
        )}

        {type === "bulkDelete" && (
          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {tPage("confirmDialog.bulkDelete.reasonLabel") || "Reason for deletion:"} <span className="text-red-600">*</span>
              </label>
              <textarea
                value={deleteReason || ""}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder={tPage("confirmDialog.bulkDelete.reasonPlaceholder") || "Please provide a reason for deleting multiple agencies..."}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {tPage("confirmDialog.bulkDelete.reasonHint") || "This action will be logged for audit purposes."}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {tPage("confirmDialog.bulkDelete.typeToConfirm") || "Type DELETE ALL to confirm:"} <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={tPage("confirmDialog.bulkDelete.confirmPlaceholder") || "DELETE ALL"}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {tPage("confirmDialog.bulkDelete.confirmHint") || "Type:"} <span className="font-mono font-semibold">DELETE ALL</span>
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            {type === "delete"
              ? tPage("confirmDialog.delete.cancel") || "Cancel"
              : type === "singleStatusChange"
              ? tPage("confirmDialog.singleStatusChange.cancel") || "Cancel"
              : tPage("confirmDialog.bulkDelete.cancel") || "Cancel"}
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm()}
            className={`px-4 py-2 rounded-lg text-white ${getButtonColor()}`}
          >
            {type === "delete" && (tPage("confirmDialog.delete.confirm") || "Delete")}
            {type === "bulkDelete" && (tPage("confirmDialog.bulkDelete.confirm") || "Delete All")}
            {type === "statusChange" && (tPage("confirmDialog.statusChange.confirm") || "Confirm")}
            {type === "singleStatusChange" && (tPage("confirmDialog.singleStatusChange.confirm") || "Confirm")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
