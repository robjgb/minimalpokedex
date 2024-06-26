import React, { useState, useEffect, useRef, version } from 'react';
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
import typeGradientColors from '../utilities/typeGradientColors';
import { useNavigate } from 'react-router-dom';

function PokemonDetails() {
  const [pokemonData, setPokemonData] = useState(null);
  const [speciesData, setSpeciesData] = useState(null);
  const getTypeIconURL = (type) => `https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${type}.svg`;
  const [audioSrc, setAudioSrc] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef();
  const [isLoading, setIsLoading] = useState(false);
  const [evoChain, setEvoChain] = useState(null);
  const [abilityDescriptions, setAbilityDescriptions] = useState({});
  const [isShiny, setIsShiny] = useState(false);
  const [weaknessData, setWeaknessData] = useState(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [versionGroups, setVersionGroups] = useState([]);
  const [selectedVersionGroup, setSelectedVersionGroup] = useState(null);
  const [uniqueDescriptions, setUniqueDescriptions] = useState([]);
  const [evYield, setEvYield] = useState(null);
  const [forms, setForms] = useState([]);
  const { pokeId, formId, genId } = useParams();
  const navigate = useNavigate();


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

    const fetchPokemonDetails = async () => {
      if (!pokeId) return
      setIsLoading(true);

      // Fetch species data first
      const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokeId}`);
      const speciesData = await speciesResponse.json();
      setSpeciesData(speciesData);
      setUniqueDescriptions(getUniqueDescriptions(speciesData.flavor_text_entries));

      // Set forms
      setForms(speciesData.varieties);

      // Determine which form to fetch
      const formToFetch = formId
        ? speciesData.varieties.find(v => v.pokemon.name === formId)?.pokemon.url
        : `https://pokeapi.co/api/v2/pokemon/${pokeId}`;

      // Fetch Pokemon data
      const response = await fetch(formToFetch);
      const pokemonData = await response.json();
      // console.log(pokemonData);
      setPokemonData(pokemonData);

      const evoResponse = await fetch(speciesData.evolution_chain.url);
      const evoData = await evoResponse.json();
      setEvoChain(evoData);

      setAudioSrc(pokemonData?.cries?.latest);

      // Fetch ability descriptions in parallel
      const abilityPromises = pokemonData.abilities.map(async (ability) => {
        const response = await fetch(ability.ability.url);
        const data = await response.json();
        const englishEntry = data.effect_entries.find((entry) => entry.language.name === 'en');
        return { name: ability.ability.name, description: englishEntry ? englishEntry.short_effect : '' };
      });

      const abilityResults = await Promise.all(abilityPromises);
      const descriptions = Object.fromEntries(abilityResults.map(({ name, description }) => [name, description]));
      setAbilityDescriptions(descriptions);

      // Fetch type data in parallel
      const typePromises = pokemonData.types.map(async (type) => {
        const typeResponse = await fetch(type.type.url);
        const typeData = await typeResponse.json();
        return typeData.damage_relations;
      });

      const typeResults = await Promise.all(typePromises);
      const typeEffectiveness = {};

      typeResults.forEach((damageRelations) => {
        damageRelations.double_damage_from.forEach(type => {
          typeEffectiveness[type.name] = (typeEffectiveness[type.name] || []).concat(2);
        });
        damageRelations.half_damage_from.forEach(type => {
          typeEffectiveness[type.name] = (typeEffectiveness[type.name] || []).concat(0.5);
        });
        damageRelations.no_damage_from.forEach(type => {
          typeEffectiveness[type.name] = (typeEffectiveness[type.name] || []).concat(0);
        });
      });

      const calculatedWeaknessData = {};
      for (const [type, effectiveness] of Object.entries(typeEffectiveness)) {
        const totalEffectiveness = effectiveness.reduce((a, b) => a * b, 1);
        if (totalEffectiveness !== 1) {
          calculatedWeaknessData[type] = totalEffectiveness;
        }
      }

      setWeaknessData(calculatedWeaknessData);

      const evYieldData = pokemonData.stats.reduce((yields, stat) => {
        return yields + (stat.effort > 0 ? `${stat.effort} ${stat.stat.name}, ` : '');
      }, '').slice(0, -2);
      setEvYield(evYieldData || 'None');

      setIsLoading(false);
    };

    fetchVersionGroups();
    fetchPokemonDetails()
  }, [pokeId, formId]);

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
    const uniqueDescriptionsSet = new Set();

    for (const entry of flavorTextEntries) {
      if (entry.language.name === 'en') {
        uniqueDescriptionsSet.add(entry.flavor_text);
      }
    }

    const orderedDescriptions = [...uniqueDescriptionsSet].map(flavor_text => {
      const version_names = getVersionNames(flavor_text, flavorTextEntries);
      flavor_text = flavor_text
        .replace(/\f/g, '\n')
        .replace(/\u00ad\n/g, '')
        .replace(/\u00ad/g, '')
        .replace(/ -\n/g, ' - ')
        .replace(/-\n/g, '-')
        .replace(/\n/g, ' ');
      return {
        flavor_text,
        version_names: version_names.join('/')
      };
    });

    return orderedDescriptions;
  };

  const getVersionNames = (flavor_text, flavorTextEntries) => {
    return flavorTextEntries
      .filter(entry => entry.flavor_text === flavor_text && entry.language.name === 'en')
      .map(entry => entry.version.name);
  };

  if (!pokemonData || !pokeId) return <p className='text-gray-600 hover:bg-gray-50 hover:text-gray-700 hidden md:block'>search or select a pokémon to view details</p>

  return (
    <>
      {isLoading ? (
        <DetailsLoader />
      ) : (

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Header section with name, buttons, and form selector */}
            <div className="col-span-6 flex justify-between items-center mb-4">
              <div className="flex items-center">
                <h2 className="text-2xl font-bold text-gray-800 mr-4">{pokemonData.name}</h2>
                {audioSrc && (
                  <div className="flex justify-center items-center mr-2">
                    <SpeakerWaveIcon
                      className={`h-6 w-6 text-gray-500 cursor-pointer ${isPlaying ? 'text-green-500' : ''}`}
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
              {forms.length > 1 && (
                <select 
                  value={formId || forms.find(f => f.is_default)?.pokemon.name}
                  onChange={(e) => {
                    const selectedForm = e.target.value;
                    const isBaseForm = selectedForm === forms.find(f => f.is_default)?.pokemon.name;
                    navigate(`/gen/${genId}/${pokeId}${isBaseForm ? '' : `/${selectedForm}`}`);
                  }}
                  className="p-2 border rounded"
                >
                  {forms.map((form) => (
                    <option key={form.pokemon.name} value={form.pokemon.name}>
                      {form.pokemon.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Pokemon image */}
            <div className='flex flex-col items-center md:items-start col-span-6 md:col-span-2 md:row-start-2'>
              <div className='w-full flex justify-center relative group items-center'>
                <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 inset-10 bg-gradient-to-r ${typeGradientColors[pokemonData.types[0].type.name].from} ${pokemonData.types.length > 1 ? typeGradientColors[pokemonData.types[1].type.name].to : typeGradientColors[pokemonData.types[0].type.name].to}
                  rounded-full blur-xl opacity-40 group-hover:opacity-80 transition duration-2000 animate-pulse `}></div>
                <img
                  className="relative w-auto h-56 p-4"
                  src={isShiny ? pokemonData.sprites.other.home.front_shiny : pokemonData.sprites.other.home.front_default}
                  alt={pokemonData.name}
                  onMouseOver={e => (e.currentTarget.src = isShiny ? (pokemonData.sprites.other.showdown.front_shiny || pokemonData.sprites.other["official-artwork"].front_shiny)
                    : pokemonData.sprites.other.showdown.front_default || pokemonData.sprites.other["official-artwork"].front_default)}
                  onMouseOut={e => (e.currentTarget.src = isShiny ? pokemonData.sprites.other.home.front_shiny : pokemonData.sprites.other.home.front_default)}
                />
              </div>
            </div>

            {/* Details Table */}
            <div className="col-span-6 md:col-span-4 md:col-start-3 md:row-start-2 relative">
              <dl className="divide-y divide-gray-100 text-sm bg-white border border-gray-200 p-4 rounded">
                {versionGroups && speciesData && uniqueDescriptions.length > 0 && (
                  <div className="grid grid-cols-1 gap-1 pb-3 sm:grid-cols-3 sm:gap-4 relative">
                    <dt className="font-semibold text-gray-900 items-center">
                      <div className='flex items-center'>
                        <InformationCircleIcon className="h-5 w-5 inline-block mr-2" />
                        description
                      </div>
                      <p className="text-sm ms-7">
                        {uniqueDescriptions[currentSlideIndex]?.version_names.split('/').map((version, index) => (
                          <span
                            className='inline-block'
                            key={index}
                            style={{ color: gameColors[version.toLowerCase()] }}
                          >
                            {version}
                            {index < uniqueDescriptions[currentSlideIndex]?.version_names.split('/').length - 1 ? '/' : ''}
                          </span>
                        ))}
                      </p>
                    </dt>
                    <dd className="text-gray-700 sm:col-span-2">
                      <Slider {...sliderSettings}>
                        {getUniqueDescriptions(speciesData.flavor_text_entries).map((entry, index) => (
                          <div key={index}>
                            <p>{entry.flavor_text}</p>
                          </div>
                        ))}
                      </Slider>
                    </dd>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
                  <dt className="font-semibold text-gray-900">
                    <div className='flex items-center'>
                      <ChartBarSquareIcon className="h-5 w-5 inline-block mr-2" />
                      height
                    </div>
                  </dt>
                  <dd className="text-gray-700 sm:col-span-2">{(pokemonData.height * 0.1).toFixed(2)} meters</dd>
                </div>

                <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
                  <dt className="font-semibold text-gray-900">
                    <div className='flex items-center'>
                      <ScaleIcon className="h-5 w-5 inline-block mr-2" />
                      weight
                    </div>
                  </dt>
                  <dd className="text-gray-700 sm:col-span-2">{(pokemonData.weight * 0.1).toFixed(2)} kilograms</dd>
                </div>

                <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
                  <dt className="font-semibold text-gray-900">
                    <div className='flex items-center'>
                      <LightBulbIcon className="h-5 w-5 inline-block mr-2" />
                      abilities
                    </div>
                  </dt>
                  <dd className="text-gray-700 sm:col-span-2 flex flex-wrap">
                    {pokemonData.abilities.map((a) => (
                      <div
                        key={a.ability.name}
                        className="mr-2 mb-2"
                        data-tooltip-id="ability-tooltip"
                        data-tooltip-content={abilityDescriptions[a.ability.name]}
                      >
                        <button
                          className={`px-3 py-1 rounded ${a.is_hidden ? 'bg-black text-white' : 'bg-gray-200 text-gray-800'
                            }`}
                        >
                          {a.ability.name} {a.is_hidden && <span>*</span>}
                        </button>
                      </div>
                    ))}
                  </dd>
                </div>

                <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
                  <dt className="font-semibold text-gray-900">
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
                  <dt className="font-semibold text-gray-900">
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

            {/* Info Table */}
            <div className='col-span-6 row-start-4 flex flex-col md:flex-row mt-4'>
              <div className="w-full md:w-1/2 pr-0 md:pr-2">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">stats</h2>
                <dl className="divide-y divide-gray-100 text-sm">
                  <div className="grid grid-cols-3 gap-1 py-3 sm:gap-4">
                    <dd className="text-gray-700 col-span-3 space-y-4 border border-gray-200 p-4 rounded">
                      {pokemonData.stats.map((stat) => (
                        <div key={stat.stat.name}>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-900 mb-2">{stat.stat.name}</span>
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

              <div className="w-full md:w-1/2 mt-4 md:mt-0 md:pl-2">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">attributes</h2>
                <dl className="divide-y divide-gray-100 text-sm bg-white border border-gray-200 p-4 rounded">
                  {speciesData.habitat && (
                    <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
                      <dt className="font-semibold text-gray-900">habitat</dt>
                      <dd className="text-gray-700 sm:col-span-2">{speciesData.habitat.name}</dd>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
                    <dt className="font-semibold text-gray-900">capture rate</dt>
                    <dd className="text-gray-700 sm:col-span-2">{speciesData.capture_rate}</dd>
                  </div>

                  <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
                    <dt className="font-semibold text-gray-900">growth rate</dt>
                    <dd className="text-gray-700 sm:col-span-2">{speciesData.growth_rate.name}</dd>
                  </div>

                  <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
                    <dt className="font-semibold text-gray-900">EV yield</dt>
                    <dd className="text-gray-700 sm:col-span-2">{evYield}</dd>
                  </div>

                  <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
                    <dt className="font-semibold text-gray-900">base exp</dt>
                    <dd className="text-gray-700 sm:col-span-2">{pokemonData.base_experience}</dd>
                  </div>

                  <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
                    <dt className="font-semibold text-gray-900">base happiness</dt>
                    <dd className="text-gray-700 sm:col-span-2">{speciesData.base_happiness}</dd>
                  </div>
                </dl>

                <h2 className="text-2xl font-bold text-gray-800 mb-2 mt-6">breeding</h2>
                <dl className="divide-y divide-gray-100 text-sm bg-white border border-gray-200 p-4 rounded">
                  <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
                    <dt className="font-semibold text-gray-900">egg groups</dt>
                    <dd className="text-gray-700 sm:col-span-2">
                      {speciesData.egg_groups.map(group => group.name).join(', ')}
                    </dd>
                  </div>

                  <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
                    <dt className="font-semibold text-gray-900">egg cycle</dt>
                    <dd className="text-gray-700 sm:col-span-2">{speciesData.hatch_counter * 255} steps</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Evo Tree */}
            <div className='col-span-6 row-start-5 mt-8 flex flex-col'>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">evolutions</h2>
              {evoChain.chain.evolves_to.length == 0 && <p className='mb-4'> this pokemon does not evolve. </p>}
              <EvolutionTree evolution={evoChain} />
            </div>

            {/* Moveset Table */}
            <div className='col-span-6 row-start-6 mt-8 flex flex-col'>
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