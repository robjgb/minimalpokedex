// PokemonList.jsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import SkeletonLoader from './SkeletalLoader';
import { useParams } from 'react-router-dom';
import AppContext from '../AppContext';
import typeColors from './utilities/typeColors';

function PokemonList({ startingOffset, maxOffset }) {
  const {
    generation,
    selectedTypes,
    navigate,
    setGeneration,
    selectedPokemon,
    setSelectedPokemon,
    getGenIdFromPokeId,
    totalPokemon
  } = useContext(AppContext);
  const [offset, setOffset] = useState(startingOffset);
  const [totalOffset, setTotalOffset] = useState(maxOffset);
  const [pokemonData, setPokemonData] = useState([]);
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);
  const selectedPokemonRef = useRef(null);
  const { pokeId } = useParams();
  const getTypeIconURL = (type) => `https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${type}.svg`;

  useEffect(() => {
    if (pokeId) {
      const selectedPokemon = pokemonData.find(pokemon => pokemon.url.split('/')[6] === pokeId);

      if (selectedPokemon) {
        setSelectedPokemon(selectedPokemon);
      } else {
        let calculatedLimit = Math.ceil((parseInt(pokeId, 10) - startingOffset) / 20) * 20;
        if (startingOffset + calculatedLimit > totalOffset) {
          calculatedLimit = totalOffset - startingOffset
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

  useEffect(() => {
    if (selectedTypes.length > 0) {
      setPokemonData([]); // Clear previous data 
      loadMoreFilteredPokemon()
    } else {
      // If no types are selected, reset the data
      setPokemonData([]); // Clear previous data 
      setTotalOffset(maxOffset);
      setOffset(startingOffset)
    }
  }, [selectedTypes]); // Only trigger the effect when selectedTypes changes

  useEffect(() => {
    if (offset === startingOffset) {
      loadMorePokemon(); // Fetch reset data  
    }
  }, [offset]);

  const fetchPokemonDataWithTypes = async (pokemonData) => {
    try {
      const pokemonDataWithTypes = await Promise.all(
        pokemonData.map(async (pokemon) => {
          const response = await fetch(pokemon.url);
          const data = await response.json();
          return {
            ...pokemon,
            types: data.types?.map((type) => type.type.name) ?? [],
          };
        })
      );
      return pokemonDataWithTypes;
    } catch (error) {
      console.error('Error fetching Pokémon data with types:', error);
      return pokemonData;
    }
  };

  const loadMoreFilteredPokemon = async () => {
    setPokemonData([]); // Clear previous data 
    setLoading(true);
    try {
      const limit = totalOffset - startingOffset;
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/?offset=${startingOffset}&limit=${limit}`);
      if (!response.ok) {
        throw new Error("Failed to fetch Pokémon");
      }
      const data = await response.json();
      const filteredPokemon = await filterPokemonByTypes(data.results, selectedTypes);
      const filteredPokemonWithTypes = await fetchPokemonDataWithTypes(filteredPokemon);
      setPokemonData(filteredPokemonWithTypes);
      setOffset(maxOffset)
    } catch (error) {
      console.error('Error fetching Pokémon:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPokemonFromID = async (dynamicLimit) => {
    if (selectedTypes.length > 0) return;

    setLoading(true);
    try {
      console.log('fetching from ID')
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/?offset=${startingOffset}&limit=${dynamicLimit}`);
      if (!response.ok) {
        throw new Error("Failed to fetch Pokemon");
      }
      const data = await response.json();
      const pokemonWithTypes = await fetchPokemonDataWithTypes(data.results);
      setPokemonData(pokemonWithTypes);
      setOffset(startingOffset + dynamicLimit);
    } catch (error) {
      console.error('Error fetching Pokémon:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMorePokemon = async () => {
    if (offset >= totalOffset) return; // Stop loading if reached max

    setLoading(true);
    try {
      const remainder = totalOffset - offset;
      const limit = remainder >= 20 ? 20 : remainder;
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/?offset=${offset}&limit=${limit}`);
      if (!response.ok) {
        throw new Error("Failed to fetch Pokemon");
      }
      const data = await response.json();
      let newPokemonData = data.results;
      const newPokemonDataWithTypes = await fetchPokemonDataWithTypes(newPokemonData);
      setPokemonData([...pokemonData, ...newPokemonDataWithTypes]);

      setOffset(offset + limit);
    } catch (error) {
      console.error('Error fetching Pokémon:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPokemonByTypes = async (pokemon, types) => {
    const typePokemonLists = await Promise.all(
      types.map(async (type) => {
        const response = await fetch(`https://pokeapi.co/api/v2/type/${type}`);
        const data = await response.json();
        return data.pokemon.map((p) => p.pokemon.name);
      })
    );

    const filteredPokemon = pokemon.filter((p) => {
      const pokemonName = p.name;
      return typePokemonLists.every((list) => list.includes(pokemonName));
    });

    return filteredPokemon;
  };

  function formatPokemonId(id, totalPokemon) {
    const maxLength = String(totalPokemon).length;
    return `#${id.toString().padStart(maxLength, '0')}`;
  }

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
    if (listRef.current && selectedTypes.length === 0) {
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
    <div className="w-full md:w-2/5 overflow-y-auto" ref={listRef}>
      <ul className="m-2">
        {pokemonData.map(pokemon => {
          const id = pokemon.url.split('/')[6];
          const name = pokemon.name;
          const types = pokemon.types || []; // Use an empty array as default if types are not available
          return (
            <li key={id}
              onClick={() => {
                setSelectedPokemon(pokemon);
                const genId = getGenIdFromPokeId(id);
                setGeneration(genId);
                navigate(`/gen/${genId}/${id}`);
              }}
              ref={selectedPokemon === pokemon ? selectedPokemonRef : null}
              className="cursor-pointer relative mb-2">

              <span className="absolute inset-0 border-2 border-dashed border-gray-100 rounded-lg"></span>

              <div className={`relative ${selectedPokemon === pokemon ? " bg-gray-100" : "bg-white"} border border-gray-200 rounded-lg transition-transform duration-200 group hover:-translate-x-2 hover:-translate-y-2`}>

                <div className="flex items-center p-4">
                  <img
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`}
                    alt={name}
                    className="w-24 h-24 mr-4"
                  />

                  <h3 className="text-lg font-medium text-gray-800">
                    <span className="me-4 text-gray-500">{formatPokemonId(id, totalPokemon)}</span>
                    {name}
                  </h3>

                  {pokemon.types && pokemon.types.length > 0 && (
                    <div className="flex flex-col ml-auto">
                      {pokemon.types.map((type) => (
                        <div
                          key={type}
                          className="w-8 h-8 mb-2 last:mb-0 rounded-full"
                          style={{ backgroundColor: typeColors[type] }}
                        >
                          <img src={getTypeIconURL(type)} alt={type} className="w-full h-full p-2" />
                        </div>
                      ))}
                    </div>
                  )}

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