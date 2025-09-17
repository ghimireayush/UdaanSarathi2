import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Custom render function that includes providers
export const renderWithProviders = (ui, options = {}) => {
  const { initialEntries = ['/'], ...renderOptions } = options;

  const Wrapper = ({ children }) => (
    <BrowserRouter>
      <AuthProvider>
        {children}
      </AuthProvider>
    </BrowserRouter>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Mock data for tests
export const mockApiResponses = {
  registerOwner: {
    success: { dev_otp: '123456' },
    error400: { message: 'Invalid input data' },
    error409: { message: 'Phone number already registered' },
    error500: { message: 'Internal server error' }
  }
};

export const mockUserData = {
  validUser: {
    fullName: 'John Doe',
    phone: '9841234567'
  },
  invalidPhone: {
    fullName: 'John Doe',
    phone: '123'
  },
  emptyName: {
    fullName: '',
    phone: '9841234567'
  }
};

// Common test utilities
export const fillRegistrationForm = (nameInput, phoneInput, userData) => {
  if (nameInput && userData.fullName) {
    nameInput.value = userData.fullName;
    nameInput.dispatchEvent(new Event('change', { bubbles: true }));
  }
  if (phoneInput && userData.phone) {
    phoneInput.value = userData.phone;
    phoneInput.dispatchEvent(new Event('change', { bubbles: true }));
  }
};

export const waitForApiCall = (mockFn, expectedCallCount = 1) => {
  return new Promise((resolve) => {
    const checkCalls = () => {
      if (mockFn.mock.calls.length >= expectedCallCount) {
        resolve();
      } else {
        setTimeout(checkCalls, 10);
      }
    };
    checkCalls();
  });
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
