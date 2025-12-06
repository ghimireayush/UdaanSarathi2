/**
 * Tests for AuthDataSource - verifying unauthenticated endpoints
 */

// Mock httpClient before importing AuthDataSource
jest.mock('../../config/httpClient');

const AuthDataSource = require('../AuthDataSource').default;
const httpClient = require('../../config/httpClient').default;

describe('AuthDataSource - Unauthenticated Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    httpClient.post = jest.fn().mockResolvedValue({ success: true });
  });

  describe('Registration endpoints', () => {
    test('registerOwner does not require authentication', async () => {
      await AuthDataSource.registerOwner({
        fullName: 'Test User',
        phone: '1234567890'
      });

      expect(httpClient.post).toHaveBeenCalledWith(
        '/agency/register-owner',
        expect.any(Object),
        { requireAuth: false }
      );
    });

    test('verifyOwner does not require authentication', async () => {
      await AuthDataSource.verifyOwner({
        phone: '1234567890',
        otp: '123456'
      });

      expect(httpClient.post).toHaveBeenCalledWith(
        '/agency/verify-owner',
        expect.any(Object),
        { requireAuth: false }
      );
    });
  });

  describe('Admin login endpoints', () => {
    test('loginStart does not require authentication', async () => {
      await AuthDataSource.loginStart({ phone: '1234567890' });

      expect(httpClient.post).toHaveBeenCalledWith(
        '/login/start',
        expect.any(Object),
        { requireAuth: false }
      );
    });

    test('loginVerify does not require authentication', async () => {
      await AuthDataSource.loginVerify({
        phone: '1234567890',
        otp: '123456'
      });

      expect(httpClient.post).toHaveBeenCalledWith(
        '/login/verify',
        expect.any(Object),
        { requireAuth: false }
      );
    });
  });

  describe('Owner login endpoints', () => {
    test('loginStartOwner does not require authentication', async () => {
      await AuthDataSource.loginStartOwner({ phone: '1234567890' });

      expect(httpClient.post).toHaveBeenCalledWith(
        '/agency/login/start-owner',
        expect.any(Object),
        { requireAuth: false }
      );
    });

    test('loginVerifyOwner does not require authentication', async () => {
      await AuthDataSource.loginVerifyOwner({
        phone: '1234567890',
        otp: '123456'
      });

      expect(httpClient.post).toHaveBeenCalledWith(
        '/agency/login/verify-owner',
        expect.any(Object),
        { requireAuth: false }
      );
    });
  });

  describe('Member login endpoints', () => {
    test('memberLogin does not require authentication', async () => {
      await AuthDataSource.memberLogin({
        phone: '1234567890',
        password: 'password123'
      });

      expect(httpClient.post).toHaveBeenCalledWith(
        '/member/login',
        expect.any(Object),
        { requireAuth: false }
      );
    });

    test('memberLoginStart does not require authentication', async () => {
      await AuthDataSource.memberLoginStart({ phone: '1234567890' });

      expect(httpClient.post).toHaveBeenCalledWith(
        '/member/login/start',
        expect.any(Object),
        { requireAuth: false }
      );
    });

    test('memberLoginVerify does not require authentication', async () => {
      await AuthDataSource.memberLoginVerify({
        phone: '1234567890',
        otp: '123456'
      });

      expect(httpClient.post).toHaveBeenCalledWith(
        '/member/login/verify',
        expect.any(Object),
        { requireAuth: false }
      );
    });
  });

  describe('Authenticated endpoints', () => {
    test('createAgency requires authentication (no requireAuth flag)', async () => {
      await AuthDataSource.createAgency({
        companyName: 'Test Company',
        registrationNumber: '12345',
        address: '123 Test St',
        city: 'Test City',
        country: 'Test Country',
        phone: '1234567890',
        website: 'https://test.com',
        description: 'Test description'
      });

      // Should be called without requireAuth: false (defaults to true)
      expect(httpClient.post).toHaveBeenCalledWith(
        '/agencies/owner/agency',
        expect.any(Object)
      );
      
      // Verify it was NOT called with requireAuth: false
      expect(httpClient.post).not.toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        { requireAuth: false }
      );
    });
  });
});
