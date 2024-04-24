import React, { useState, useEffect, useRef } from 'react';
import { SpeakerWaveIcon, StarIcon, InformationCircleIcon, ChartBarSquareIcon, ScaleIcon, LightBulbIcon, MagnifyingGlassCircleIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';
import { useParams } from 'react-router-dom';
import DetailsLoader from './DetailsLoader';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import EvolutionTree from './EvolutionTree';
import MoveSetTable from './MoveSetTable';
import typeColors from '../utilities/typeColors';
import gameColors from '../utilities/gameColors';

function PokemonDetails() {
  const [pokemonData, setPokemonData] = useState(null);
  const [speciesData, setSpeciesData] = useState(null);
  const getTypeIconURL = (type) => `https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${type}.svg`;
  const [audioSrc, setAudioSrc] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef();
  const { pokeId } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [evoChain, setEvoChain] = useState(null);
  const [abilityDescriptions, setAbilityDescriptions] = useState({});
  const [isShiny, setIsShiny] = useState(false);
  const [weaknessData, setWeaknessData] = useState(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [versionGroups, setVersionGroups] = useState([]);
  const [selectedVersionGroup, setSelectedVersionGroup] = useState(null);

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: true,
    beforeChange: (currentSlide, nextSlide) => {
      setCurrentSlideIndex(nextSlide);
    },
  };

  const toggleShiny = () => {
    setIsShiny(!isShiny);
  };

  useEffect(() => {
    setAudioSrc(null);
    setIsPlaying(false);
    setIsShiny(false);
    setCurrentSlideIndex(0);

    const fetchVersionGroups = async (url = 'https://pokeapi.co/api/v2/version-group/') => {
      const response = await fetch(url);
      const data = await response.json();

      if (data.next) {
        const nextVersionGroups = await fetchVersionGroups(data.next);
        return [...data.results, ...nextVersionGroups];
      } else {
        return data.results;
      }
    };

    fetchVersionGroups().then(versionGroups => {
      setVersionGroups(versionGroups);
      setSelectedVersionGroup(versionGroups[0].name);
    });

    fetchVersionGroups();

    const fetchPokemonDetails = async () => {
      if (!pokeId) return
      setIsLoading(true);
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokeId}`);
      const pokemonData = await response.json();
      setPokemonData(pokemonData);
      console.log(pokemonData.moves)
      const speciesResponse = await fetch(pokemonData.species.url);
      const speciesData = await speciesResponse.json();
      setSpeciesData(speciesData);

      const evoResponse = await fetch(speciesData.evolution_chain.url);
      const evoData = await evoResponse.json();
      setEvoChain(evoData);

      setAudioSrc(pokemonData?.cries?.latest);

      const descriptions = {};
      for (const ability of pokemonData.abilities) {
        const response = await fetch(ability.ability.url);
        const data = await response.json();

        const englishEntry = data.effect_entries.find((entry) => entry.language.name === 'en');
        descriptions[ability.ability.name] = englishEntry ? englishEntry.short_effect : '';
      }
      setAbilityDescriptions(descriptions)

      const typeEffectiveness = {};
      for (const type of pokemonData.types) {
        const typeResponse = await fetch(type.type.url);
        const typeData = await typeResponse.json();

        typeData.damage_relations.double_damage_from.forEach(type => {
          typeEffectiveness[type.name] = (typeEffectiveness[type.name] || []).concat(2);
        });
        typeData.damage_relations.half_damage_from.forEach(type => {
          typeEffectiveness[type.name] = (typeEffectiveness[type.name] || []).concat(0.5);
        });
        typeData.damage_relations.no_damage_from.forEach(type => {
          typeEffectiveness[type.name] = (typeEffectiveness[type.name] || []).concat(0);
        });
      }

      const weaknessData = {};
      for (const [type, effectiveness] of Object.entries(typeEffectiveness)) {
        const totalEffectiveness = effectiveness.reduce((a, b) => a * b, 1);
        if (totalEffectiveness !== 1) {
          weaknessData[type] = totalEffectiveness;
        }
      }

      setWeaknessData(weaknessData);

      setIsLoading(false);
    };

    fetchPokemonDetails()
  }, [pokeId]);

  const toggleAudio = () => {
    setIsPlaying(!isPlaying);
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  const getUniqueDescriptions = (flavorTextEntries) => {
    const uniqueDescriptions = {};

    for (const entry of flavorTextEntries) {
      if (entry.language.name === 'en') {
        if (uniqueDescriptions[entry.flavor_text]) {
          uniqueDescriptions[entry.flavor_text].version_names.push(entry.version.name);
        } else {
          uniqueDescriptions[entry.flavor_text] = {
            flavor_text: entry.flavor_text,
            version_names: [entry.version.name],
          };
        }
      }
    }

    return Object.values(uniqueDescriptions).map(entry => ({
      ...entry,
      version_names: entry.version_names.join('-'),
    }));
  };

  if (!pokemonData || !pokeId) return <p className='text-gray-600 hover:bg-gray-50 hover:text-gray-700'>search or select a pokémon to view details</p>

  return (
    <>
      {isLoading ? (
        <DetailsLoader />
      ) : (

        <div className="grid grid-cols-1 md:grid-cols-6">
          <div className='flex flex-col items-center md:items-start col-span-6 md:col-span-2 row-span-2'>
            <div className="flex items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800 mr-4">{pokemonData.name}</h2>
              {audioSrc && (
                <div className="flex justify-center items-center">
                  <SpeakerWaveIcon
                    className={`h-6 w-6 text-gray-500 mr-2 cursor-pointer ${isPlaying ? 'text-green-500' : ''}`}
                    onClick={toggleAudio}
                  />
                  <audio ref={audioRef} controls style={{ display: 'none' }} onEnded={() => setIsPlaying(false)}>
                    <source src={audioSrc} type="audio/mpeg" />
                    Your browser doesn't support the audio element.
                  </audio>
                </div>
              )}

              <StarIcon
                className={`h-6 w-6 cursor-pointer ${isShiny ? 'text-yellow-400' : 'text-gray-500'}`}
                onClick={toggleShiny}
              />
            </div>
            <div className='w-full flex justify-center'>
              <img
                className="h-60 p-4"
                src={isShiny ? pokemonData.sprites.other.home.front_shiny : pokemonData.sprites.other.home.front_default}
                alt={pokemonData.name}
                onMouseOver={e => (e.currentTarget.src = isShiny ? (pokemonData.sprites.other.showdown.front_shiny || pokemonData.sprites.other["official-artwork"].front_shiny)
                  : pokemonData.sprites.other.showdown.front_default || pokemonData.sprites.other["official-artwork"].front_default)}
                onMouseOut={e => (e.currentTarget.src = isShiny ? pokemonData.sprites.other.home.front_shiny : pokemonData.sprites.other.home.front_default)}
              />
            </div>
          </div>
          <div className="col-span-4 row-span-2">
            <dl className="divide-y divide-gray-100 text-sm bg-white border border-gray-200 p-4 rounded">
              {speciesData && speciesData.flavor_text_entries.length > 0 && (
                <div className="grid grid-cols-1 gap-1 pb-3 sm:grid-cols-3 sm:gap-4 relative">
                  <dt className="font-medium text-gray-900 items-center">
                    <div className='flex items-center'>
                      <InformationCircleIcon className="h-5 w-5 inline-block mr-2" />
                      description
                    </div>
                    <p className="text-sm ms-7">
                      {getUniqueDescriptions(speciesData.flavor_text_entries)[currentSlideIndex]?.version_names.split('-').map((version, index) => (
                        <span
                          key={index}
                          style={{ color: gameColors[version.toLowerCase()] }}
                        >
                          {version}
                          {index < getUniqueDescriptions(speciesData.flavor_text_entries)[currentSlideIndex]?.version_names.split('-').length - 1 ? '-' : ''}
                        </span>
                      ))}
                    </p>
                  </dt>
                  <dd className="text-gray-700 sm:col-span-2">
                    <div className="relative">
                      <Slider {...sliderSettings} className='overflow-hidden'>
                        {getUniqueDescriptions(speciesData.flavor_text_entries).map((entry, index) => (
                          <div key={index}>
                            <p>{entry.flavor_text}</p>
                          </div>
                        ))}
                      </Slider>
                    </div>
                  </dd>
                </div>
              )}
              <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
                <dt className="font-medium text-gray-900">
                  <div className='flex items-center'>
                    <ChartBarSquareIcon className="h-5 w-5 inline-block mr-2" />
                    height
                  </div>
                </dt>
                <dd className="text-gray-700 sm:col-span-2">{(pokemonData.height * 0.1).toFixed(2)} meters</dd>
              </div>

              <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
                <dt className="font-medium text-gray-900">
                  <div className='flex items-center'>
                    <ScaleIcon className="h-5 w-5 inline-block mr-2" />
                    weight
                  </div>
                </dt>
                <dd className="text-gray-700 sm:col-span-2">{(pokemonData.weight * 0.1).toFixed(2)} kilograms</dd>
              </div>

              <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
                <dt className="font-medium text-gray-900">
                  <div className='flex items-center'>
                    <LightBulbIcon className="h-5 w-5 inline-block mr-2" />
                    abilities
                  </div>
                </dt>
                <dd className="text-gray-700 sm:col-span-2 flex flex-wrap">
                  {pokemonData.abilities.map((a) => (
                    <div key={a.ability.name} className="tooltip mr-2 mb-2" data-tip={abilityDescriptions[a.ability.name]}>
                      <button
                        className={`px-3 py-1 rounded ${a.is_hidden ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-800'
                          }`}
                      >
                        {a.ability.name} {a.is_hidden && <span>*</span>}
                      </button>
                    </div>
                  ))}
                </dd>
              </div>

              <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
                <dt className="font-medium text-gray-900">
                  <div className='flex items-center'>
                    <MagnifyingGlassCircleIcon className="h-5 w-5 inline-block mr-2" />
                    type
                  </div>
                </dt>
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

              <div className="grid grid-cols-1 gap-1 pt-3 sm:grid-cols-3 sm:gap-4">
                <dt className="font-medium text-gray-900">
                  <div className='flex items-center'>
                    <ShieldExclamationIcon className="h-5 w-5 inline-block mr-2" />
                    defenses
                  </div>
                </dt>
                <dd className="text-gray-700 sm:col-span-2 flex flex-wrap">
                  {weaknessData &&
                    Object.entries(weaknessData)
                      .sort(([, a], [, b]) => {
                        if (a === 0) return 1;
                        if (b === 0) return -1;
                        return b - a;
                      })
                      .map(([type, multiplier]) => (
                        <div
                          key={type}
                          className="flex items-center mr-4 mb-2 p-2 rounded"
                          style={{ backgroundColor: typeColors[type] }}
                        >
                          <img
                            src={getTypeIconURL(type)}
                            alt={`${type} type`}
                            className="h-6 w-6"
                          />
                          <p className="mx-2 text-white">
                            {multiplier === 0 ? 'Immune' : `${multiplier}x`}
                          </p>
                        </div>
                      ))}
                </dd>
              </div>
            </dl>
          </div>

          <div className='col-span-6 row-span-2 flex flex-col '>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">stats</h2>
            <dl className="divide-y divide-gray-100 text-sm">
              <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
                <dd className="text-gray-700 sm:col-span-2 space-y-4 border border-gray-200 p-4 rounded">
                  {pokemonData.stats.map((stat) => (
                    <div key={stat.stat.name}>
                      <div className="flex justify-between">
                        <span className="mb-2">{stat.stat.name}</span>
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

          <div className='col-span-6 row-span-3 row-start-8 mt-8 flex flex-col'>
            <MoveSetTable
              moves={pokemonData.moves}
              versionGroups={versionGroups}
              selectedVersionGroup={selectedVersionGroup}
              onVersionGroupChange={setSelectedVersionGroup}
            />
          </div>

        </div>
      )}
    </>
  );
}



export default PokemonDetails;