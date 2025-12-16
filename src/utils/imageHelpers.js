const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://dev.kaha.com.np/job-portal'

export const resolveImageUrl = (url) => {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url
  if (url.startsWith('/')) return `${API_BASE_URL}${url}`
  return `${API_BASE_URL}/${url}`
}
