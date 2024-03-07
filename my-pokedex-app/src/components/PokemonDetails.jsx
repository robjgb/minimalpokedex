import React, { useState, useEffect } from 'react';
import { SpeakerWaveIcon } from '@heroicons/react/24/outline';
import { useParams } from 'react-router-dom';
import DetailsLoader from './DetailsLoader';

const pokemonStats = [
  { base_stat: 45, effort: 0, stat: { name: "hp" } },
  { base_stat: 49, effort: 0, stat: { name: "attack" } },
  { base_stat: 49, effort: 0, stat: { name: "defense" } },
  { base_stat: 65, effort: 1, stat: { name: "special-attack" } },
  { base_stat: 65, effort: 0, stat: { name: "special-defense" } },
  { base_stat: 45, effort: 0, stat: { name: "speed" } },
];


const typeColors = {
  normal: '#A8A878',
  fire: '#F08030',
  water: '#6890F0',
  electric: '#F8D030',
  grass: '#78C850',
  ice: '#98D8D8',
  fighting: '#C03028',
  poison: '#A040A0',
  ground: '#E0C068',
  flying: '#A890F0',
  psychic: '#F85888',
  bug: '#A8B820',
  rock: '#B8A038',
  ghost: '#705898',
  dragon: '#7038F8',
  dark: '#705848',
  steel: '#B8B8D0',
  fairy: '#EE99AC',
};


const EvolutionTree = ({ evolution }) => {
  const [pokemonData, setPokemonData] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const loadEvolutionChainData = async (evolutions) => {
    const pokemonIds = evolutions.map(ev => ev.species.url.split('/').slice(-2, -1)[0]);

    setIsLoading(true);
    await Promise.all(pokemonIds.map(id => fetchPokemonData(id)));
    setIsLoading(false);
  };

  useEffect(() => {
    loadEvolutionChainData(evolution.chain.evolves_to);
  }, [evolution.chain]);


  const fetchPokemonData = async (id) => {
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
      const data = await response.json();
      setPokemonData((prevData) => ({ ...prevData, [id]: data }));
    } catch (error) {
      console.error('Error fetching Pokemon data:', error);
    }
  };

  const renderEvolutionChain = (evolutions) => {
    const chunks = [];
    let currentChunk = [];

    evolutions.forEach((ev, index) => {
      const pokemonId = ev.species.url.split('/').slice(-2, -1)[0];
      const pokemonTypes = pokemonData[pokemonId]?.types || [];

      if (!pokemonData[pokemonId]) {
        fetchPokemonData(pokemonId);
      }

      currentChunk.push(
        <div key={index} className="flex flex-row items-center mx-2">
          <div className="bg-white border-2 w-full mt-2 border-gray-100 shadow-lg transition-transform duration-200 group hover:-translate-x-2 hover:-translate-y-2 p-2 rounded-md flex flex-col items-center">
            <img
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`}
              alt={ev.species.name}
              className="w-20 h-20"
            />
            <div className="font-bold">{ev.species.name}</div>
            {pokemonTypes.length > 0 && (
              <div className="flex p-1">
                {pokemonTypes.map((type, index) => (
                  <div
                    key={index}
                    className={index > 0 ? "flex ms-2 p-1 rounded" : "flex p-1 rounded"}
                    style={{ backgroundColor: typeColors[type.type.name] }}
                  >
                    <p className="mx-1 text-xs text-white">{type.type.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          {ev.evolves_to.length > 0 && (
            <div className="flex flex-row items-center mx-4">
              {renderEvolutionChain(ev.evolves_to)}
            </div>
          )}
        </div>
      );
      if ((index + 1) % 4 === 0 || index === evolutions.length - 1) {
        chunks.push(
          <div key={`chunk-${chunks.length}`} className="flex flex-col">
            {currentChunk}
          </div>
        );
        currentChunk = [];
      }
    });

    if (isLoading) {
      return <div className="skeleton w-32 h-32 bg-gray-300" />
    }

    return chunks;
  };

  return isLoading ? (
    <div className="skeleton w-32 h-32 bg-gray-300" />
  ) : (
    <div className="flex flex-row">
      {renderEvolutionChain([evolution.chain])}
    </div>
  );
};

function PokemonDetails() {
  const [pokemonData, setPokemonData] = useState(null);
  const [speciesData, setSpeciesData] = useState(null);
  const getTypeIconURL = (type) => `https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${type}.svg`;
  const [audioSrc, setAudioSrc] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.createRef();
  const { pokeId } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [evoChain, setEvoChain] = useState(null);

  useEffect(() => {
    setAudioSrc(null);
    setIsPlaying(false);

    const fetchPokemonDetails = async () => {
      if (!pokeId) return
      setIsLoading(true);
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokeId}`);
      const pokemonData = await response.json();
      setPokemonData(pokemonData);
      console.log(pokemonData)

      const speciesResponse = await fetch(pokemonData.species.url);
      const speciesData = await speciesResponse.json();
      setSpeciesData(speciesData);

      const evoResponse = await fetch(speciesData.evolution_chain.url);
      const evoData = await evoResponse.json();
      setEvoChain(evoData);

      setAudioSrc(pokemonData?.cries?.latest);
      setIsLoading(false);
    };

    fetchPokemonDetails();
  }, [pokeId]);

  useEffect(() => {
    // Clear isPlaying when audio ends
    const audio = audioRef.current;
    if (audio) {
      audio.onended = () => setIsPlaying(false);
    }
  }, [audioSrc]);

  const toggleAudio = () => {
    setIsPlaying(!isPlaying);
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  if (!pokemonData || !pokeId) return <p className='text-gray-600 hover:bg-gray-50 hover:text-gray-700'>search or select a pokémon to view details</p>

  return (
    <div>
      {isLoading ? (
        <DetailsLoader />
      ) : (
        <div className="grid grid-cols-6 grid-rows-7">
          <div className='col-span-2 row-span-2'>
            <div className="flex items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800 mr-4">{pokemonData.name}</h2>
              {audioSrc && (
                <div className="flex items-center">
                  <SpeakerWaveIcon
                    className={`h-6 w-6 text-gray-500 mr-2 cursor-pointer ${isPlaying ? 'text-green-500' : ''}`}
                    onClick={toggleAudio}
                  />
                  <audio ref={audioRef} controls style={{ display: 'none' }}>
                    <source src={audioSrc} type="audio/mpeg" />
                    Your browser doesn't support the audio element.
                  </audio>
                </div>
              )}
            </div>
            <img className="h-44 p-4" src={pokemonData.sprites.other.home.front_default} alt={pokemonData.name}
              onMouseOver={e => (e.currentTarget.src = pokemonData.sprites.other.showdown.front_default ?? pokemonData.sprites.other["official-artwork"].front_default)}
              onMouseOut={e => (e.currentTarget.src = pokemonData.sprites.other.home.front_default)} />
          </div>
          <div className="col-span-4 row-span-2 col-start-3">
            <dl className="-my-3 divide-y divide-gray-100 text-sm">
              {(speciesData && speciesData.flavor_text_entries[0]?.flavor_text) &&
                <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
                  <dt className="font-medium text-gray-900">description</dt>
                  <dd className="text-gray-700 sm:col-span-2">{speciesData.flavor_text_entries.filter(entry => entry.language.name === "en")[0]?.flavor_text.replace(/\u000c/g, ' ')}</dd>
                </div>
              }
              <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
                <dt className="font-medium text-gray-900">height</dt>
                <dd className="text-gray-700 sm:col-span-2">{(pokemonData.height * 0.1).toFixed(2)} meters</dd>
              </div>

              <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
                <dt className="font-medium text-gray-900">weight</dt>
                <dd className="text-gray-700 sm:col-span-2">{(pokemonData.weight * 0.1).toFixed(2)} kilograms</dd>
              </div>

              <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
                <dt className="font-medium text-gray-900">abilities</dt>
                <dd className="text-gray-700 sm:col-span-2">{pokemonData.abilities.map(a => a.ability.name).join(', ')}</dd>
              </div>

              <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
                <dt className="font-medium text-gray-900">types</dt>
                <dd className="text-gray-700 sm:col-span-2 flex">{pokemonData.types.map(type =>
                  <div key={type.type.name} className='flex me-4 p-2 rounded' style={{ backgroundColor: typeColors[type.type.name] }}>
                    <img
                      key={type.type.name}
                      src={getTypeIconURL(type.type.name)}
                      alt={`${type.type.name} type`}
                      className="h-6 w-6"

                    />
                    <p className='mx-2 text-white'>{type.type.name}</p>
                  </div>
                )}</dd>
              </div>

            </dl>
          </div>

          <div className='col-span-6 row-span-2 row-start-3 flex flex-col '>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">stats</h2>
            <dl className="-my-3 divide-y divide-gray-100 text-sm">
              <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
                <dd className="text-gray-700 sm:col-span-2 space-y-4">
                  {pokemonData.stats.map((stat) => (
                    <div key={stat.stat.name}>
                      <div className="flex justify-between">
                        <span className="capitalize">{stat.stat.name}</span>
                        <span>{stat.base_stat}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div
                          className="bg-black h-2.5 rounded-full progress-bar"
                          style={{ '--progress-width': `${(stat.base_stat / 255) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </dd>
              </div>
            </dl>
          </div>


          <div className='col-span-6 row-span-3 row-start-5 mt-8 flex flex-col'>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">evolutions</h2>
            {evoChain.chain.evolves_to.length == 0 && <p className='mb-4'> this pokemon does not evolve. </p>}
            <EvolutionTree evolution={evoChain} />
          </div>

        </div>
      )}
    </div>
  );
}



export default PokemonDetails;