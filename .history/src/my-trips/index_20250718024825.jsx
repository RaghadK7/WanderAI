import React, { useEffect } from 'react'

function MyTrips() {

     useEffect(() => {
      GetUserTrips();

  }, [])

  const GetUserTrips=(()=>{ 
   const user=localStorage.getItem('user');

  },[])
 
  return (
    <div>MyTrips</div>
  )
}

export default MyTrips