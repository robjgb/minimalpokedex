export default function DetailsLoader() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4">
      <div className='flex flex-col items-center md:items-start col-span-6 md:col-span-2 row-span-2'>

        <div className="flex mb-4">
          <div className="skeleton w-32 h-6 md:mr-4 bg-gray-300" />
        </div>
        <div className="skeleton w-32 h-32 bg-gray-300" />
      </div>


      <div className="flow-root mt-4">
        <dl className="-my-3 divide-y divide-gray-100">
          <div className="grid grid-cols-1 gap-4 py-3 sm:grid-cols-3">
            <dt className="skeleton w-16 h-6 bg-gray-300" />
            <dd className="skeleton w-48 h-6 bg-gray-300 col-span-2" />
          </div>
          <div className="grid grid-cols-1 gap-4 py-3 sm:grid-cols-3">
            <dt className="skeleton w-16 h-6 bg-gray-300" />
            <dd className="skeleton w-16 h-6 bg-gray-300 col-span-2" />
          </div>
          <div className="grid grid-cols-1 gap-4 py-3 sm:grid-cols-3">
            <dt className="skeleton w-16 h-6 bg-gray-300" />
            <dd className="skeleton w-16 h-6 bg-gray-300 col-span-2" />
          </div>
          <div className="grid grid-cols-1 gap-4 py-3 sm:grid-cols-3">
            <dt className="skeleton w-16 h-6 bg-gray-300" />
            <dd className="skeleton w-32 h-6 bg-gray-300 col-span-2" />
          </div>
        </dl>
      </div>
    </div>
  )
}