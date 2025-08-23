import React, { useEffect, useState } from 'react'

function UserTripCardItem({ trip }) {
  const [photoUrl, setPhotoUrl] = useState();
  
  useEffect(() => {
    // صورة عشوائية جميلة حسب الوجهة
    const destination = trip.userSelection?.location?.label || 'travel';
    const unsplashUrl = `https://source.unsplash.com/800x600/?${destination},travel,vacation`;
    setPhotoUrl(unsplashUrl);
  }, [trip]);

  return (
    <div 
      className="group bg-white border border-sky-100 rounded-2xl p-5 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 cursor-pointer overflow-hidden"
      onClick={() => window.location.href = `/view-trip/${trip.id}`}
    >
      <div className="flex flex-col gap-4">
        {/* صورة الرحلة */}
        <div className="relative overflow-hidden rounded-xl">
          <img
            src={photoUrl || "https://via.placeholder.com/400x200/e0f2fe/0891b2?text=Trip+Image"}
            alt="Trip Image"
            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/400x200/e0f2fe/0891b2?text=Trip+Image";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        
        {/* معلومات الرحلة */}
        <div className="space-y-3">
          <h3 className="font-bold text-xl text-gray-800 group-hover:text-sky-700 transition-colors leading-tight">
            {trip.userSelection?.location?.label || 'Unknown Destination'}
          </h3>
          
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className='flex items-center gap-1 px-2 py-1 bg-sky-50 rounded-full'>
              <span className="text-sky-500">📅</span>
              <span className='font-medium text-sky-700'>
                {trip.userSelection?.noOfDays || 'N/A'} days
              </span>
            </div>
            
            <div className='flex items-center gap-1 px-2 py-1 bg-green-50 rounded-full'>
              <span className="text-green-500">💰</span>
              <span className='font-medium text-green-700 text-xs'>
                {trip.userSelection?.budget || 'N/A'}
              </span>
            </div>
            
            <div className='flex items-center gap-1 px-2 py-1 bg-purple-50 rounded-full'>
              <span className="text-purple-500">👥</span>
              <span className='font-medium text-purple-700 text-xs'>
                {trip.userSelection?.traveler || 'N/A'}
              </span>
            </div>
          </div>
          
          {/* زر عرض التفاصيل */}
          <button className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg">
            View Trip Details
          </button>
        </div>
      </div>
    </div>
  )
}

export default UserTripCardItem