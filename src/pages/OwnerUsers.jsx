import { useLanguage } from '../hooks/useLanguage'

const OwnerUsers = () => {
  const { tPageSync } = useLanguage({ 
    pageName: 'owner-users', 
    autoLoad: true 
  })

  const tPage = (key, params = {}) => {
    return tPageSync(key, params)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {tPage('title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {tPage('subtitle')}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          {tPage('comingSoon')}
        </p>
      </div>
    </div>
  )
}

export default OwnerUsers
