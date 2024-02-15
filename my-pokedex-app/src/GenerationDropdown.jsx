import React, { useState } from 'react';

function GenerationDropdown({ generation, setGeneration, maxOffset }) {
  const [open, setOpen] = useState(false);

  const handleGenerationClick = (gen) => {
    setGeneration(gen);
    setOpen(false);
  };

  return (
    <div className="relative px-4 pb-4">
      <div className="inline-flex items-center overflow-hidden rounded-md border bg-white">
        <button
          onClick={() => setOpen(!open)}
          className="border-e px-4 py-2 text-sm/none text-gray-600 hover:bg-gray-50 hover:text-gray-700"
        >
          generation {generation}
        </button>
        <button onClick={() => setOpen(!open)} className="h-full p-2 text-gray-600 hover:bg-gray-50 hover:text-gray-700" >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="absolute start-4 z-10 mt-2 w-36 rounded-md border border-gray-100 bg-white shadow-lg" role="menu">
          <div className="p-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((gen) => ( // Assuming 8 generations
              <button
                key={gen}
                onClick={() => handleGenerationClick(gen)}
                className="block rounded-lg px-4 py-2 text-sm w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                role="menuitem"
              >
                generation {gen}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default GenerationDropdown;