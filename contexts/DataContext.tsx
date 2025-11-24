import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// --- Types (Moved/Shared) ---
export interface CoffeeItem {
  id: number;
  name: string;
  region: string;
  process: string;
  notes: string;
  colorFrom: string;
  colorTo: string;
  roast: 'Light' | 'Medium' | 'Dark' | 'Omni';
}

export interface CafeShelfData {
  id: number;
  title: string;
  items: CoffeeItem[];
}

export interface AlbumItem {
  id: number;
  title: string;
  artist: string;
  coverUrl: string;
  trackUrl: string;
  year: string;
  description?: string;
  isFavorite?: boolean;
}

export interface AudioShelfData {
  id: number;
  title: string;
  items: AlbumItem[];
}

// --- Initial Data ---
const INITIAL_CAFE_SHELVES: CafeShelfData[] = [
  {
    id: 1,
    title: "Premium Arabica Collection",
    items: [
      {
        id: 101,
        name: "Panama Geisha",
        region: "Boquete",
        process: "Washed",
        notes: "Jasmine, Bergamot, Honey",
        colorFrom: "#f472b6",
        colorTo: "#be185d",
        roast: "Light",
      },
      {
        id: 102,
        name: "Ethiopia Yirgacheffe",
        region: "Gedeo",
        process: "Natural",
        notes: "Blueberry, Lemon",
        colorFrom: "#facc15",
        colorTo: "#ea580c",
        roast: "Light",
      }
    ]
  },
  {
    id: 2,
    title: "Experimental & Blends",
    items: [
      {
        id: 201,
        name: "Cau Dat Arabica",
        region: "Vietnam",
        process: "Honey",
        notes: "Caramel, Chocolate",
        colorFrom: "#60a5fa",
        colorTo: "#1e3a8a",
        roast: "Medium",
      }
    ]
  }
];

const INITIAL_AUDIO_SHELVES: AudioShelfData[] = [
  {
    id: 1,
    title: "Favorites Playlist",
    items: [
      {
        id: 101,
        title: "Random Access Memories",
        artist: "Daft Punk",
        coverUrl: "https://upload.wikimedia.org/wikipedia/en/a/a7/Random_Access_Memories.jpg",
        trackUrl: "https://open.spotify.com/album/4m2880jivSbbyEGqf539qK",
        year: "2013",
        description: "A homage to the late 1970s and early 1980s US disco and boogie era.",
        isFavorite: true
      },
      {
        id: 102,
        title: "The Dark Side of the Moon",
        artist: "Pink Floyd",
        coverUrl: "https://upload.wikimedia.org/wikipedia/en/3/3b/Dark_Side_of_the_Moon.png",
        trackUrl: "",
        year: "1973",
        description: "A concept album that explores themes such as conflict, greed, time, death, and mental illness.",
        isFavorite: true
      }
    ]
  },
  {
    id: 2,
    title: "Late Night Lo-Fi",
    items: [
      {
        id: 201,
        title: "Nostalgia",
        artist: "Various Artists",
        coverUrl: "https://f4.bcbits.com/img/a1637693293_65",
        trackUrl: "",
        year: "2024",
        description: "Beats to relax and study to."
      }
    ]
  }
];

// --- Context Definition ---
interface DataContextType {
  cafeShelves: CafeShelfData[];
  setCafeShelves: React.Dispatch<React.SetStateAction<CafeShelfData[]>>;
  audioShelves: AudioShelfData[];
  setAudioShelves: React.Dispatch<React.SetStateAction<AudioShelfData[]>>;
  exportData: () => void;
  importData: (file: File) => Promise<boolean>;
  resetData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state from LocalStorage or Default
  const [cafeShelves, setCafeShelves] = useState<CafeShelfData[]>(() => {
    const saved = localStorage.getItem('mind_palace_cafe');
    return saved ? JSON.parse(saved) : INITIAL_CAFE_SHELVES;
  });

  const [audioShelves, setAudioShelves] = useState<AudioShelfData[]>(() => {
    const saved = localStorage.getItem('mind_palace_audio');
    return saved ? JSON.parse(saved) : INITIAL_AUDIO_SHELVES;
  });

  // Sync with LocalStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('mind_palace_cafe', JSON.stringify(cafeShelves));
  }, [cafeShelves]);

  useEffect(() => {
    localStorage.setItem('mind_palace_audio', JSON.stringify(audioShelves));
  }, [audioShelves]);

  // --- Actions ---

  const exportData = () => {
    const data = {
      cafe: cafeShelves,
      audio: audioShelves,
      version: 1,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mind_palace_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importData = (file: File): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          
          if (json.cafe) setCafeShelves(json.cafe);
          if (json.audio) setAudioShelves(json.audio);
          
          resolve(true);
        } catch (error) {
          console.error("Invalid backup file", error);
          resolve(false);
        }
      };
      reader.onerror = () => resolve(false);
      reader.readAsText(file);
    });
  };

  const resetData = () => {
    if (window.confirm("Are you sure? This will wipe all current data and restore defaults.")) {
      setCafeShelves(INITIAL_CAFE_SHELVES);
      setAudioShelves(INITIAL_AUDIO_SHELVES);
      localStorage.removeItem('mind_palace_cafe');
      localStorage.removeItem('mind_palace_audio');
    }
  };

  return (
    <DataContext.Provider value={{
      cafeShelves,
      setCafeShelves,
      audioShelves,
      setAudioShelves,
      exportData,
      importData,
      resetData
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};