import logo from '../assets/logo.svg'

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center z-50 transition-colors duration-300">
      <div className="flex flex-col items-center gap-6">
        {/* Logo without circle background */}
        <div className="animate-pulse">
          <img 
            src={logo} 
            alt="Udaan Sarathi Logo" 
            className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-lg"
          />
        </div>
        
        {/* Brand text */}
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">
          Udaan Sarathi
        </h2>
        
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
      </div>
    </div>
  )
}

export default LoadingScreen
