import { createContext, useContext } from 'react'

export const WorkflowStagesContext = createContext()

export const useWorkflowStages = () => {
  const stages = useContext(WorkflowStagesContext)
  if (!stages) {
    throw new Error('useWorkflowStages must be used within WorkflowStagesProvider')
  }
  return stages
}

export const WorkflowStagesProvider = ({ children }) => {
  // Define the 4 main workflow stages
  const stages = [
    { id: 'applied', label: 'Applied' },
    { id: 'shortlisted', label: 'Shortlisted' },
    { id: 'interview-scheduled', label: 'Interview Scheduled' },
    { id: 'interview-passed', label: 'Interview Passed' }
  ]

  return (
    <WorkflowStagesContext.Provider value={stages}>
      {children}
    </WorkflowStagesContext.Provider>
  )
}
