// PokemonList.jsx
import React, { useState, useEffect, useRef } from 'react';
import SkeletonLoader from './SkeletalLoader';
import { useParams } from 'react-router-dom';

function PokemonList({ startingOffset, maxOffset, navigate, generation }) {
  const [offset, setOffset] = useState(startingOffset);
  const [pokemonData, setPokemonData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const listRef = useRef(null);
  const selectedPokemonRef = useRef(null);
  const { pokeId } = useParams();

  useEffect(() => {
    if (pokeId) {
      const selectedPokemon = pokemonData.find(pokemon => pokemon.url.split('/')[6] === pokeId);
  
      if (selectedPokemon) {
        setSelectedPokemon(selectedPokemon);
      } else {
        let calculatedLimit = Math.ceil((parseInt(pokeId, 10) - startingOffset) / 20)  * 20;
        if (calculatedLimit > maxOffset){
          calculatedLimit = maxOffset
        }
        fetchPokemonFromID(calculatedLimit);
      }
    }
  }, [pokeId, pokemonData]);

  useEffect(() => {
    setOffset(startingOffset); // Reset offset only when startingOffset changes
    setPokemonData([]); // Clear previous data when generation changes
    loadMorePokemon(); // Fetch initial data
  }, [startingOffset]); // Dependency on startingOffset

  const fetchPokemonFromID = async (dynamicLimit) => {
    setLoading(true);
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/?offset=${startingOffset}&limit=${dynamicLimit}`);
      if (!response.ok) {
        throw new Error("Failed to fetch Pokemon");
      }
      const data = await response.json();
      setPokemonData(data.results);
      setOffset(startingOffset + dynamicLimit);
    } catch (error) {
      console.error('Error fetching Pokémon:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMorePokemon = async () => {
    if (offset >= maxOffset) return; // Stop loading if reached max

    setLoading(true);
    try {
      const remainder = maxOffset - offset;
      const limit = remainder >= 20 ? 20 : remainder;
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/?offset=${offset}&limit=${limit}`);
      if (!response.ok) {
        throw new Error("Failed to fetch Pokemon");
      }
      const data = await response.json();
      setPokemonData([...pokemonData, ...data.results]);
      setOffset(prevOffset => prevOffset + limit);
    } catch (error) {
      console.error('Error fetching Pokémon:', error);
    } finally {
      setLoading(false);
    }
  };

  const debounce = (func, delay) => {
    let timeoutId;
    return function () {
      const context = this;
      const args = arguments;
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(context, args);
      }, delay);
    };
  };

  const handleScroll = () => {
    if (listRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = listRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 5 && !loading) {
        loadMorePokemon();
      }
    }
  };

  const debouncedHandleScroll = debounce(handleScroll, 200); // Debounce with a delay of 200 milliseconds


  useEffect(() => {
    if (listRef.current) {
      listRef.current.addEventListener('scroll', debouncedHandleScroll);
    }
    return () => {
      if (listRef.current) {
        listRef.current.removeEventListener('scroll', debouncedHandleScroll);
      }
    };
  }, [debouncedHandleScroll, listRef]);

  const scrollToSelectedPokemon = () => {
    if (selectedPokemonRef.current) {
      selectedPokemonRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (selectedPokemon) {
      scrollToSelectedPokemon();
    }
  }, [selectedPokemon]);

  return (
    <div className="w-1/3 overflow-y-auto" ref={listRef}>
      <ul className="p-2">
        {pokemonData.map(pokemon => {
          const id = pokemon.url.split('/')[6];
          const name = pokemon.name;

          return (
            <li key={id}
              onClick={() => {
                setSelectedPokemon(pokemon);
                navigate(`/gen/${generation}/${id}`); // Update the URL
              }}
              ref={selectedPokemon === pokemon ? selectedPokemonRef : null}
              className="cursor-pointer relative">

              <span className="absolute inset-0 border-2 border-dashed border-gray-100 rounded-lg"></span>

              <div className="relative bg-white border-2 border-gray-100 rounded-lg shadow-lg transition-transform duration-200 group hover:-translate-x-2 hover:-translate-y-2">

                <div className="flex items-center p-4 pb-0">
                  <img
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`}
                    alt={name}
                    className="w-16 h-16 mr-4"
                  />

                  <div>
                    <h3 className="text-lg font-medium text-gray-800">{name}</h3>
                    <p className="mt-1 text-gray-500">#{id}</p>
                  </div>
                </div>

                <div className="p-4 opacity-0 group-hover:opacity-100 transition duration-200">
                  <p className="font-bold text-sm text-gray-700">learn more</p>
                </div>

              </div>
            </li>
          );
        })}
      </ul>

      {loading && <SkeletonLoader />}
    </div>
  );
}


export default PokemonList;