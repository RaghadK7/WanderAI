import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react'
import { db } from '@/service/firebaseConfig';

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
        trips.push(doc.data());
      });
      
      setUserTrips(trips);
      
    } catch (error) {
      console.error("Error getting trips:", error);
    }
  }

  const UserTripCardItem = ({ trip }) => {
    return (
      
    );
  };
 
  return (
    <div className='p-10 md:px-20 lg:px-36'>
      <h2 className='font-bold text-3xl mb-6'>My Trips</h2>
      
      {userTrips.length === 0 ? (
        <p className='text-gray-500 text-center mt-10'>No trips found</p>
      ) : (
        <div>
          {userTrips.map((trip, index) => (
            <UserTripCardItem key={index} trip={trip} />
          ))}
        </div>
      )}
    </div>
  )
}

export default MyTrips