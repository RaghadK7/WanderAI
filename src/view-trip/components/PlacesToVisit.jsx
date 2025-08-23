import React from 'react'
import PlaceCardItem from './PlaceCardItem'

function PlacesToVisit({ trip }) {
  
  if (!trip?.tripData?.itinerary) {
    return (
      <div className='mt-5'>
        {/*Hotels */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white text-xl">📍</span>
          </div>
          <h2 className="font-bold text-2xl text-cyan-500">Places To Visit</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500">No itinerary data available</p>
        </div>
      </div>
    );
  }

  let itineraryArray = [];
  
  if (trip.tripData.itinerary.dailyPlans && Array.isArray(trip.tripData.itinerary.dailyPlans)) {
    itineraryArray = trip.tripData.itinerary.dailyPlans;
  }
  else if (Array.isArray(trip.tripData.itinerary)) {
    itineraryArray = trip.tripData.itinerary;
  }
  else {
    itineraryArray = Object.values(trip.tripData.itinerary);
  }

  if (itineraryArray.length === 0) {
    return (
      <div className='mt-5'>
   
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white text-xl">📍</span>
          </div>
          <h2 className="font-bold text-2xl text-cyan-500">Places To Visit</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500">No daily plans available</p>
        </div>
      </div>
    );
  }

  return (
    <div className='mt-5'>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
          <span className="text-white text-xl">📍</span>
        </div>
        <h2 className="font-bold text-2xl text-cyan-500">Places To Visit</h2>
      </div>
      
      <div className="space-y-8">
        {itineraryArray.map((item, index) => (
          <div 
            className='bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300'
            key={index}
          >
            {/* Day Header */}
            <div className="mb-6">
              <h2 className='font-bold text-2xl text-cyan-500 mb-2'>
                {item.day || `Day ${index + 1}`}
              </h2>
              <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
            </div>

            {/* Places Grid */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {item.plan && Array.isArray(item.plan) ? (
                item.plan.map((place, placeIndex) => (
                  <div 
                    className='bg-gray-50 rounded-lg p-4 min-h-[280px] flex flex-col'
                    key={placeIndex}
                  >
                    {/* Time Header */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <h3 className='font-semibold text-sm text-red-600 uppercase tracking-wide'>
                        {place.time || `Activity ${placeIndex + 1}`}
                      </h3>
                    </div>
                    
                    {/* Place Card */}
                    <div className="flex-1">
                      <PlaceCardItem place={place}/>
                    </div>
                  </div>
                ))
              ) : (
                <div className='col-span-2 bg-gray-50 rounded-lg p-8 min-h-[200px] flex items-center justify-center'>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl text-gray-400">📍</span>
                    </div>
                    <p className="text-gray-500 font-medium">No places data available for this day</p>
                    <p className="text-gray-400 text-sm mt-1">Check back later for updates</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PlacesToVisit