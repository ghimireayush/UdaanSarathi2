import logo from '../assets/logo.svg'

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center z-50 transition-colors duration-300">
      <div className="flex flex-col items-center gap-6">
        {/* Logo with pulse animation and shadow */}
        <div className="animate-pulse">
          <div className="bg-white dark:bg-gray-800 rounded-full p-6 shadow-xl dark:shadow-2xl dark:shadow-blue-500/20">
            <img 
              src={logo} 
              alt="Udaan Sarathi Logo" 
              className="w-24 h-24 object-contain"
            />
          </div>
        </div>
        
        {/* Loading text with dots animation */}
        <div className="flex items-center gap-2">
          <span className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Loading
          </span>
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '0ms' }}></span>
            <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '150ms' }}></span>
            <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '300ms' }}></span>
          </div>
        </div>

        {/* Optional: Subtle brand text */}
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Udaan Sarathi
        </p>
      </div>
    </div>
  )
}

export default LoadingScreen
