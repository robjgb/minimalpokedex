import React from 'react'

export default function SkeletonLoader() {
    return (
      <>
       {[...Array(4)].map((_, i) => (
         <div key={i} className="w-full p-2">
           <div className="skeleton w-full h-32 bg-gray-300 rounded-lg">
           </div>
         </div>
       ))}
      </>
    ) 
  }