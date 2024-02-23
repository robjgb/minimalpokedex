// App.jsx
import React, { useState, useEffect, useMemo } from 'react';
import GenerationDropdown from './GenerationDropdown';
import PokemonList from './PokemonList';
import PokemonDetails from './PokemonDetails';
import SkeletonLoader from './SkeletalLoader';
import { useNavigate, useParams } from 'react-router-dom';

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
      setOffsets(offsetData.reduce((acc, data) => ({
        ...acc,
        [data.generation]: [data.startingOffset, data.maxOffset],
      }), {}));

      setGenerationData(offsetData.reduce((acc, data) => ({
        ...acc,
        [data.generation]: [data.genData],
      }), {}));
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
  const { pokeId } = useParams();
  const { genId } = useParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    if(totalPokemon){
      if ((pokeId) && (pokeId < 1 || pokeId > totalPokemon || isNaN(Number(pokeId)))) {
        throw new Response("Invalid Pokemon ID", { status: 404, statusText: "Invalid Pokemon ID" });
      }
      else if((genId && pokeId && generationOffsets) && (pokeId <= generationOffsets[0]|| pokeId > generationOffsets[1])){
        throw new Response("Pokemon ID out of range for the specified generation", { status: 404, statusText: "Pokemon ID out of range for the specified generation" });
      }
      else if(pokeId == undefined){
        return
      }
      else{
        
      }
    }
  }, [pokeId, totalPokemon, genId]);
  
  useEffect(() => {
    if(totalGenerations){
      if ((genId) && (genId < 1 || genId > totalGenerations || isNaN(Number(genId)))) {
        throw new Response("Invalid Generation ID", { status: 404, statusText: "Invalid Generation ID" });
      } 
      else if (genId === undefined){
        return
      }
      else{
        setGeneration(genId)
      }
    }
  }, [genId, totalGenerations]);

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
                navigate={navigate}
                generation={generation}
              />
              :
              <SkeletonLoader/>
            }
            <div className="w-2/3 p-4">
              <PokemonDetails/>
            </div>
          </div>


      </div>
    </div>
  );
}

export default App;