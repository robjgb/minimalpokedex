// App.jsx
import React, { useState, useEffect, useMemo } from 'react';
import GenerationDropdown from './GenerationDropdown';
import PokemonList from './PokemonList';
import PokemonDetails from './PokemonDetails';
import SkeletonLoader from './SkeletalLoader';

function useGenerationOffsets(gen) {
  const [offsets, setOffsets] = useState({});
  const [generationData, setGenerationData] = useState({});

  useEffect(() => {
    const fetchAllOffsets = async () => {
      const generationsToFetch = Array.from({ length: 9 }, (_, i) => i + 1);
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

      setOffsets(offsetData.reduce((acc, data) => ({
        ...acc,
        [data.generation]: [data.startingOffset, data.maxOffset],
      }), {}));

      setGenerationData(offsetData.reduce((acc, data) => ({
        ...acc,
        [data.generation]: [data.genData],
      }), {}));
    };

    fetchAllOffsets();
  }, [gen]);

  return [offsets, generationData];
}

function App() {
  const [generation, setGeneration] = useState(1);
  const [offsets, generationData] = useGenerationOffsets(generation);
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const generationOffsets = useMemo(() => offsets[generation] || [], [offsets, generation]);

  return (
    <div className="container mx-auto h-screen">
      <div className='p-4 md:p-8 h-full flex flex-col'>
      <h1 className="p-4 pt-0 ">minimal pokedex</h1>
        <div className='flex'>
          <GenerationDropdown generation={generation} setGeneration={setGeneration} />
          {Object.keys(generationData).length > 0 &&
            <div className=" flex p-2 rounded mb-4">
              <h5 className='px-4 text-sm/none text-gray-600'>{generationData[generation][0].names.filter(entry => entry.language.name === "en")[0]?.name}</h5>
              <h5 className='px-4 text-sm/none text-gray-600'>region: {generationData[generation][0].main_region.name}</h5>
              <h5 className='px-4 text-sm/none text-gray-600'>population: {generationData[generation][0].pokemon_species.length}</h5>
            </div>
          }
        </div>

        <div className='flex flex-row overflow-y-hidden'>
          {
            generationOffsets.length > 0 ?
              <PokemonList
                height="fit-content"
                key={generation}
                startingOffset={generationOffsets[0]}
                maxOffset={generationOffsets[1]}
                setSelectedPokemon={setSelectedPokemon}
              />
              :
              <SkeletonLoader/>
            }
            <div className="w-2/3 p-4">
              <PokemonDetails pokemon={selectedPokemon} />
            </div>
          </div>


      </div>
    </div>
  );
}

export default App;