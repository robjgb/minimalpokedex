import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import typeColors from './typeColors';


export default function EvolutionTree({ evolution }) {
  const [pokemonData, setPokemonData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

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

  const renderEvolutionChain = (evolutions, prevEvolution = null) => {
    const chunks = [];
    let currentChunk = [];

    evolutions.forEach((ev, index) => {
      const pokemonId = ev.species.url.split('/').slice(-2, -1)[0];
      const pokemonTypes = pokemonData[pokemonId]?.types || [];

      if (!pokemonData[pokemonId]) {
        fetchPokemonData(pokemonId);
      }

      const evolutionDetails = prevEvolution?.evolves_to.find(
        (e) => e.species.name === ev.species.name
      )?.evolution_details;

      const renderEvolutionTrigger = (details) => {
        if (!details || details.length === 0) return null;

        const conditionMap = {
          min_level: (value) => `level ${value}`,
          min_happiness: (value) => `happiness: ${value}`,
          min_affection: (value) => `affection: ${value}`,
          min_beauty: (value) => `beauty: ${value}`,
          gender: (value) => `gender: ${value === 1 ? 'female' : 'male'}`,
          relative_physical_stats: (value) =>
            `Attack ${value > 0 ? '>' : value < 0 ? '<' : '='} defense`,
          needs_overworld_rain: (value) => value === true ? 'needs rain' : null,
          turn_upside_down: (value) => value === true ? 'turn upside down' : null,
          time_of_day: (value) => `during ${value}`,
          known_move: (value) => `knowing move: ${value.name}`,
          known_move_type: (value) => `knowing move type: ${value.name}`,
          location: (value) => `at ${value.name}`,
          held_item: (value) => `holding: ${value.name}`,
          party_species: (value) => `in a party with: ${value.name}`,
          party_type: (value) => `party type: ${value.name}`,
          trade_species: (value) => `traded with: ${value.name}`,
        };

        const getConditions = (detail, conditionMap) => {
          return Object.entries(conditionMap)
            .map(([key, format]) => {
              const value = detail[key];
              return value !== undefined && value !== null && value !== ''
                ? format(value)
                : null;
            })
            .filter(Boolean);
        };

        const evolutionDetail = details[details.length - 1];
        const triggerName = evolutionDetail.trigger?.name;
        if (!triggerName) return null;

        const triggerMap = {
          'level-up': () => (
            <div key={index} className="text-sm text-gray-500">
              {`level up: `}
              <br />
              {`(${getConditions(evolutionDetail, conditionMap).join(', ')})`}
            </div>
          ),
          'trade': () => (
            <div key={index} className="text-sm text-gray-500">
              {`(trade${getConditions(evolutionDetail, conditionMap).length > 0 ? ' ' : ''} ${getConditions(evolutionDetail, conditionMap).join(', ')})`}
            </div>
          ),
          'use-item': () => (
            <div key={index} className="text-sm text-gray-500">
              {`(use ${evolutionDetail.item?.name})`}<br />
              {getConditions(evolutionDetail, conditionMap).length > 0 ? `(${getConditions(evolutionDetail, conditionMap).join(', ')})` : ''}
            </div>
          ),
          'shed': () => <div key={index} className="text-sm text-gray-500">(level 20, empty spot in party, Pokéball in bag)</div>,
          'spin': () => <div key={index} className="text-sm text-gray-500">(spin around holding a Sweet)</div>,
          'tower-of-darkness': () => <div key={index} className="text-sm text-gray-500">(train in the Tower of Darkness)</div>,
          'tower-of-water': () => <div key={index} className="text-sm text-gray-500">(train in the Tower of Waters)</div>,
          'three-critical-hits': () => <div key={index} className="text-sm text-gray-500">(land three critical hits in a battle)</div>,
          'take-damage': () => <div key={index} className="text-sm text-gray-500">(rock arch in dusty bowl after taking at least 49 HP in damage from attacks without fainting)</div>,
          'other': () => {
            switch (pokemonId) {
              case '923':
                // Logic for pawmot
                return <div className="text-sm text-gray-500" key={index}>(whilst outside of its Poké Ball after walking 1,000 steps using the Let's Go! feature and leveling)</div>;
              case '925':
                // Logic for maushold
                return <div className="text-sm text-gray-500" key={index}>(level 25 determined based on its encryption constant)</div>;
              case '947':
                // Logic for brambleghast
                return <div className="text-sm text-gray-500" key={index}>(whilst outside of its Poké Ball after walking 1,000 steps using the Let's Go! feature and leveling)</div>;
              case '954':
                // Logic for rabsca
                return <div className="text-sm text-gray-500" key={index}>(whilst outside of its Poké Ball after walking 1,000 steps using the Let's Go! feature and leveling)</div>;
              case '964':
                // Logic for palafin
                return <div className="text-sm text-gray-500" key={index}>(level 38 while in a Union Circle group)</div>;
              case '979':
                // Logic for annihilape
                return <div className="text-sm text-gray-500" key={index}>(after using Rage Fist at least 20 times and leveling)</div>;
              case '983':
                // Logic for kingambit
                return <div className="text-sm text-gray-500" key={index}>(leveling after defeating three Bisharp that hold a Leader's Crest)</div>;
              case '1000':
                // Logic for gholdengo
                return <div className="text-sm text-gray-500" key={index}>(leveling with 999 Gimmighoul Coins in the Bag)</div>;
              default:
                return <div className="text-sm text-gray-500" key={index}>Default logic for other pokemon</div>;
            }
          },
          'agile-style-move': () => <div key={index} className="text-sm text-gray-500">(using Psyshield Bash in the agile style at least 20 times and leveling)</div>,
          'strong-style-move': () => <div key={index} className="text-sm text-gray-500">(leveled up while knowing Barb Barrage)</div>,
          'recoil-damage': () => <div key={index} className="text-sm text-gray-500">(losing at least 294 HP from recoil damage and leveling)</div>,
        };

        const renderTrigger = triggerMap[triggerName];
        if (!renderTrigger) return null;

        return renderTrigger();
      };

      currentChunk.push(
        <div key={index} className="flex flex-row items-center mx-2">
          {prevEvolution && (
            <div className="flex flex-wrap justify-center mx-4">
              <div className="w-24 flex flex-col items-center text-center mx-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                {renderEvolutionTrigger(evolutionDetails)}
              </div>
            </div>
          )}

          <div
            onClick={() => {
              navigate(`/${pokemonId}`); // Update the URL
            }}
            className=" flex flex-col items-center cursor-pointer relative mt-2">
            <span className="absolute inset-0 border-2 border-dashed border-gray-100 rounded-lg"></span>
            <div className='relative bg-white border-2 border-gray-100 shadow-lg transition-transform duration-200 group hover:-translate-x-2 hover:-translate-y-2 p-2 rounded-md flex flex-col items-center justify-center '>
              <div className="w-24 h-24">
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`}
                  alt={ev.species.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
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
          </div>
          {ev.evolves_to.length > 0 && (
            <div className="flex flex-row items-center">
              {renderEvolutionChain(ev.evolves_to, ev)}
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
      return <div className="skeleton w-32 h-32 bg-gray-300" />;
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