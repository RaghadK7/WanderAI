import React from 'react'

function UserTripCardItem({ trip }) {
  return (
    <div className="border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow bg-white">
      {/* صورة الرحلة */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src='/image.png' 
          alt="Trip Image"
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* محتوى الكارت */}
      <div className="p-4">
        <h3 className="font-bold text-xl mb-2 text-gray-800">
          {trip.userSelection?.location?.label || 'Unknown Destination'}
        </h3>
        
        <div className="text-gray-600 text-sm space-y-1">
          <p>📅 {trip.userSelection?.noOfDays || 'N/A'} days</p>
          <p>💰 {trip.userSelection?.budget || 'N/A'}</p>
          <p>👥 {trip.userSelection?.traveler || 'N/A'}</p>
        </div>
        
        {/* زر عرض التفاصيل */}
        <button 
          className="mt-4 w-full bg-gradient-to-r from-blue-400 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-blue-500 hover:to-blue-700 transition-all"
          onClick={() => window.location.href = `/view-trip/${trip.id}`}
        >
          View Details
        </button>
      </div>
    </div>
  )
}

export default UserTripCardItem