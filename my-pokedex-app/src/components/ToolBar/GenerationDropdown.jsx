import React, { useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import AppContext from '../../AppContext';

function GenerationDropdown() {
  const { genId } = useParams();
  const {
    generation,
    setGeneration,
    totalGenerations, 
    navigate
  } = useContext(AppContext);

  const [open, setOpen] = useState(false);

  const handleGenerationClick = (gen) => {
    setGeneration(gen);
    setOpen(false);

    if (gen === 'all') {
      navigate(`/`);
    } else {
      navigate(`/gen/${gen}`);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center overflow-hidden rounded-md border bg-white px-4 py-2 text-sm/none text-gray-600 hover:bg-gray-50 hover:text-gray-700 me-4"
      >
        {generation === 'all' ? 'all generations' : `generation ${generation}`}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ps-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-10 mt-2 w-34 rounded-md border border-gray-200 bg-white" role="menu">
          <div className="p-2">
            <button
              onClick={() => handleGenerationClick('all')}
              className={`block ${ generation === 'all' ? " bg-gray-100": "bg-white"} rounded-lg px-4 py-2 text-sm w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700`}
              role="menuitem"
            >
              all generations
            </button>
            {Array.from({ length: totalGenerations }, (_, index) => index + 1).map((gen) => (
              <button
                key={gen}
                onClick={() => handleGenerationClick(gen)}
                className={`block ${ gen === Number(genId)   ? " bg-gray-100": "bg-white"} rounded-lg px-4 py-2 text-sm w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700`}
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