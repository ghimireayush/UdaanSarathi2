import React, { useState, useEffect, useCallback } from 'react'
import aiSchedulingService from '../services/aiSchedulingService'
import { formatInNepalTz } from '../utils/nepaliDate'

const AISchedulingAssistant = ({
  existingMeetings = [],
  participants = [],
  onScheduleSelect,
  constraints = {},
  className = ''
}) => {
  const [suggestions, setSuggestions] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [autoScheduleMode, setAutoScheduleMode] = useState(false)
  const [schedulingConstraints, setSchedulingConstraints] = useState({
    duration: 60,
    priority: 'medium',
    meetingType: 'interview',
    dateRange: {
      start: new Date(),
      end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    ...constraints
  })

  // Generate AI scheduling suggestions
  const generateSuggestions = useCallback(async () => {
    if (participants.length === 0) return

    setLoading(true)
    setError(null)

    try {
      const result = await aiSchedulingService.generateSchedulingSuggestions(
        existingMeetings,
        participants,
        schedulingConstraints
      )

      setSuggestions(result.suggestions)
      setRecommendations(result.recommendations)
      setAnalytics(result.analytics)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [existingMeetings, participants, schedulingConstraints])

  // Auto-schedule multiple meetings
  const handleAutoSchedule = useCallback(async (meetings) => {
    setLoading(true)
    setError(null)

    try {
      const result = await aiSchedulingService.autoScheduleMeetings(
        meetings,
        { existingMeetings, ...schedulingConstraints }
      )

      // Handle results
      if (result.scheduled.length > 0) {
        result.scheduled.forEach(meeting => {
          onScheduleSelect?.(meeting)
        })
      }

      return result
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [existingMeetings, schedulingConstraints, onScheduleSelect])

  // Handle slot selection
  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot)
    onScheduleSelect?.(slot)
  }

  // Update constraints
  const updateConstraints = (newConstraints) => {
    setSchedulingConstraints(prev => ({ ...prev, ...newConstraints }))
  }

  // Generate suggestions when dependencies change
  useEffect(() => {
    generateSuggestions()
  }, [generateSuggestions])

  const ScoreIndicator = ({ score, factors }) => (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
      <div className="space-y-2">
        {Object.entries(factors || {}).map(([factor, value]) => (
          <div key={factor} className="flex items-center space-x-3">
            <span className="text-xs text-gray-600 dark:text-gray-400 w-20 capitalize">
              {factor.replace(/([A-Z])/g, ' $1').toLowerCase()}
            </span>
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                style={{ width: `${Math.min(value || 0, 100)}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-right">
              {Math.round(value || 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )

  const TimeSlotCard = ({ slot, isSelected, onSelect }) => {
    const getScoreColor = (score) => {
      if (score >= 80) return 'text-green-600 dark:text-green-400'
      if (score >= 60) return 'text-blue-600 dark:text-blue-400'
      return 'text-yellow-600 dark:text-yellow-400'
    }

    const getBorderColor = (score) => {
      if (score >= 80) return 'border-l-green-500'
      if (score >= 60) return 'border-l-blue-500'
      return 'border-l-yellow-500'
    }

    return (
      <div
        className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md border-l-4 ${getBorderColor(slot.score)} ${
          isSelected 
            ? 'border-purple-300 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-600' 
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
        }`}
        onClick={() => onSelect(slot)}
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {formatInNepalTz(slot.start, 'EEEE, MMM dd')}
            </div>
            <div className="text-gray-600 dark:text-gray-400 text-sm">
              {slot.time} - {formatInNepalTz(slot.end, 'HH:mm')}
            </div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getScoreColor(slot.score)}`}>{slot.score}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Score</div>
          </div>
        </div>

        <div className="mb-3">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{slot.recommendation}</p>

          {slot.availability && (
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {slot.availability.filter(p => p.available).length}/{slot.availability.length} participants available
              </div>
              <div className="flex flex-wrap gap-1">
                {slot.availability.map(participant => (
                  <span
                    key={participant.id}
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      participant.available
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }`}
                  >
                    {participant.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <ScoreIndicator score={slot.score} factors={slot.factors} />
      </div>
    )
  }

  const RecommendationCard = ({ recommendation }) => {
    const getCardStyles = () => {
      switch (recommendation.type) {
        case 'optimal':
          return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 border-l-4 border-l-green-500'
        case 'warning':
          return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700 border-l-4 border-l-yellow-500'
        case 'insight':
          return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700 border-l-4 border-l-purple-500'
        default:
          return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 border-l-4 border-l-blue-500'
      }
    }

    const getIcon = () => {
      switch (recommendation.type) {
        case 'optimal':
          return <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
        case 'warning':
          return <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
        default:
          return <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      }
    }

    return (
      <div className={`p-4 rounded-lg border ${getCardStyles()}`}>
        <div className="flex items-start space-x-3">
          {getIcon()}
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{recommendation.title}</h4>
            <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">{recommendation.description}</p>
            {recommendation.reason && (
              <p className="text-gray-600 dark:text-gray-400 text-xs">{recommendation.reason}</p>
            )}
            {recommendation.slots && (
              <div className="flex flex-wrap gap-2 mt-3">
                {recommendation.slots.map((slot, index) => (
                  <button
                    key={index}
                    onClick={() => handleSlotSelect(slot)}
                    className="px-3 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                  >
                    {formatInNepalTz(slot.start, 'MMM dd, HH:mm')} (Score: {slot.score})
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const ConstraintsPanel = () => (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Scheduling Preferences</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Meeting Duration</label>
          <select
            value={schedulingConstraints.duration}
            onChange={(e) => updateConstraints({ duration: parseInt(e.target.value) })}
            className="form-select w-full"
          >
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>1 hour</option>
            <option value={90}>1.5 hours</option>
            <option value={120}>2 hours</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
          <select
            value={schedulingConstraints.priority}
            onChange={(e) => updateConstraints({ priority: e.target.value })}
            className="form-select w-full"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Meeting Type</label>
          <select
            value={schedulingConstraints.meetingType}
            onChange={(e) => updateConstraints({ meetingType: e.target.value })}
            className="form-select w-full"
          >
            <option value="interview">Interview</option>
            <option value="meeting">Meeting</option>
            <option value="presentation">Presentation</option>
            <option value="review">Review</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Range</label>
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={schedulingConstraints.dateRange.start.toISOString().split('T')[0]}
              onChange={(e) => updateConstraints({
                dateRange: {
                  ...schedulingConstraints.dateRange,
                  start: new Date(e.target.value)
                }
              })}
              className="form-input flex-1"
            />
            <span className="text-gray-500 dark:text-gray-400 text-sm">to</span>
            <input
              type="date"
              value={schedulingConstraints.dateRange.end.toISOString().split('T')[0]}
              onChange={(e) => updateConstraints({
                dateRange: {
                  ...schedulingConstraints.dateRange,
                  end: new Date(e.target.value)
                }
              })}
              className="form-input flex-1"
            />
          </div>
        </div>

        <button
          onClick={generateSuggestions}
          disabled={loading}
          className="w-full btn-primary flex items-center justify-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{loading ? 'Analyzing...' : 'Refresh Suggestions'}</span>
        </button>
      </div>
    </div>
  )

  const AnalyticsPanel = () => analytics && (
    <div className="p-6 border-t border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Best Time of Day</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{analytics.totalSlotsAnalyzed}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Slots Analyzed</div>
        </div>
        <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{Math.round(analytics.averageScore)}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Avg Score</div>
        </div>
        <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 col-span-2">
          <div className="text-lg font-bold text-green-600 dark:text-green-400">{analytics.bestTimeOfDay}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Best Time</div>
        </div>
      </div>
      
      {/* Limited Availability Warning */}
      <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-600 rounded-lg">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-sm font-medium text-yellow-800 dark:text-yellow-100">Limited Availability</span>
          <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
      </div>
    </div>
  )

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">AI Scheduling Assistant</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Intelligent scheduling suggestions for optimal interview coverage</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
            Phase 2 Feature
          </span>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoScheduleMode}
              onChange={(e) => setAutoScheduleMode(e.target.checked)}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto-schedule mode</span>
          </label>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-800 dark:text-red-200">{error}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row min-h-[600px]">
        {/* Left Panel - Constraints */}
        <div className="w-full lg:w-80 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
          <ConstraintsPanel />
          <AnalyticsPanel />
        </div>

        {/* Main Panel - Results */}
        <div className="flex-1 p-6 bg-white dark:bg-gray-800">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 border-4 border-purple-200 dark:border-purple-700 border-t-purple-600 dark:border-t-purple-400 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Analyzing optimal scheduling options...</p>
            </div>
          )}

          {recommendations.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                AI Recommendations
              </h3>
              <div className="space-y-4">
                {recommendations
                  .sort((a, b) => a.priority - b.priority)
                  .map((rec, index) => (
                    <RecommendationCard key={index} recommendation={rec} />
                  ))}
              </div>
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Alternative Time Slots</h3>
              <div className="space-y-4">
                {suggestions.map((slot, index) => (
                  <TimeSlotCard
                    key={index}
                    slot={slot}
                    isSelected={selectedSlot === slot}
                    onSelect={handleSlotSelect}
                  />
                ))}
              </div>
            </div>
          )}

          {!loading && suggestions.length === 0 && participants.length > 0 && (
            <div className="text-center py-16">
              <svg className="w-16 h-16 text-gray-300 dark:text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No suitable time slots found</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Try adjusting the date range or meeting duration.</p>
              <button
                onClick={generateSuggestions}
                className="btn-primary"
              >
                Refresh Suggestions
              </button>
            </div>
          )}

          {participants.length === 0 && (
            <div className="text-center py-16">
              <svg className="w-16 h-16 text-gray-300 dark:text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Add participants to get started</h3>
              <p className="text-gray-600 dark:text-gray-300">AI scheduling suggestions will appear once you add participants to the interview.</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .ai-scheduling-assistant {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .assistant-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .assistant-header h2 {
          margin: 0;
          color: #1f2937;
        }

        .auto-schedule-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .assistant-content {
          display: flex;
          min-height: 600px;
        }

        .left-panel {
          width: 300px;
          border-right: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .main-panel {
          flex: 1;
          padding: 1.5rem;
        }

        .constraints-panel {
          padding: 1.5rem;
        }

        .constraints-panel h3 {
          margin: 0 0 1rem 0;
          color: #374151;
        }

        .constraint-group {
          margin-bottom: 1rem;
        }

        .constraint-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #374151;
        }

        .constraint-group select,
        .constraint-group input {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 0.875rem;
        }

        .date-range {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .date-range input {
          flex: 1;
        }

        .refresh-suggestions {
          width: 100%;
          padding: 0.75rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }

        .refresh-suggestions:hover {
          background: #2563eb;
        }

        .refresh-suggestions:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .analytics-panel {
          padding: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

        .analytics-panel h3 {
          margin: 0 0 1rem 0;
          color: #374151;
        }

        .analytics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .metric {
          text-align: center;
        }

        .metric-value {
          display: block;
          font-size: 1.5rem;
          font-weight: bold;
          color: #3b82f6;
        }

        .metric-label {
          display: block;
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 0.25rem;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          color: #6b7280;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e5e7eb;
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .recommendations-section,
        .suggestions-section {
          margin-bottom: 2rem;
        }

        .recommendations-section h3,
        .suggestions-section h3 {
          margin: 0 0 1rem 0;
          color: #1f2937;
        }

        .recommendations-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .recommendation-card {
          padding: 1rem;
          border-radius: 6px;
          border-left: 4px solid #3b82f6;
        }

        .recommendation-card.optimal {
          background: #f0f9ff;
          border-left-color: #10b981;
        }

        .recommendation-card.warning {
          background: #fef3c7;
          border-left-color: #f59e0b;
        }

        .recommendation-card.insight {
          background: #ede9fe;
          border-left-color: #8b5cf6;
        }

        .recommendation-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .recommendation-header h4 {
          margin: 0;
          color: #1f2937;
        }

        .recommendation-reason {
          font-size: 0.875rem;
          color: #6b7280;
          margin-top: 0.5rem;
        }

        .alternative-slots {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .alternative-slot {
          padding: 0.5rem 1rem;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .alternative-slot:hover {
          background: #f3f4f6;
        }

        .suggestions-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .time-slot-card {
          padding: 1.5rem;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .time-slot-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }

        .time-slot-card.selected {
          border-color: #3b82f6;
          background: #f0f9ff;
        }

        .time-slot-card.excellent {
          border-left: 4px solid #10b981;
        }

        .time-slot-card.good {
          border-left: 4px solid #3b82f6;
        }

        .time-slot-card.fair {
          border-left: 4px solid #f59e0b;
        }

        .slot-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .slot-time .date {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.25rem;
        }

        .slot-time .time {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .slot-score {
          text-align: center;
        }

        .slot-score .score {
          display: block;
          font-size: 1.5rem;
          font-weight: bold;
          color: #3b82f6;
        }

        .slot-score .score-label {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .slot-details {
          margin-bottom: 1rem;
        }

        .recommendation {
          font-size: 0.875rem;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .availability {
          font-size: 0.875rem;
        }

        .available-count {
          color: #6b7280;
          margin-bottom: 0.5rem;
          display: block;
        }

        .participant-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
        }

        .participant {
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
        }

        .participant.available {
          background: #d1fae5;
          color: #065f46;
        }

        .participant.unavailable {
          background: #fee2e2;
          color: #991b1b;
        }

        .score-indicator {
          border-top: 1px solid #e5e7eb;
          padding-top: 1rem;
        }

        .score-factors {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .factor {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .factor-name {
          font-size: 0.75rem;
          color: #6b7280;
          width: 120px;
          text-transform: capitalize;
        }

        .factor-bar {
          flex: 1;
          height: 4px;
          background: #e5e7eb;
          border-radius: 2px;
          overflow: hidden;
        }

        .factor-fill {
          height: 100%;
          background: #3b82f6;
          transition: width 0.3s;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          background: #fee2e2;
          color: #991b1b;
          border-left: 4px solid #dc2626;
          margin: 1rem;
        }

        .no-suggestions,
        .no-participants {
          text-align: center;
          padding: 3rem;
          color: #6b7280;
        }

        .auto-schedule-panel {
          padding: 1.5rem;
          margin: 1rem 0;
          background: #f0f9ff;
          border: 1px solid #0ea5e9;
          border-radius: 6px;
        }

        .auto-schedule-panel h3 {
          margin: 0 0 0.5rem 0;
          color: #0c4a6e;
        }

        .auto-schedule-panel p {
          margin: 0 0 1rem 0;
          color: #075985;
          font-size: 0.875rem;
        }

        .auto-schedule-btn {
          padding: 0.75rem 1.5rem;
          background: #0ea5e9;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }

        .auto-schedule-btn:hover {
          background: #0284c7;
        }

        .auto-schedule-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}

export default AISchedulingAssistant