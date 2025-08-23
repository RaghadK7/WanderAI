import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react'
import { db } from '@/service/firebaseConfig';
import { GetPlaceDetails } from '@/service/GlobalApi';

const PHOTO_REF_URL =
  'https://places.googleapis.com/v1/{NAME}/media?maxHeightPx=1200&maxWidthPx=1200&key=' +
  import.meta.env.VITE_GOOGLE_PLACE_API_KEY;

function MyTrips() {
  const [userTrips, setUserTrips] = useState([]);

  useEffect(() => {
    GetUserTrips();
  }, [])

  const GetUserTrips = async () => { 
    const userData = localStorage.getItem('user');
    
    if (!userData) {
      window.location.href = '/';
      return;
    }

    try {
      const user = JSON.parse(userData);
      setUserTrips([]); // Reset trips
      
      const q = query(collection(db, "AITrips"), where("userEmail", "==", user.email));
      const querySnapshot = await getDocs(q);
      
      const trips = [];
      querySnapshot.forEach((doc) => {
        console.log(doc.id, " => ", doc.data());
        // نضيف الـ id من Firebase للبيانات
        trips.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setUserTrips(trips);
      
    } catch (error) {
      console.error("Error getting trips:", error);
    }
  }

  // كارت الرحلة الجديد مع الصور الحقيقية
  const UserTripCardItem = ({ trip }) => {
    const [photoUrl, setPhotoUrl] = useState();
    
    useEffect(() => {
      if (trip?.userSelection?.location?.label) {
        GetPlacePhoto();
      }
    }, [trip]);

    const GetPlacePhoto = async () => {
      try {
        const data = { textQuery: trip.userSelection.location.label };
        const result = await GetPlaceDetails(data);
        const photos = result?.data?.places?.[0]?.photos;

        if (photos?.length > 0) {
          const photoName = photos[0].name;
          const url = PHOTO_REF_URL.replace('{NAME}', photoName);
          setPhotoUrl(url);
        } else {
          console.warn('No photos found for destination:', trip.userSelection.location.label);
        }
      } catch (error) {
        console.error('Error fetching place photo:', error);
      }
    };

    return (
      <div 
        className="group bg-white border border-sky-100 rounded-2xl p-5 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 cursor-pointer overflow-hidden"
        onClick={() => {
          console.log('Clicked trip with ID:', trip.id);
          window.location.href = `/view-trip/${trip.id}`;
        }}
      >
        <div className="flex flex-col gap-4">
          {/* صورة الرحلة */}
          <div className="relative overflow-hidden rounded-xl">
            <img
              src={photoUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop'}
              alt="Trip Image"
              className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
              onLoad={() => console.log('✅ Real image loaded for:', trip.userSelection?.location?.label)}
              onError={(e) => {
                console.log('❌ Image failed, using fallback');
                e.target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop';
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
  };
 
  return (
    <div className='p-10 md:px-20 lg:px-36'>
      
      <div className="text-center mb-10">
        <h2 className='font-bold text-4xl text-cyan-500'>
          My Trips
        </h2>
      </div>
      
      {userTrips.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-6">🧳</div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-3">No trips yet</h3>
          <p className="text-gray-600 mb-8">Start planning your dream vacation today!</p>
          <button 
            onClick={() => window.location.href = '/create-trip'}
            className="bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105"
          >
            Create Your First Trip
          </button>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {userTrips.map((trip, index) => (
            <UserTripCardItem key={index} trip={trip} />
          ))}
        </div>
      )}
    </div>
  )
}

export default MyTrips