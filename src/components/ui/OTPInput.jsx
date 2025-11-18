import { useState, useRef, useEffect } from 'react'

const OTPInput = ({ 
  value = '', 
  onChange, 
  length = 6, 
  disabled = false,
  className = '',
  autoFocus = false 
}) => {
  const [otp, setOtp] = useState(Array(length).fill(''))
  const inputRefs = useRef([])

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length)
  }, [length])

  // Update internal state when value prop changes
  useEffect(() => {
    if (value) {
      const otpArray = value.split('').slice(0, length)
      while (otpArray.length < length) {
        otpArray.push('')
      }
      setOtp(otpArray)
    } else {
      setOtp(Array(length).fill(''))
    }
  }, [value, length])

  // Auto-focus first input on mount
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [autoFocus])

  const handleChange = (index, digit) => {
    // Only allow single digits
    if (digit.length > 1) {
      digit = digit.slice(-1)
    }

    // Only allow numbers
    if (digit && !/^\d$/.test(digit)) {
      return
    }

    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)

    // Call onChange with the complete OTP string
    const otpString = newOtp.join('')
    onChange(otpString)

    // Auto-focus next input if digit is entered
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // If current box is empty, move to previous box and clear it
        const newOtp = [...otp]
        newOtp[index - 1] = ''
        setOtp(newOtp)
        onChange(newOtp.join(''))
        inputRefs.current[index - 1]?.focus()
      } else {
        // Clear current box
        const newOtp = [...otp]
        newOtp[index] = ''
        setOtp(newOtp)
        onChange(newOtp.join(''))
      }
    }
    // Handle arrow keys
    else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
    // Handle paste
    else if (e.key === 'Enter') {
      e.preventDefault()
      // Find the form and submit it
      const form = e.target.closest('form')
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
      }
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text/plain')
    const digits = pastedData.replace(/\D/g, '').slice(0, length)
    
    if (digits) {
      const newOtp = Array(length).fill('')
      for (let i = 0; i < digits.length; i++) {
        newOtp[i] = digits[i]
      }
      setOtp(newOtp)
      onChange(newOtp.join(''))
      
      // Focus the next empty box or the last box
      const nextIndex = Math.min(digits.length, length - 1)
      inputRefs.current[nextIndex]?.focus()
    }
  }

  const handleFocus = (index) => {
    // Select all text when focusing
    inputRefs.current[index]?.select()
  }

  return (
    <div className={`flex gap-2 justify-center ${className}`}>
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="\d{1}"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(index)}
          disabled={disabled}
          className="w-12 h-12 text-center text-2xl font-mono font-bold border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-bright focus:border-brand-blue-bright bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={`OTP digit ${index + 1}`}
        />
      ))}
    </div>
  )
}

export default OTPInput