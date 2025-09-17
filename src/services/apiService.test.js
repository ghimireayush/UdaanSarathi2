import apiService from './apiService';

// Mock fetch globally
global.fetch = jest.fn();

describe('ApiService - Simple Tests', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('should successfully register owner', async () => {
    const mockResponse = { dev_otp: '123456' };
    
    fetch.mockResolvedValueOnce({
      ok: true,
      headers: {
        get: () => 'application/json'
      },
      json: async () => mockResponse
    });

    const result = await apiService.registerOwner({
      fullName: 'John Doe',
      phone: '9841234567'
    });

    expect(result).toEqual(mockResponse);
  });

  test('should throw error for missing phone', async () => {
    await expect(apiService.registerOwner({ fullName: 'John Doe' }))
      .rejects
      .toThrow('Phone number and full name are required');
  });

  test('should throw error for missing name', async () => {
    await expect(apiService.registerOwner({ phone: '9841234567' }))
      .rejects
      .toThrow('Phone number and full name are required');
  });
});
