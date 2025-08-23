import React from 'react'

function UserTripCardItem({ trip }) {
  return (
    <div>
      {/* جربي صورة من الإنترنت أولاً */}
      <img 
        src='https://picsum.photos/400/300'
        alt="Trip Image"
        style={{ width: '100%', height: '200px', objectFit: 'cover' }}
        onLoad={() => console.log('✅ Online image loaded successfully')}
        onError={(e) => {
          console.log('❌ Even online image failed:', e.target.src);
        }}
      />
      
      <p>Component is working! Trip: {trip?.userSelection?.location?.label}</p>
    </div>
  )
}

export default UserTripCardItem