import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock all dependencies
jest.mock('../services/apiService', () => ({
  registerOwner: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    register: jest.fn(),
  }),
}));

jest.mock('../assets/logo.svg', () => 'logo.svg');

// Import Register component after mocks
import Register from './Register';

describe('Register Component', () => {
  test('renders without crashing', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Create Your Account')).toBeInTheDocument();
  });
});
