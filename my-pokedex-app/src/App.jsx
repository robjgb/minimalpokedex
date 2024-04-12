import React, { useState, useEffect, useMemo } from 'react';
import GenerationDropdown from './components/GenerationDropdown';
import PokemonList from './components/PokemonList';
import PokemonDetails from './components/PokemonDetails/PokemonDetails';
import SkeletonLoader from './components/SkeletalLoader';
import { useNavigate, useParams } from 'react-router-dom';
import SearchBar from './components/SearchBar';
import TypeFilter from './components/TypeFilter';
import PokeBall from './assets/pokeball.svg';
import AppContext from './AppContext';

function useGenerationOffsets() {
  const [offsets, setOffsets] = useState({});
  const [generationData, setGenerationData] = useState({});
  const [totalGenerations, setTotalGenerations] = useState(null);
  const [totalPokemon, setTotalPokemon] = useState(null);

  useEffect(() => {
    const fetchAllOffsets = async () => {
      const response = await fetch('https://pokeapi.co/api/v2/generation/');
      const data = await response.json();
      setTotalGenerations(data.count);

      const generationsToFetch = Array.from({ length: data.count }, (_, i) => i + 1);
      let cumulativeOffset = 0;
      const offsetData = [];

      for (const gen of generationsToFetch) {
        const response = await fetch(`https://pokeapi.co/api/v2/generation/${gen}`);
        const generationData = await response.json();

        const result = {
          generation: gen,
          startingOffset: cumulativeOffset,
          maxOffset: cumulativeOffset + generationData.pokemon_species.length,
          genData: generationData,
        };

        offsetData.push(result);
        cumulativeOffset = result.maxOffset;
      }
      setOffsets({
        ...offsetData.reduce((acc, data) => ({
          ...acc,
          [data.generation]: [data.startingOffset, data.maxOffset],
        }), {}),
        all: [0, cumulativeOffset],
      });

      setGenerationData(offsetData.reduce((acc, data) => ({
        ...acc,
        [data.generation]: [data.genData],
      }), {}),
      );
      setTotalPokemon(cumulativeOffset);
    };

    fetchAllOffsets();
  }, []);

  return [offsets, generationData, totalGenerations, totalPokemon];
}

function App() {
  const [generation, setGeneration] = useState(1);
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [offsets, generationData, totalGenerations, totalPokemon] = useGenerationOffsets();
  const generationOffsets = useMemo(() => offsets[generation] || [], [offsets, generation]);
  const { pokeId, genId } = useParams();
  const navigate = useNavigate();

  const [selectedTypes, setSelectedTypes] = useState([]);

  const handleTypeFilter = (types) => {
    setSelectedTypes(types);
  };

  useEffect(() => {
    if (totalPokemon && genId === generation) {
      if (pokeId && (pokeId < 1 || pokeId > totalPokemon || isNaN(Number(pokeId)))) {
        throw new Response("Invalid Pokemon ID", { status: 404, statusText: "Invalid Pokemon ID" });
      }
      else if (pokeId && (pokeId <= generationOffsets[0] || pokeId > generationOffsets[1])) {
        throw new Response("Pokemon ID out of range for the specified generation", { status: 404, statusText: "Pokemon ID out of range for the specified generation" });
      }
    }
  }, [pokeId, totalPokemon, genId, generation, generationOffsets]);

  useEffect(() => {
    if (totalGenerations) {
      if (genId && (genId < 1 || genId > totalGenerations || isNaN(Number(genId)))) {
        throw new Response("Invalid Generation ID", { status: 404, statusText: "Invalid Generation ID" });
      } else if (genId === undefined) {
        setGeneration('all');
      } else {
        setGeneration(genId);
      }
    }
  }, [genId, totalGenerations]);

  function getGenIdFromPokeId(pokeId) {
    if (pokeId && offsets) {
      return findKey(offsets, pokeId);
    }
    return null;
  }

  function findKey(dictionary, value) {
    for (const key in dictionary) {
      const range = dictionary[key];
      if (value >= range[0] && value <= range[1]) {
        return key;
      }
    }
    return null;
  }

  return (
    <AppContext.Provider
      value={{
        offsets,
        generation,
        setGeneration,
        totalGenerations,
        generationData,
        totalPokemon,
        selectedPokemon,
        setSelectedPokemon,
        selectedTypes,
        handleTypeFilter,
        navigate,
        getGenIdFromPokeId
      }}
    >
      <div className="container mx-auto h-screen">
        <div className='p-4 md:p-8 h-full flex flex-col'>
          <div className='flex justify-between'>
            <a
              href="/"
              aria-label="Company"
              title="Company"
              className="inline-flex items-center ms-2"
            >
              <img src={PokeBall} alt="" className='w-8 text-teal-accent-400' />

              <span className="ml-2 font-bold tracking-wide ">
                minimal pokedex
              </span>
            </a>

            <div className='block md:hidden'>
                <GenerationDropdown />
              </div>
          </div>


          <div className='flex flex-col md:flex-row md:items-center justify-between'>
            <div className='flex flex-row md:basis-2/5 ms-2 mt-3 md:mt-0'>
              <div className='hidden md:block'>
                <GenerationDropdown />
              </div>
              <TypeFilter onFilter={handleTypeFilter} />
              {Object.keys(generationData).length > 0 && generation !== 'all' && (
                <div className="flex p-2 rounded">
                  <h5 className='px-4 text-sm/none text-gray-600'>region: {generationData[generation][0].main_region.name}</h5>
                  <h5 className='px-4 text-sm/none text-gray-600'>population: {generationData[generation][0].pokemon_species.length}</h5>
                </div>
              )}
            </div>
            <div className="basis-3/5 px-2 md:px-3" >
              <SearchBar totalPokemon={totalPokemon} />
            </div>
          </div>

          <div className='flex flex-row overflow-y-auto md:fadeWrapper'>
            {
              generationOffsets.length > 0 &&
                <PokemonList
                  height="fit-content"
                  key={generation}
                  startingOffset={generation === 'all' ? 0 : generationOffsets[0]}
                  maxOffset={generation === 'all' ? totalPokemon : generationOffsets[1]}
                />
            }
            <div className="w-0 md:w-3/5 md:p-4 overflow-y-auto">
              <div className="hidden md:block">
                <PokemonDetails />
              </div>
              {selectedPokemon && (
                <div className="fixed inset-0 z-50 flex items-center justify-center md:hidden">
                  <div className="absolute inset-0 bg-black opacity-50" onClick={() => setSelectedPokemon(null)}></div>
                  <div className="relative bg-white w-11/12 max-w-md mx-auto rounded-lg shadow-lg overflow-hidden">
                    <div className="flex justify-end pt-4 pe-4">
                      <button
                        className="text-gray-500 hover:text-gray-700 focus:outline-none"
                        onClick={() => {
                          setSelectedPokemon(null);
                          navigate(`/gen/${genId}`);
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="p-4 overflow-y-scroll md:overflow-y-auto max-h-[80vh]">
                      <PokemonDetails />
                    </div>
                  </div>
                </div>
              )}            
              </div>
          </div>
        </div>
      </div>
    </AppContext.Provider>
  );
}

export default App;