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
 
  return (
    <div className='p-10 md:px-20 lg:px-36'>
      <h2 className='font-bold text-3xl'>My Trips</h2>
      
      {userTrips.length === 0 ? (
        <p>No trips found</p>
      ) : (
        <div>
          {userTrips.map((trip, index) => (
            <div key={index} className='p-4 border rounded mt-4'>
              <h3>{trip.userSelection?.location?.label}</h3>
              <p>{trip.userSelection?.noOfDays} days</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyTrips