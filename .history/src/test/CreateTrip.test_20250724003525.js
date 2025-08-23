// src/components/__tests__/CreateTrip.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateTrip from '../CreateTrip';
import { generateTravelPlan } from '@/service/AIModal';
import { useGoogleLogin } from '@react-oauth/google';
import { setDoc, doc } from 'firebase/firestore';
import { mockTripData, mockUserProfile } from '../../__mocks__/services';

// Mock الخدمات الخارجية
jest.mock('@/service/AIModal');
jest.mock('@react-oauth/google');
jest.mock('firebase/firestore');
jest.mock('react-google-places-autocomplete', () => {
  return function MockGooglePlacesAutocomplete({ selectProps }) {
    return (
      <div data-testid="google-places-autocomplete">
        <input
          data-testid="places-input"
          placeholder={selectProps.placeholder}
          onChange={(e) => selectProps.onChange({ label: e.target.value })}
        />
      </div>
    );
  };
});

// Mock toast notifications
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn()
  }
}));

describe('CreateTrip API Tests', () => {
  let mockLogin;

  beforeEach(() => {
    // إعداد mock للـ Google Login
    mockLogin = jest.fn();
    useGoogleLogin.mockReturnValue(mockLogin);
    
    // إعداد mock للـ Firebase
    doc.mockReturnValue({ id: 'mock-doc-id' });
    setDoc.mockResolvedValue();
    
    // إعداد localStorage mock
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'user') {
        return JSON.stringify(mockUserProfile);
      }
      return null;
    });
  });

  describe('AI Travel Plan Generation', () => {
    test('should successfully generate travel plan', async () => {
      // ترتيب البيانات
      generateTravelPlan.mockResolvedValue(mockTripData);
      
      render(<CreateTrip />);
      
      // ملء النموذج
      await fillTripForm();
      
      // النقر على زر إنشاء الرحلة
      const generateButton = screen.getByText('✨ Generate My Trip');
      fireEvent.click(generateButton);
      
      // التحقق من استدعاء API
      await waitFor(() => {
        expect(generateTravelPlan).toHaveBeenCalledWith(
          'Paris, France',
          3,
          'Solo',
          'Budget-Friendly'
        );
      });
      
      // التحقق من حفظ البيانات
      await waitFor(() => {
        expect(setDoc).toHaveBeenCalled();
      });
    });

    test('should handle AI API failure', async () => {
      // محاكاة فشل API
      generateTravelPlan.mockRejectedValue(new Error('API Error'));
      
      render(<CreateTrip />);
      
      await fillTripForm();
      
      const generateButton = screen.getByText('✨ Generate My Trip');
      fireEvent.click(generateButton);
      
      // التحقق من استدعاء API
      await waitFor(() => {
        expect(generateTravelPlan).toHaveBeenCalled();
      });
      
      // التحقق من عدم حفظ البيانات عند الفشل
      expect(setDoc).not.toHaveBeenCalled();
    });

    test('should handle partial itinerary generation', async () => {
      // محاكاة استجابة جزئية
      const partialData = {
        ...mockTripData,
        itinerary: [mockTripData.itinerary[0]] // يوم واحد فقط
      };
      
      generateTravelPlan.mockResolvedValue(partialData);
      
      render(<CreateTrip />);
      
      await fillTripForm();
      
      const generateButton = screen.getByText('✨ Generate My Trip');
      fireEvent.click(generateButton);
      
      await waitFor(() => {
        expect(generateTravelPlan).toHaveBeenCalled();
      });
      
      // يجب حفظ البيانات حتى لو كانت جزئية
      await waitFor(() => {
        expect(setDoc).toHaveBeenCalled();
      });
    });

    test('should handle empty AI response', async () => {
      // محاكاة استجابة فارغة
      generateTravelPlan.mockResolvedValue(null);
      
      render(<CreateTrip />);
      
      await fillTripForm();
      
      const generateButton = screen.getByText('✨ Generate My Trip');
      fireEvent.click(generateButton);
      
      await waitFor(() => {
        expect(generateTravelPlan).toHaveBeenCalled();
      });
      
      // عدم حفظ البيانات للاستجابة الفارغة
      expect(setDoc).not.toHaveBeenCalled();
    });
  });

  describe('Google OAuth Integration', () => {
    beforeEach(() => {
      // إزالة المستخدم من localStorage لمحاكاة حالة عدم تسجيل الدخول
      localStorage.getItem.mockReturnValue(null);
    });

    test('should handle successful Google login', async () => {
      const mockTokenResponse = { access_token: 'mock_token' };
      
      // محاكاة fetch للحصول على بيانات المستخدم
      global.fetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockUserProfile)
      });
      
      generateTravelPlan.mockResolvedValue(mockTripData);
      
      // محاكاة نجاح تسجيل الدخول
      useGoogleLogin.mockImplementation(({ onSuccess }) => {
        return jest.fn(() => onSuccess(mockTokenResponse));
      });
      
      render(<CreateTrip />);
      
      await fillTripForm();
      
      const generateButton = screen.getByText('✨ Generate My Trip');
      fireEvent.click(generateButton);
      
      // التحقق من ظهور نافذة تسجيل الدخول
      await waitFor(() => {
        expect(screen.getByText('Sign In With Google')).toBeInTheDocument();
      });
      
      // النقر على زر تسجيل الدخول بـ Google
      const googleLoginButton = screen.getByText('Sign in with Google');
      fireEvent.click(googleLoginButton);
      
      // التحقق من استدعاء Google API
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${mockTokenResponse.access_token}`,
          expect.objectContaining({
            headers: {
              Authorization: `Bearer ${mockTokenResponse.access_token}`,
              Accept: 'application/json'
            }
          })
        );
      });
      
      // التحقق من حفظ بيانات المستخدم
      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith(
          'user',
          JSON.stringify(mockUserProfile)
        );
      });
    });

    test('should handle Google login failure', async () => {
      // محاكاة فشل تسجيل الدخول
      useGoogleLogin.mockImplementation(({ onError }) => {
        return jest.fn(() => onError(new Error('Login failed')));
      });
      
      render(<CreateTrip />);
      
      await fillTripForm();
      
      const generateButton = screen.getByText('✨ Generate My Trip');
      fireEvent.click(generateButton);
      
      // النقر على زر تسجيل الدخول بـ Google
      await waitFor(() => {
        const googleLoginButton = screen.getByText('Sign in with Google');
        fireEvent.click(googleLoginButton);
      });
      
      // التحقق من عدم حفظ بيانات المستخدم
      expect(localStorage.setItem).not.toHaveBeenCalledWith(
        'user',
        expect.any(String)
      );
    });

    test('should handle Google API profile fetch failure', async () => {
      const mockTokenResponse = { access_token: 'mock_token' };
      
      // محاكاة فشل fetch
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      
      useGoogleLogin.mockImplementation(({ onSuccess }) => {
        return jest.fn(() => onSuccess(mockTokenResponse));
      });
      
      render(<CreateTrip />);
      
      await fillTripForm();
      
      const generateButton = screen.getByText('✨ Generate My Trip');
      fireEvent.click(generateButton);
      
      const googleLoginButton = await screen.findByText('Sign in with Google');
      fireEvent.click(googleLoginButton);
      
      // التحقق من محاولة استدعاء API
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
      
      // التحقق من عدم حفظ بيانات المستخدم عند الفشل
      expect(localStorage.setItem).not.toHaveBeenCalledWith(
        'user',
        expect.any(String)
      );
    });
  });

  describe('Firebase Database Operations', () => {
    test('should save trip data to Firebase successfully', async () => {
      generateTravelPlan.mockResolvedValue(mockTripData);
      setDoc.mockResolvedValue();
      
      render(<CreateTrip />);
      
      await fillTripForm();
      
      const generateButton = screen.getByText('✨ Generate My Trip');
      fireEvent.click(generateButton);
      
      await waitFor(() => {
        expect(setDoc).toHaveBeenCalledWith(
          expect.anything(), // document reference
          expect.objectContaining({
            userSelection: expect.any(Object),
            tripData: mockTripData,
            userEmail: mockUserProfile.email,
            id: expect.any(String)
          })
        );
      });
    });

    test('should handle Firebase save failure', async () => {
      generateTravelPlan.mockResolvedValue(mockTripData);
      setDoc.mockRejectedValue(new Error('Firebase error'));
      
      render(<CreateTrip />);
      
      await fillTripForm();
      
      const generateButton = screen.getByText('✨ Generate My Trip');
      fireEvent.click(generateButton);
      
      await waitFor(() => {
        expect(setDoc).toHaveBeenCalled();
      });
      
      // يجب أن يتم حفظ البيانات في localStorage حتى لو فشل Firebase
      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith(
          expect.stringMatching(/^AITrip_/),
          expect.any(String)
        );
      });
    });
  });

  // دالة مساعدة لملء النموذج
  async function fillTripForm() {
    // اختيار الوجهة
    const placesInput = screen.getByTestId('places-input');
    await userEvent.type(placesInput, 'Paris, France');
    
    // إدخال عدد الأيام
    const daysInput = screen.getByPlaceholderText('Enter number of days');
    await userEvent.type(daysInput, '3');
    
    // اختيار الميزانية
    const budgetOption = screen.getByText('Budget-Friendly');
    fireEvent.click(budgetOption);
    
    // اختيار نوع السفر
    const travelerOption = screen.getByText('Solo');
    fireEvent.click(travelerOption);
  }
});