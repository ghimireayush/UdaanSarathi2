import api from '../api/axiosConfig'

const applicationNotesService = {
  /**
   * Create a new application note
   * @param {string} applicationId - Job application ID
   * @param {string} noteText - Note content
   * @param {boolean} isPrivate - Whether note is private (default: true)
   * @returns {Promise<Object>} Created note
   */
  async createNote(applicationId, noteText, isPrivate = true) {
    try {
      const response = await api.post('/application-notes', {
        job_application_id: applicationId,
        note_text: noteText,
        is_private: isPrivate,
      })
      return response.data
    } catch (error) {
      console.error('Error creating note:', error)
      throw error
    }
  },

  /**
   * Get all notes for an application
   * @param {string} applicationId - Job application ID
   * @returns {Promise<Array>} List of notes
   */
  async getNotesByApplication(applicationId) {
    try {
      const response = await api.get(`/application-notes/application/${applicationId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching notes:', error)
      throw error
    }
  },

  /**
   * Update an existing note
   * @param {string} noteId - Note ID
   * @param {Object} updates - Fields to update (note_text, is_private)
   * @returns {Promise<Object>} Updated note
   */
  async updateNote(noteId, updates) {
    try {
      const response = await api.put(`/application-notes/${noteId}`, updates)
      return response.data
    } catch (error) {
      console.error('Error updating note:', error)
      throw error
    }
  },

  /**
   * Delete a note
   * @param {string} noteId - Note ID
   * @returns {Promise<Object>} Success response
   */
  async deleteNote(noteId) {
    try {
      const response = await api.delete(`/application-notes/${noteId}`)
      return response.data
    } catch (error) {
      console.error('Error deleting note:', error)
      throw error
    }
  },
}

export default applicationNotesService
