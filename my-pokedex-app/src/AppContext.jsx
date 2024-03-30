import { createContext } from 'react';

const AppContext = createContext({
  offsets: {},
  generation: 1,
  setGeneration: () => {},
  totalGenerations: null,
  generationData: {},
  totalPokemon: null,
  selectedTypes: [],
  handleTypeFilter: () => {},
  navigate: () => {},
  getGenIdFromPokeId: () => null, 
});

export default AppContext;