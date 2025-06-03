export interface ClimbingLocation {
  id: string;
  name: string;
  location: string;
  imagePath: string;
  description?: string;
}

export const climbingLocations: ClimbingLocation[] = [
  {
    id: 'yosemite',
    name: 'Yosemite National Park',
    location: 'California, USA',
    imagePath: '/climbing-locations/yosemite.jpg',
    description: 'Home to iconic big walls like El Capitan and Half Dome'
  },
  {
    id: 'joshua-tree',
    name: 'Joshua Tree National Park',
    location: 'California, USA',
    imagePath: '/climbing-locations/joshua-tree.jpg',
    description: 'Desert climbing paradise with thousands of routes'
  },
  {
    id: 'red-river-gorge',
    name: 'Red River Gorge',
    location: 'Kentucky, USA',
    imagePath: '/climbing-locations/red-river-gorge.jpg',
    description: 'Premier sport climbing destination in the Southeast'
  },
  {
    id: 'zion',
    name: 'Zion National Park',
    location: 'Utah, USA',
    imagePath: '/climbing-locations/zion.jpg',
    description: 'Massive sandstone walls and desert towers'
  },
  {
    id: 'smith-rock',
    name: 'Smith Rock State Park',
    location: 'Oregon, USA',
    imagePath: '/climbing-locations/smith-rock.jpg',
    description: 'Birthplace of American sport climbing'
  },
  {
    id: 'indian-creek',
    name: 'Indian Creek',
    location: 'Utah, USA',
    imagePath: '/climbing-locations/indian-creek.jpg',
    description: 'World-class crack climbing destination'
  },
  {
    id: 'red-rock',
    name: 'Red Rock Canyon',
    location: 'Nevada, USA',
    imagePath: '/climbing-locations/red-rock.jpg',
    description: 'Year-round climbing on colorful sandstone'
  },
  {
    id: 'moab',
    name: 'Moab (Arches & Fisher Towers)',
    location: 'Utah, USA',
    imagePath: '/climbing-locations/moab.jpg',
    description: 'Desert towers and crack climbing paradise'
  },
  {
    id: 'boulder-canyon',
    name: 'Boulder Canyon',
    location: 'Colorado, USA',
    imagePath: '/climbing-locations/boulder-canyon.jpg',
    description: 'Alpine granite climbing near Boulder'
  },
  {
    id: 'mount-lemmon',
    name: 'Mount Lemmon',
    location: 'Arizona, USA',
    imagePath: '/climbing-locations/mount-lemmon.jpg',
    description: 'High elevation climbing escape from desert heat'
  }
];

// Filtered locations for login screen backgrounds (excluding red-rock, boulder-canyon, mount-lemmon, indian-creek)
export const loginBackgroundLocations = climbingLocations.filter(
  location => !['red-rock', 'boulder-canyon', 'mount-lemmon', 'indian-creek'].includes(location.id)
);

export function getRandomLocation(): ClimbingLocation {
  const randomIndex = Math.floor(Math.random() * climbingLocations.length);
  return climbingLocations[randomIndex];
}

export function getLocationByIndex(index: number): ClimbingLocation {
  return loginBackgroundLocations[index % loginBackgroundLocations.length];
}

export function getNextLocation(currentId: string): ClimbingLocation {
  const currentIndex = climbingLocations.findIndex(loc => loc.id === currentId);
  const nextIndex = (currentIndex + 1) % climbingLocations.length;
  return climbingLocations[nextIndex];
}