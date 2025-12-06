import httpClient from '../config/httpClient.js'

/**
 * Application Notes Data Source
 * Handles all API calls related to application notes management
 */
class ApplicationNotesDataSource {
  /**
   * Get all notes for an application
   * @param {string} applicationId - Application ID
   * @returns {Promise<Array>} List of notes
   */
  async getNotesByApplication(applicationId) {
    const response = await httpClient.get(`/application-notes/application/${applicationId}`)
    return response.data || []
  }

  /**
   * Create a new note
   * @param {string} applicationId - Application ID
   * @param {string} noteText - Note content
   * @param {boolean} isPrivate - Whether note is private (default: true)
   * @returns {Promise<Object>} Created note
   */
  async createNote(applicationId, noteText, isPrivate = true) {
    const response = await httpClient.post('/application-notes', {
      job_application_id: applicationId,
      note_text: noteText,
      is_private: isPrivate
    })
    return response.data
  }

  /**
   * Update a note
   * @param {string} noteId - Note ID
   * @param {string} noteText - Updated note content
   * @param {boolean} isPrivate - Whether note is private
   * @returns {Promise<Object>} Updated note
   */
  async updateNote(noteId, noteText, isPrivate) {
    const payload = {}
    if (noteText !== undefined) payload.note_text = noteText
    if (isPrivate !== undefined) payload.is_private = isPrivate

    const response = await httpClient.patch(`/application-notes/${noteId}`, payload)
    return response.data
  }

  /**
   * Delete a note
   * @param {string} noteId - Note ID
   * @returns {Promise<Object>} Success response
   */
  async deleteNote(noteId) {
    const response = await httpClient.delete(`/application-notes/${noteId}`)
    return response
  }
}

export default new ApplicationNotesDataSource()
