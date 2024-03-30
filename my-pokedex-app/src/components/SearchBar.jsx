import React, { useState, useEffect, useRef, useContext } from 'react';
import AppContext from '../AppContext';

function SearchBar({ totalPokemon }) {
  const {
    navigate, 
    setGeneration,
    getGenIdFromPokeId
  } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [pokemonResults, setPokemonResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);
  

  useEffect(() => {
    // Fetch the list of all Pokemon when the component mounts
    fetch(`https://pokeapi.co/api/v2/pokemon-species/?limit=${totalPokemon}&offset=0`)
      .then((response) => response.json())
      .then((data) => {
        setPokemonResults(data.results);
      })
      .catch((error) => {
        console.error('Error fetching Pokemon:', error);
      });
  }, [totalPokemon]);

  const handleSearch = (event) => {
    const term = event.target.value;
    setSearchTerm(term);
    setShowDropdown(term.trim() !== '');
    setSelectedIndex(-1);
  };

  const navigateToPokemon = (id) => {
    const genId = getGenIdFromPokeId(id);
    setGeneration(genId);
    navigate(`/gen/${genId}/${id}`);
  }

  const handleDropdownClick = (pokemon) => {
    // Extract the ID from the URL
    const id = parseInt(pokemon.url.split('/')[6]);

    // Navigate to the corresponding Pokemon details page
    navigateToPokemon(id);
    setSearchTerm(''); // Clear the search term after navigation
    setSelectedIndex(-1); // Reset the selected index
    setShowDropdown(false); // Hide the dropdown after selection
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (selectedIndex !== -1) {
      // Use the selected item from the dropdown
      handleDropdownClick(filteredResults[selectedIndex]);
    } else if (searchTerm.trim() !== '') {
      // Find the Pokemon with the matching name
      const pokemon = pokemonResults.find((item) =>
        item.name.toLowerCase() === searchTerm.toLowerCase()
      );
      if (pokemon) {
        // Extract the ID from the URL
        const id = parseInt(pokemon.url.split('/')[6]);
        // Navigate to the corresponding Pokemon details page
        navigateToPokemon(id);
        setSearchTerm(''); // Clear the search term after navigation
      } else {
        // Handle the case when no Pokemon is found
        console.log('Pokemon not found');
      }
    }

    setSelectedIndex(-1); // Reset the selected index
    setShowDropdown(false); // Hide the dropdown after submission
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((prevIndex) => {
        const newIndex = prevIndex + 1;
        if (newIndex >= filteredResults.length) {
          return 0;
        }
        return newIndex;
      });
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex((prevIndex) => {
        const newIndex = prevIndex - 1;
        if (newIndex < 0) {
          return filteredResults.length - 1;
        }
        return newIndex;
      });
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (selectedIndex !== -1) {
        handleDropdownClick(filteredResults[selectedIndex]);
      } else {
        handleSubmit(event);
      }
    }
  };

  const handleFocus = () => {
    setShowDropdown(searchTerm.trim() !== '');
  };

  const handleBlur = (event) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.relatedTarget)
    ) {
      setShowDropdown(false);
    }
  };

  const filteredResults = pokemonResults
    .filter((pokemon) =>
      pokemon.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Check if the search term is a prefix of the name
      const aPrefixMatch = a.name.toLowerCase().startsWith(searchTerm.toLowerCase());
      const bPrefixMatch = b.name.toLowerCase().startsWith(searchTerm.toLowerCase());

      // If both or neither have a prefix match, compare the lengths
      if (aPrefixMatch === bPrefixMatch) {
        return a.name.length - b.name.length;
      }

      // Otherwise, prioritize the one with the prefix match
      return bPrefixMatch - aPrefixMatch;
    })
    .slice(0, 5);

  return (
    <form onSubmit={handleSubmit} className="relative my-4">
      <label htmlFor="Search" className="sr-only">
        Search
      </label>

      <input
        type="text"
        id="Search"
        value={selectedIndex !== -1 ? filteredResults[selectedIndex].name : searchTerm}
        onChange={handleSearch}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        ref={searchInputRef}
        placeholder="Search for pokemon..."
        className="w-full rounded-md border border-gray-200 py-2.5 px-4 pe-10 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
      />

      {/* Display the dropdown if there are results and the user is searching */}
      {showDropdown && filteredResults.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute end-0 z-10 mt-2 w-full rounded-md border border-gray-100 bg-white shadow-lg"
        >
          <ul className="py-1">
            {filteredResults.map((pokemon, index) => (
              <div className="p-2">
                <li
                  key={pokemon.url}
                  className={`flex flex-row items-center rounded-lg px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 cursor-pointer ${index === selectedIndex ? 'bg-gray-50' : 'hover:bg-gray-50'
                    }`}
                  onMouseDown={() => {
                    handleDropdownClick(pokemon);
                  }}
                >
                  <img
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${ parseInt(pokemon.url.split('/')[6])}.png`}
                    alt={pokemon.name}
                    className="w-10 h-10 mr-4"
                  />
                  {pokemon.name}
                </li>
              </div>
            ))}
          </ul>
        </div>
      )}

      <span className="absolute inset-y-0 end-0 grid w-10 place-content-center">
        <button type="submit" className="text-gray-600 hover:text-gray-700">
          <span className="sr-only">Search</span>

          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </button>
      </span>
    </form>
  );
}

export default SearchBar;