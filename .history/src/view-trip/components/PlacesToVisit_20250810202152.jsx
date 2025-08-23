import React from 'react';
import PlaceCardItem from './PlaceCardItem';

function PlacesToVisit({ trip }) {
  // Safe data check
  if (!trip?.tripData?.itinerary) {
    return (
      <div className='mt-5'>
        <Header />
        <div className="text-center py-8">
          <p className="text-gray-500">No itinerary data available</p>
        </div>
      </div>
    );
  }

  // Extract itinerary array from different possible data structures
  const getItineraryArray = () => {
    const itinerary = trip.tripData.itinerary;
    
    // Check for dailyPlans array
    if (itinerary.dailyPlans && Array.isArray(itinerary.dailyPlans)) {
      return itinerary.dailyPlans;
    }
    // Direct array
    if (Array.isArray(itinerary)) {
      return itinerary;
    }
    // Object to array conversion
    return Object.values(itinerary);
  };

  const itineraryArray = getItineraryArray();

  // Return empty state if no plans
  if (itineraryArray.length === 0) {
    return (
      <div className='mt-5'>
        <Header />
        <div className="text-center py-8">
          <p className="text-gray-500">No daily plans available</p>
        </div>
      </div>
    );
  }

  return (
    <div className='mt-5'>
      <Header />
      
      <div className="space-y-6">
        {itineraryArray.map((dayItem, dayIndex) => (
          <DaySection 
            key={dayIndex} 
            dayItem={dayItem} 
            dayIndex={dayIndex} 
          />
        ))}
      </div>
    </div>
  );
}

// Header component
const Header = () => (
  <div className="flex items-center gap-3 mb-6">
    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
      <span className="text-white text-xl">📍</span>
    </div>
    <h2 className="font-bold text-2xl text-cyan-500">Places To Visit</h2>
  </div>
);

// Day section component
const DaySection = ({ dayItem, dayIndex }) => (
  <div className='bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300'>
    {/* Day Header */}
    <div className="mb-6">
      <h2 className='font-bold text-2xl text-cyan-500 mb-2'>
        {dayItem.day || `Day ${dayIndex + 1}`}
      </h2>
      <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
    </div>

    {/* Places Grid - Equal Height Cards */}
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
      {dayItem.plan && Array.isArray(dayItem.plan) ? (
        dayItem.plan.map((place, placeIndex) => (
          <PlaceCard 
            key={placeIndex} 
            place={place} 
            placeIndex={placeIndex} 
          />
        ))
      ) : (
        <EmptyState />
      )}
    </div>
  </div>
);

// Individual place card wrapper with equal height
const PlaceCard = ({ place, placeIndex }) => (
  <div className='bg-gray-50 rounded-lg p-3 h-80 flex flex-col'>
    {/* Time Header - Fixed Height */}
    <div className="flex items-center gap-2 mb-3 h-6">
      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
      <h3 className='font-semibold text-sm text-red-600 uppercase tracking-wide'>
        {place.time || `Activity ${placeIndex + 1}`}
      </h3>
    </div>
    
    {/* Place Card - Fills remaining space */}
    <div className="flex-1">
      <PlaceCardItem place={place} />
    </div>
  </div>
);

// Empty state component
const EmptyState = () => (
  <div className='col-span-2 bg-gray-50 rounded-lg p-8 h-60 flex items-center justify-center'>
    <div className="text-center">
      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
        <span className="text-2xl text-gray-400">📍</span>
      </div>
      <p className="text-gray-500 font-medium">No places data available</p>
      <p className="text-gray-400 text-sm mt-1">Check back later for updates</p>
    </div>
  </div>
);

export default PlacesToVisit;