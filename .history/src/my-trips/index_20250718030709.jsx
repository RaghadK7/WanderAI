import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect } from 'react'
import { db } from '@/service/firebaseConfig';

function MyTrips() {

  useEffect(() => {
    GetUserTrips();
  }, [])

  const GetUserTrips = async () => { 
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user) {
      window.location.href = '/';
      return;
    }

    try {
      const parsedUser = JSON.parse(user);
      const q = query(collection(db, "AITrips"), where("userEmail", "==", parsedUser.email));
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach((doc) => {
        console.log(doc.id, " => ", doc.data());
      });
    } catch (error) {
      console.error("Error getting trips:", error);
    }
  }
 
  return (
    <div>MyTrips</div>
  )
}

export default MyTrips