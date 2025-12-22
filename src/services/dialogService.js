/**
 * Dialog Service
 * 
 * Centralized service for all dialog interactions (alerts, confirms, prompts)
 * Replaces browser default dialogs with custom localized dialogs
 * 
 * Usage:
 * - Alert: dialogService.alert(title, message, options)
 * - Confirm: dialogService.confirm(title, message, options)
 * - Prompt: dialogService.prompt(title, message, options)
 */

class DialogService {
  constructor() {
    this.listeners = []
  }

  /**
   * Subscribe to dialog events
   * @param {Function} callback - Called when dialog needs to be shown
   */
  subscribe(callback) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback)
    }
  }

  /**
   * Emit dialog event to all listeners
   * @private
   */
  emit(dialog) {
    return new Promise((resolve) => {
      const dialogWithResolve = {
        ...dialog,
        resolve
      }
      this.listeners.forEach(listener => listener(dialogWithResolve))
    })
  }

  /**
   * Show an alert dialog
   * @param {string} title - Dialog title
   * @param {string} message - Dialog message
   * @param {Object} options - Additional options
   * @param {string} options.type - 'info', 'warning', 'error', 'success' (default: 'info')
   * @param {string} options.confirmText - Button text (default: 'OK')
   * @returns {Promise<void>}
   */
  async alert(title, message, options = {}) {
    const {
      type = 'info',
      confirmText = 'OK'
    } = options

    return this.emit({
      type: 'alert',
      title,
      message,
      dialogType: type,
      confirmText
    })
  }

  /**
   * Show a confirmation dialog
   * @param {string} title - Dialog title
   * @param {string} message - Dialog message
   * @param {Object} options - Additional options
   * @param {string} options.type - 'warning', 'danger', 'info' (default: 'warning')
   * @param {string} options.confirmText - Confirm button text (default: 'Confirm')
   * @param {string} options.cancelText - Cancel button text (default: 'Cancel')
   * @returns {Promise<boolean>} - true if confirmed, false if cancelled
   */
  async confirm(title, message, options = {}) {
    const {
      type = 'warning',
      confirmText = 'पुष्टि गर्नुहोस्',
      cancelText = 'रद्द गर्नुहोस्'
    } = options

    return this.emit({
      type: 'confirm',
      title,
      message,
      dialogType: type,
      confirmText,
      cancelText
    })
  }

  /**
   * Show a prompt dialog
   * @param {string} title - Dialog title
   * @param {string} message - Dialog message
   * @param {Object} options - Additional options
   * @param {string} options.defaultValue - Default input value
   * @param {string} options.placeholder - Input placeholder
   * @param {string} options.confirmText - Confirm button text (default: 'OK')
   * @param {string} options.cancelText - Cancel button text (default: 'Cancel')
   * @returns {Promise<string|null>} - User input or null if cancelled
   */
  async prompt(title, message, options = {}) {
    const {
      defaultValue = '',
      placeholder = '',
      confirmText = 'OK',
      cancelText = 'Cancel'
    } = options

    return this.emit({
      type: 'prompt',
      title,
      message,
      defaultValue,
      placeholder,
      confirmText,
      cancelText
    })
  }
}

// Export singleton instance
export default new DialogService()
