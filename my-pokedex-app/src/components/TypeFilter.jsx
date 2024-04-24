import React, { useState, useEffect } from 'react';
import typeColors from './utilities/typeColors';

function TypeFilter({ onFilter }) {
  const [types, setTypes] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchTypes();
  }, []);

  const getTypeIconURL = (type) => `https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${type}.svg`;

  const fetchTypes = async () => {
    try {
      const response = await fetch('https://pokeapi.co/api/v2/type');
      if (!response.ok) {
        throw new Error('Failed to fetch Pokemon types');
      }
      const data = await response.json();
      const officialTypes = data.results.filter(type => !["shadow", "unknown"].includes(type.name));
      setTypes(officialTypes);
    } catch (error) {
      console.error('Error fetching Pokemon types:', error);
    }
  };

  const handleTypeChange = (e) => {
    const selectedType = e.target.value;
    if (selectedTypes.includes(selectedType)) {
      setSelectedTypes(selectedTypes.filter((type) => type !== selectedType));
    } else if (selectedTypes.length < 2) {
      setSelectedTypes([...selectedTypes, selectedType]);
    }
  };

  useEffect(() => {
    onFilter(selectedTypes);
  }, [selectedTypes, onFilter]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center overflow-hidden rounded-md border bg-white px-4 py-2 text-sm/none text-gray-600 hover:bg-gray-50 hover:text-gray-700"
      >
        {selectedTypes.length === 0 ? 'select types' : selectedTypes.join(', ')}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ps-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-10 mt-2 w-80 rounded-md border border-gray-200 bg-white" role="menu">
          <div className="p-2 grid grid-cols-2 gap-2">
            {types.map((type) => (
              <label key={type.name} className="flex flex-row items-center justify-start rounded-lg px-4 py-2 text-sm w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700" role="menuitem">
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(type.name)}
                  onChange={handleTypeChange}
                  value={type.name}
                  className="mr-2 accent-black"
                />

                <div className='flex flex-row'>
                  <div
                    key={type}
                    className="w-5 h-5 mb-2 last:mb-0 rounded-full mr-2"
                    style={{ backgroundColor: typeColors[type.name] }}
                  >
                    <img src={getTypeIconURL(type.name)} alt={type.name} className="w-full h-full p-1" />
                  </div>
                  {type.name}
                </div>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TypeFilter;