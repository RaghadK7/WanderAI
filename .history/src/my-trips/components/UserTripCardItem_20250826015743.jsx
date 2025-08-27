import React, { useEffect, useState } from 'react'

function UserTripCardItem({ trip }) {
  const [photoUrl, setPhotoUrl] = useState();
  
  useEffect(() => {
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
        {/* Trip Pic*/}
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
        
        
      </div>
    </div>
  )
}

export default UserTripCardItem