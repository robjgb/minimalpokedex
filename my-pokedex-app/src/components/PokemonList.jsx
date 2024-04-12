// PokemonList.jsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import SkeletonLoader from './SkeletalLoader';
import { useParams } from 'react-router-dom';
import AppContext from '../AppContext';

function PokemonList({ startingOffset, maxOffset}) {
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

  useEffect(() => {
    if (pokeId) {
      const selectedPokemon = pokemonData.find(pokemon => pokemon.url.split('/')[6] === pokeId);
  
      if (selectedPokemon) {
        setSelectedPokemon(selectedPokemon);
      } else {
        let calculatedLimit = Math.ceil((parseInt(pokeId, 10) - startingOffset) / 20)  * 20;
        if (startingOffset + calculatedLimit > totalOffset){
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
      if (generation !== 'all'){
        navigate(`/gen/${generation}`); // Update the URL
      }
      loadMoreFilteredPokemon()
    } else {
      // If no types are selected, reset the data
      setPokemonData([]); // Clear previous data 
      setTotalOffset(maxOffset); 
      setOffset(startingOffset)
    }
  }, [selectedTypes]); // Only trigger the effect when selectedTypes changes

  useEffect(() => {
    if(offset === startingOffset) {
      loadMorePokemon(); // Fetch reset data  
    }
  }, [offset]); 

  const loadMoreFilteredPokemon = async () => {
    setLoading(true);
    try {
      const limit = totalOffset - startingOffset;
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/?offset=${startingOffset}&limit=${limit}`);
      if (!response.ok) {
        throw new Error("Failed to fetch Pokémon");
      }
      const data = await response.json();
      filterPokemonByTypes(data.results, selectedTypes).then((filteredPokemon) => {
        setPokemonData(filteredPokemon);
      });
      setOffset(maxOffset)
    } catch (error) {
      console.error('Error fetching Pokémon:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPokemonFromID = async (dynamicLimit) => {
    setLoading(true);
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/?offset=${startingOffset}&limit=${dynamicLimit}`);
      if (!response.ok) {
        throw new Error("Failed to fetch Pokemon");
      }
      const data = await response.json();
      let filteredPokemon = data.results;

      setPokemonData(filteredPokemon);
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
  
      setPokemonData([...pokemonData, ...newPokemonData]);
      setOffset(prevOffset => prevOffset + limit);

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
    <div className="w-full md:w-2/5 overflow-y-auto" ref={listRef}>
      <ul className="m-2">
        {pokemonData.map(pokemon => {
          const id = pokemon.url.split('/')[6];
          const name = pokemon.name;

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

              <div className={`relative ${ selectedPokemon === pokemon ? " bg-gray-100": "bg-white"} border border-gray-200 rounded-lg transition-transform duration-200 group hover:-translate-x-2 hover:-translate-y-2`}>

                <div className="flex items-center p-4">
                  <img
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`}
                    alt={name}
                    className="w-24 h-24 mr-4"
                  />

                  <div>
                    <h3 className="text-lg font-medium text-gray-800">
                      <span className="me-4 text-gray-500">{formatPokemonId(id, totalPokemon)}</span>
                        {name}
                    </h3>
                    
                  </div>
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