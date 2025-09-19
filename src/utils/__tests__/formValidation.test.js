import * as formValidation from '../formValidation'
import { describe, it, expect } from '@jest/globals'

describe('Form Validation Utils', () => {
  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'admin@udaan.com',
        'recruiter123@company.org'
      ]

      validEmails.forEach(email => {
        expect(formValidation.validateEmail(email)).toBe(true)
      })
    })

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user..name@domain.com',
        'user@domain',
        ''
      ]

      invalidEmails.forEach(email => {
        expect(formValidation.validateEmail(email)).toBe(false)
      })
    })
  })

  describe('validatePhone', () => {
    it('should validate correct phone number formats', () => {
      const validPhones = [
        '9876543210',
        '1234567890',
        '9999999999'
      ]

      validPhones.forEach(phone => {
        expect(formValidation.validatePhone(phone)).toBe(true)
      })
    })

    it('should reject invalid phone number formats', () => {
      const invalidPhones = [
        '123456789',  // too short
        '12345678901', // too long
        'abcdefghij',  // non-numeric
        '123-456-7890', // with dashes
        '+919876543210', // with country code
        ''
      ]

      invalidPhones.forEach(phone => {
        expect(formValidation.validatePhone(phone)).toBe(false)
      })
    })
  })

  describe('validateRequired', () => {
    it('should validate non-empty values', () => {
      const validValues = [
        'some text',
        '123',
        'a',
        '0'
      ]

      validValues.forEach(value => {
        expect(formValidation.validateRequired(value)).toBe(true)
      })
    })

    it('should reject empty values', () => {
      const invalidValues = [
        '',
        '   ',  // only whitespace
        null,
        undefined
      ]

      invalidValues.forEach(value => {
        expect(formValidation.validateRequired(value)).toBe(false)
      })
    })
  })

  describe('validateJobTitle', () => {
    it('should validate proper job titles', () => {
      const validTitles = [
        'Software Engineer',
        'Senior Developer',
        'Product Manager',
        'UI/UX Designer',
        'Data Scientist - ML'
      ]

      validTitles.forEach(title => {
        expect(formValidation.validateJobTitle(title)).toBe(true)
      })
    })

    it('should reject invalid job titles', () => {
      const invalidTitles = [
        '',
        'a', // too short
        'A'.repeat(101), // too long
        '123', // only numbers
        '!!!', // only special characters
      ]

      invalidTitles.forEach(title => {
        expect(formValidation.validateJobTitle(title)).toBe(false)
      })
    })
  })

  describe('validateSalaryRange', () => {
    it('should validate proper salary ranges', () => {
      const validRanges = [
        { min: 50000, max: 80000 },
        { min: 100000, max: 150000 },
        { min: 30000, max: 50000 }
      ]

      validRanges.forEach(range => {
        expect(formValidation.validateSalaryRange(range.min, range.max)).toBe(true)
      })
    })

    it('should reject invalid salary ranges', () => {
      const invalidRanges = [
        { min: 80000, max: 50000 }, // min > max
        { min: -1000, max: 50000 }, // negative min
        { min: 50000, max: -1000 }, // negative max
        { min: 0, max: 0 }, // both zero
      ]

      invalidRanges.forEach(range => {
        expect(formValidation.validateSalaryRange(range.min, range.max)).toBe(false)
      })
    })
  })

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const validPasswords = [
        'Password123!',
        'MyStr0ng@Pass',
        'C0mpl3x#P@ssw0rd'
      ]

      validPasswords.forEach(password => {
        expect(formValidation.validatePassword(password)).toBe(true)
      })
    })

    it('should reject weak passwords', () => {
      const invalidPasswords = [
        'password', // no uppercase, numbers, or special chars
        'PASSWORD', // no lowercase, numbers, or special chars
        '12345678', // no letters or special chars
        'Pass123', // too short
        'password123', // no uppercase or special chars
        'PASSWORD123', // no lowercase or special chars
        'Password!', // no numbers
        ''
      ]

      invalidPasswords.forEach(password => {
        expect(formValidation.validatePassword(password)).toBe(false)
      })
    })
  })

  describe('validateFormData', () => {
    it('should validate complete form data', () => {
      const validFormData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '9876543210',
        jobTitle: 'Software Engineer',
        minSalary: 50000,
        maxSalary: 80000
      }

      const result = formValidation.validateFormData(validFormData)
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual({})
    })

    it('should return errors for invalid form data', () => {
      const invalidFormData = {
        name: '',
        email: 'invalid-email',
        phone: '123',
        jobTitle: 'a',
        minSalary: 80000,
        maxSalary: 50000
      }

      const result = formValidation.validateFormData(invalidFormData)
      expect(result.isValid).toBe(false)
      expect(Object.keys(result.errors).length).toBeGreaterThan(0)
    })
  })
})