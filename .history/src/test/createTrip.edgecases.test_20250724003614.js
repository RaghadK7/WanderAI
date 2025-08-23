// src/components/__tests__/CreateTrip.edgecases.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateTrip from '../CreateTrip';
import { generateTravelPlan } from '@/service/AIModal';
import { toast } from 'sonner';

// Mock جميع الخدمات
jest.mock('@/service/AIModal');
jest.mock('sonner');
jest.mock('@react-oauth/google', () => ({
  useGoogleLogin: () => jest.fn()
}));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn()
}));
jest.mock('react-google-places-autocomplete', () => {
  return function MockGooglePlacesAutocomplete({ selectProps }) {
    return (
      <input
        data-testid="places-input"
        onChange={(e) => selectProps.onChange({ label: e.target.value })}
      />
    );
  };
});

describe('CreateTrip API Edge Cases', () => {
  beforeEach(() => {
    // إعداد المستخدم المسجل
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'user') {
        return JSON.stringify({ email: 'test@example.com', name: 'Test User' });
      }
      return null;
    });
    
    jest.clearAllMocks();
  });

  describe('Network and Timeout Scenarios', () => {
    test('should handle network timeout', async () => {
      // محاكاة انتهاء مهلة الشبكة
      generateTravelPlan.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      );
      
      render(<CreateTrip />);
      await fillForm();
      
      fireEvent.click(screen.getByText('✨ Generate My Trip'));
      
      await waitFor(() => {
        expect(generateTravelPlan).toHaveBeenCalled();
      }, { timeout: 3000 });
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Trip generation failed');
      });
    });

    test('should handle slow API response', async () => {
      // محاكاة استجابة بطيئة
      const slowResponse = new Promise(resolve => 
        setTimeout(() => resolve({
          itinerary: [{ day: 1, plan: [] }]
        }), 2000)
      );
      
      generateTravelPlan.mockReturnValue(slowResponse);
      
      render(<CreateTrip />);
      await fillForm();
      
      fireEvent.click(screen.getByText('✨ Generate My Trip'));
      
      // التحقق من ظهور حالة التحميل
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(generateTravelPlan).toHaveBeenCalled();
      });
    }, 10000);

    test('should handle intermittent connection issues', async () => {
      // محاكاة مشاكل الاتصال المتقطعة
      let callCount = 0;
      generateTravelPlan.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Connection lost'));
        }
        return Promise.resolve({ itinerary: [{ day: 1, plan: [] }] });
      });
      
      render(<CreateTrip />);
      await fillForm();
      
      fireEvent.click(screen.getByText('✨ Generate My Trip'));
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Trip generation failed');
      });
    });
  });

  describe('API Response Validation', () => {
    test('should handle malformed JSON response', async () => {
      generateTravelPlan.mockResolvedValue("invalid json string");
      
      render(<CreateTrip />);
      await fillForm();
      
      fireEvent.click(screen.getByText('✨ Generate My Trip'));
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Invalid AI response');
      });
    });

    test('should handle response with missing required fields', async () => {
      generateTravelPlan.mockResolvedValue({
        // مفقود itinerary
        hotels: []
      });
      
      render(<CreateTrip />);
      await fillForm();
      
      fireEvent.click(screen.getByText('✨ Generate My Trip'));
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Invalid AI response');
      });
    });

    test('should handle response with empty itinerary', async () => {
      generateTravelPlan.mockResolvedValue({
        itinerary: [],
        hotels: []
      });
      
      render(<CreateTrip />);
      await fillForm();
      
      fireEvent.click(screen.getByText('✨ Generate My Trip'));
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('No itinerary generated');
      });
    });

    test('should handle response with corrupted data', async () => {
      generateTravelPlan.mockResolvedValue({
        itinerary: [
          { day: null, plan: undefined },
          { day: "invalid", plan: "not an array" }
        ]
      });
      
      render(<CreateTrip />);
      await fillForm();
      
      fireEvent.click(screen.getByText('✨ Generate My Trip'));
      
      // يجب أن يتعامل مع البيانات التالفة بشكل أنيق
      await waitFor(() => {
        expect(generateTravelPlan).toHaveBeenCalled();
      });
    });
  });

  describe('Rate Limiting and API Quotas', () => {
    test('should handle API rate limit exceeded', async () => {
      generateTravelPlan.mockRejectedValue({
        status: 429,
        message: 'Rate limit exceeded'
      });
      
      render(<CreateTrip />);
      await fillForm();
      
      fireEvent.click(screen.getByText('✨ Generate My Trip'));
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Trip generation failed');
      });
    });

    test('should handle API quota exceeded', async () => {
      generateTravelPlan.mockRejectedValue({
        status: 403,
        message: 'Quota exceeded'
      });
      
      render(<CreateTrip />);
      await fillForm();
      
      fireEvent.click(screen.getByText('✨ Generate My Trip'));
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Trip generation failed');
      });
    });
  });

  describe('Data Persistence Edge Cases', () => {
    test('should handle localStorage full error', async () => {
      generateTravelPlan.mockResolvedValue({
        itinerary: [{ day: 1, plan: [] }]
      });
      
      // محاكاة امتلاء localStorage
      localStorage.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      
      render(<CreateTrip />);
      await fillForm();
      
      fireEvent.click(screen.getByText('✨ Generate My Trip'));
      
      await waitFor(() => {
        expect(generateTravelPlan).toHaveBeenCalled();
      });
      
      // يجب أن يستمر العمل حتى لو فشل localStorage
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('🎉 Trip saved successfully!');
      });
    });

    test('should handle concurrent save operations', async () => {
      generateTravelPlan.mockResolvedValue({
        itinerary: [{ day: 1, plan: [] }]
      });
      
      render(<CreateTrip />);
      await fillForm();
      
      const button = screen.getByText('✨ Generate My Trip');
      
      // محاولة النقر عدة مرات بسرعة
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      
      // يجب استدعاء API مرة واحدة فقط
      await waitFor(() => {
        expect(generateTravelPlan).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Authentication Edge Cases', () => {
    test('should handle expired Google token', async () => {
      localStorage.getItem.mockReturnValue(null); // لا يوجد مستخدم
      
      // محاكاة token منتهي الصلاحية
      global.fetch.mockRejectedValueOnce({
        status: 401,
        message: 'Token expired'
      });
      
      render(<CreateTrip />);
      await fillForm();
      
      fireEvent.click(screen.getByText('✨ Generate My Trip'));
      
      // يجب ظهور نافذة تسجيل الدخول
      await waitFor(() => {
        expect(screen.getByText('Sign In With Google')).toBeInTheDocument();
      });
    });

    test('should handle invalid user session', async () => {
      // محاكاة بيانات مستخدم تالفة
      localStorage.getItem.mockReturnValue('invalid json');
      
      render(<CreateTrip />);
      await fillForm();
      
      fireEvent.click(screen.getByText('✨ Generate My Trip'));
      
      // يجب طلب تسجيل الدخول مرة أخرى
      await waitFor(() => {
        expect(screen.getByText('Sign In With Google')).toBeInTheDocument();
      });
    });
  });

  // دالة مساعدة لملء النموذج
  async function fillForm() {
    const placesInput = screen.getByTestId('places-input');
    fireEvent.change(placesInput, {