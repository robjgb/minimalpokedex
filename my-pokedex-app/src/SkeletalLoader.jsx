import React from 'react'

export default function SkeletonLoader() {
    return (
      <div className="w-1/3 p-4">
       {[...Array(4)].map((_, i) => (
         <div key={i} className="w-full p-2">
           <div className="skeleton w-64 h-32 bg-gray-300 rounded-lg">
           </div>
         </div>
       ))}
      </div>
    ) 
  }