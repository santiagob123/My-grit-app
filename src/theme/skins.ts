export interface Skin {
  id: string;
  name: string;
  requirement: string;
  minLevel?: number;
  borderRadius: number;
  borderWidth: number;
  showGlow: boolean;
  cardElevation: number;
  shadowStyle?: any;
}

export const SKINS: Skin[] = [
  {
    id: 'classic',
    name: 'Classic Grit',
    requirement: 'Nivel 1',
    minLevel: 1,
    borderRadius: 24,
    borderWidth: 1,
    showGlow: false,
    cardElevation: 2,
  },
  {
    id: 'fire',
    name: 'Inferno',
    requirement: 'Nivel 2',
    minLevel: 2,
    borderRadius: 12,
    borderWidth: 2,
    showGlow: true,
    cardElevation: 8,
  },
  {
    id: 'ice',
    name: 'Frozen',
    requirement: 'Nivel 3',
    minLevel: 3,
    borderRadius: 40,
    borderWidth: 1,
    showGlow: true,
    cardElevation: 4,
  },
  {
    id: 'minecraft',
    name: 'BlockWorld',
    requirement: 'Nivel 5',
    minLevel: 5,
    borderRadius: 0,
    borderWidth: 4,
    showGlow: false,
    cardElevation: 0,
    shadowStyle: {
      shadowColor: '#000',
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 0.8,
      shadowRadius: 0,
      elevation: 4,
    }
  },
  {
    id: 'football',
    name: 'Stadium',
    requirement: 'Nivel 7',
    minLevel: 7,
    borderRadius: 100,
    borderWidth: 3,
    showGlow: false,
    cardElevation: 5,
  }
];
