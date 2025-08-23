import React, { useEffect } from 'react'


function MyTrips() {

     useEffect(() => {
      GetUserTrips();

  }, [])

  const GetUserTrips=()=>{ 
   const user=localStorage.getItem('user');
   
   if(!user)
    {
      window.location.href = '/';
    }
   
  }
 
  return (
    <div>MyTrips</div>
  )
}

export default MyTrips