import {collection, getDocs, query,where } from 'firebase/firestore';
import React, { useEffect } from 'react'
import { c } from 'vite/dist/node/types.d-aGj9QkWt';


function MyTrips() {

     useEffect(() => {
      GetUserTrips();

  }, [])

  const GetUserTrips= async()=>{ 
   const user=localStorage.getItem('user');
   
   if(!user)
    {
      window.location.href = '/';
    }

    const q=query(collection(db, "AITrips"), where("userEmail", "==", user?.email));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      console.log(doc.id, " => ", doc.data());
    });
   
  }
 
  return (
    <div>MyTrips</div>
  )
}

export default MyTrips