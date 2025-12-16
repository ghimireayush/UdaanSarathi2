import { useState, useEffect } from 'react'
import { 
  MessageSquare, 
  Plus, 
  Edit2, 
  Trash2, 
  Lock, 
  Unlock,
  Save,
  X,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import ApplicationNotesDataSource from '../api/datasources/ApplicationNotesDataSource'
import { useConfirm } from './ConfirmProvider'
import { useLanguage } from '../hooks/useLanguage'

const ApplicationNotes = ({ applicationId }) => {
  const { tPageSync } = useLanguage({ pageName: 'application-notes', autoLoad: true })
  const t = (key, params = {}) => tPageSync(key, params)
  const [notes, setNotes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState(null)
  
  // Form state
  const [newNoteText, setNewNoteText] = useState('')
  const [newNoteIsPrivate, setNewNoteIsPrivate] = useState(true)
  const [editNoteText, setEditNoteText] = useState('')
  const [editNoteIsPrivate, setEditNoteIsPrivate] = useState(true)
  
  const { confirm } = useConfirm()

  // Load notes
  useEffect(() => {
    if (applicationId) {
      loadNotes()
    }
  }, [applicationId])

  const loadNotes = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await ApplicationNotesDataSource.getNotesByApplication(applicationId)
      setNotes(data)
    } catch (err) {
      console.error('Failed to load notes:', err)
      setError(err.message || 'Failed to load notes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddNote = async () => {
    if (!newNoteText.trim()) {
      await confirm({
        title: 'Empty Note',
        message: 'Please enter some text for the note.',
        confirmText: 'OK',
        type: 'warning'
      })
      return
    }

    try {
      await ApplicationNotesDataSource.createNote(
        applicationId,
        newNoteText.trim(),
        newNoteIsPrivate
      )
      
      // Reset form
      setNewNoteText('')
      setNewNoteIsPrivate(true)
      setIsAddingNote(false)
      
      // Reload notes
      await loadNotes()
      
      await confirm({
        title: 'Success',
        message: 'Note added successfully!',
        confirmText: 'OK',
        type: 'success'
      })
    } catch (err) {
      await confirm({
        title: 'Error',
        message: `Failed to add note: ${err.message}`,
        confirmText: 'OK',
        type: 'danger'
      })
    }
  }

  const handleStartEdit = (note) => {
    setEditingNoteId(note.id)
    setEditNoteText(note.note_text)
    setEditNoteIsPrivate(note.is_private)
  }

  const handleCancelEdit = () => {
    setEditingNoteId(null)
    setEditNoteText('')
    setEditNoteIsPrivate(true)
  }

  const handleSaveEdit = async (noteId) => {
    if (!editNoteText.trim()) {
      await confirm({
        title: 'Empty Note',
        message: 'Please enter some text for the note.',
        confirmText: 'OK',
        type: 'warning'
      })
      return
    }

    try {
      await ApplicationNotesDataSource.updateNote(
        noteId,
        editNoteText.trim(),
        editNoteIsPrivate
      )
      
      // Reset edit state
      setEditingNoteId(null)
      setEditNoteText('')
      setEditNoteIsPrivate(true)
      
      // Reload notes
      await loadNotes()
      
      await confirm({
        title: 'Success',
        message: 'Note updated successfully!',
        confirmText: 'OK',
        type: 'success'
      })
    } catch (err) {
      await confirm({
        title: 'Error',
        message: `Failed to update note: ${err.message}`,
        confirmText: 'OK',
        type: 'danger'
      })
    }
  }

  const handleDeleteNote = async (noteId) => {
    const confirmed = await confirm({
      title: 'Delete Note',
      message: 'Are you sure you want to delete this note? This action cannot be undone.',
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      type: 'danger'
    })

    if (!confirmed) return

    try {
      await ApplicationNotesDataSource.deleteNote(noteId)
      
      // Reload notes
      await loadNotes()
      
      await confirm({
        title: 'Success',
        message: 'Note deleted successfully!',
        confirmText: 'OK',
        type: 'success'
      })
    } catch (err) {
      await confirm({
        title: 'Error',
        message: `Failed to delete note: ${err.message}`,
        confirmText: 'OK',
        type: 'danger'
      })
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">{t('loading')}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
          <MessageSquare className="w-5 h-5 mr-2" />
          {t('title')}
          {notes.length > 0 && (
            <span className="ml-2 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
              {notes.length}
            </span>
          )}
        </h4>
        
        {!isAddingNote && (
          <button
            onClick={() => setIsAddingNote(true)}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 border border-blue-300 dark:border-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" />
            {t('addNote')}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
          <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
        </div>
      )}

      {/* Add Note Form */}
      {isAddingNote && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <textarea
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            placeholder={t('placeholder')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 mb-3"
            rows={3}
            autoFocus
          />
          
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={newNoteIsPrivate}
                onChange={(e) => setNewNoteIsPrivate(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="flex items-center">
                {newNoteIsPrivate ? (
                  <>
                    <Lock className="w-4 h-4 mr-1" />
                    {t('privateNote')}
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4 mr-1" />
                    {t('generalNote')}
                  </>
                )}
              </span>
            </label>
            
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setIsAddingNote(false)
                  setNewNoteText('')
                  setNewNoteIsPrivate(true)
                }}
                className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleAddNote}
                disabled={!newNoteText.trim()}
                className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('saveNote')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes List */}
      {notes.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{t('noNotes')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              {editingNoteId === note.id ? (
                // Edit Mode
                <div>
                  <textarea
                    value={editNoteText}
                    onChange={(e) => setEditNoteText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 mb-3"
                    rows={3}
                    autoFocus
                  />
                  
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editNoteIsPrivate}
                        onChange={(e) => setEditNoteIsPrivate(e.target.checked)}
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="flex items-center">
                        {editNoteIsPrivate ? (
                          <>
                            <Lock className="w-4 h-4 mr-1" />
                            {t('private')}
                          </>
                        ) : (
                          <>
                            <Unlock className="w-4 h-4 mr-1" />
                            {t('general')}
                          </>
                        )}
                      </span>
                    </label>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={handleCancelEdit}
                        className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSaveEdit(note.id)}
                        className="p-1.5 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 rounded"
                        title="Save"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // View Mode
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {note.added_by_name}
                      </span>
                      {note.is_private ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          <Lock className="w-3 h-3 mr-1" />
                          {t('private')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          <Unlock className="w-3 h-3 mr-1" />
                          {t('general')}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleStartEdit(note)}
                        className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded"
                        title="Edit note"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded"
                        title="Delete note"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-2">
                    {note.note_text}
                  </p>
                  
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      {format(new Date(note.created_at), 'MMM dd, yyyy HH:mm')}
                    </span>
                    {note.updated_at !== note.created_at && (
                      <span className="ml-2">{t('edited')}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ApplicationNotes
