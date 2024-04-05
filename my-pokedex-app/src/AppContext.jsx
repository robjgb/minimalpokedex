import { createContext } from 'react';

const AppContext = createContext({
  offsets: {},
  generation: 1,
  setGeneration: () => {},
  totalGenerations: null,
  generationData: {},
  totalPokemon: null,
  selectedPokemon: null,
  setSelectedPokemon: () => {},
  selectedTypes: [],
  handleTypeFilter: () => {},
  navigate: () => {},
  getGenIdFromPokeId: () => null, 
});

export default AppContext;