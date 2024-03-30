import React, { useState, useEffect, useMemo } from 'react';
import GenerationDropdown from './components/GenerationDropdown';
import PokemonList from './components/PokemonList';
import PokemonDetails from './components/PokemonDetails';
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
        selectedTypes,
        handleTypeFilter,
        navigate,
        getGenIdFromPokeId
      }}
    >
      <div className="container mx-auto h-screen">
        <div className='md:p-8 h-full flex flex-col'>
          <div>
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
          </div>


          <div className='flex flex-row items-center justify-between'>
            <div className='flex flex-row basis-2/5 ms-2'>
              <GenerationDropdown />
              <TypeFilter onFilter={handleTypeFilter} />
              {Object.keys(generationData).length > 0 && generation !== 'all' && (
                <div className="flex p-2 rounded">
                  <h5 className='px-4 text-sm/none text-gray-600'>region: {generationData[generation][0].main_region.name}</h5>
                  <h5 className='px-4 text-sm/none text-gray-600'>population: {generationData[generation][0].pokemon_species.length}</h5>
                </div>
              )}
            </div>
            <div className="basis-3/5 px-3" >
              <SearchBar totalPokemon={totalPokemon} />
            </div>
          </div>

          <div className='flex flex-row overflow-y-auto fadeWrapper'>
            {
              generationOffsets.length > 0 ?
                <PokemonList
                  height="fit-content"
                  key={generation}
                  startingOffset={generation === 'all' ? 0 : generationOffsets[0]}
                  maxOffset={generation === 'all' ? totalPokemon : generationOffsets[1]}
                />
                :
                <div className="w-2/5 p-4">
                  <SkeletonLoader />
                </div>
            }
            <div className="w-3/5 p-4 overflow-y-auto">
              <PokemonDetails />
            </div>
          </div>
        </div>
      </div>
    </AppContext.Provider>
  );
}

export default App;