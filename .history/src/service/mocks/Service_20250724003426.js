// src/__mocks__/services.js

// Mock لخدمة AI
export const generateTravelPlan = jest.fn();

// Mock لخدمة Firebase
export const mockFirestore = {
  doc: jest.fn(() => ({
    set: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  })),
  collection: jest.fn(() => ({
    add: jest.fn(),
    doc: jest.fn()
  }))
};

// Mock لـ Google OAuth
export const useGoogleLogin = jest.fn();

// Mock لـ Google Places
export const GooglePlacesAutocomplete = jest.fn(({ selectProps }) => {
  return (
    <div data-testid="google-places-autocomplete">
      <input
        data-testid="places-input"
        placeholder={selectProps.placeholder}
        onChange={(e) => selectProps.onChange({ label: e.target.value })}
      />
    </div>
  );
});

// Mock data للاختبارات
export const mockTripData = {
  itinerary: [
    {
      day: 1,
      plan: [
        {
          placeName: "Louvre Museum",
          placeDetails: "Famous art museum",
          placeImageUrl: "https://example.com/louvre.jpg",
          geoCoordinates: "48.8606,2.3376",
          ticketPricing: "€17",
          timeTravel: "2-3 hours"
        }
      ]
    },
    {
      day: 2,
      plan: [
        {
          placeName: "Eiffel Tower",
          placeDetails: "Iconic tower",
          placeImageUrl: "https://example.com/eiffel.jpg",
          geoCoordinates: "48.8584,2.2945",
          ticketPricing: "€29",
          timeTravel: "1-2 hours"
        }
      ]
    }
  ],
  hotels: [
    {
      hotelName: "Hotel Paris",
      hotelAddress: "123 Paris Street",
      price: "€150/night",
      hotelImageUrl: "https://example.com/hotel.jpg",
      geoCoordinates: "48.8566,2.3522",
      rating: 4.5,
      descriptions: "Luxury hotel in Paris"
    }
  ]
};

export const mockUserProfile = {
  email: "test@example.com",
  name: "Test User",
  picture: "https://example.com/avatar.jpg",
  id: "123456789"
};