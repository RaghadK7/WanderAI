import React from 'react'

function UserTripCardItem({ trip }) {
  return (
    <div>
      <img 
        src='/p2.png'
        alt="Trip Image"
        style={{ width: '100%', height: 'auto' }}
        onLoad={() => console.log('✅ Image loaded successfully')}
        onError={(e) => {
          console.log('❌ Image failed to load:', e.target.src);
          console.log('Trying fallback image...');
          e.target.src = '/image.png'; // جربي صورة أخرى
        }}
      />
      
      {/* للتجربة - أضيفي هالنص عشان نتأكد أن الـ component يشتغل */}
      <p>Component is working! Trip: {trip?.userSelection?.location?.label}</p>
    </div>
  )
}

export default UserTripCardItem