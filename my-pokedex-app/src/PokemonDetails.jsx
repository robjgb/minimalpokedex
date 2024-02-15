import React, { useState, useEffect } from 'react';
import { SpeakerWaveIcon } from '@heroicons/react/24/outline';

function PokemonDetails({ pokemon }) {
  const [pokemonData, setPokemonData] = useState(null);
  const [speciesData, setSpeciesData] = useState(null);
  const getTypeIconURL = (type) => `https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${type}.svg`;
  const [audioSrc, setAudioSrc] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.createRef();
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

  useEffect(() => {
    setAudioSrc(null); 
    setIsPlaying(false);

    const fetchPokemonDetails = async () => {
      if (!pokemon) return;
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon.url.split('/')[6]}`);
      const pokemonData = await response.json();
      setPokemonData(pokemonData);

      const speciesResponse = await fetch(pokemonData.species.url);
      const speciesData = await speciesResponse.json();
      setSpeciesData(speciesData);

      setAudioSrc(pokemonData?.cries?.latest);
    };

    fetchPokemonDetails();
  }, [pokemon]);

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

  if (!pokemonData) return <p className='text-gray-600 hover:bg-gray-50 hover:text-gray-700'>select a pokémon to view details</p>

  return (
    <div className='p-4'>
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

      <div className="flow-root mt-4">
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
            <dt className="font-medium text-gray-900">types</dt>
            <dd className="text-gray-700 sm:col-span-2 flex">{pokemonData.types.map(type =>
              <div className='flex me-4 p-2 rounded' style={{ backgroundColor: typeColors[type.type.name] }}>
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
    </div>
  );
}



export default PokemonDetails;