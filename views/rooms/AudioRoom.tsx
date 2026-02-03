import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Headphones,
  Check,
  Edit3,
  Trash2,
  Plus,
  ArrowLeft,
  LayoutGrid,
  Library,
  ArrowDownCircle,
  Play,
  LogOut,
  Hash,
} from "lucide-react";
import RavenclawTaurusMascot from "../../components/RavenclawTaurusMascot";
import { AlbumItem, AudioShelfData } from "../../contexts/DataContext";
import { db } from "../../services/firebase";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

// --- IMPORT UTILS ---
import {
  globalStyles,
  getYouTubeId,
  getMoodSearchQuery,
  getMascotMessage,
  searchMusicDatabase,
  getDominantColor,
} from "./utils";
import {
  FlyingBroomMascot,
  MiniPlayer,
  JewelCase3D,
  AddNewAlbum,
} from "./audiosubComponents";
import { DetailModal, EditModal } from "./audiomodals";

// --- IMPORT NEW COMPONENTS ---
import RoomBackground from "./RoomBackground";
import AudioHero from "./AudioHero";
import AudioNewArrivals from "./AudioNewArrivals";

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

interface AudioRoomProps {
  initialMood?: string;
  onExit: () => void;
}

const AudioRoom: React.FC<AudioRoomProps> = ({ initialMood, onExit }) => {
  // --- STATE QUẢN LÝ DỮ LIỆU ---
  const [shelves, setShelves] = useState<AudioShelfData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [focusedShelfId, setFocusedShelfId] = useState<number | null>(null);

  // --- STATE GIAO DIỆN ---
  const [viewMode, setViewMode] = useState<"shelves" | "library">("shelves");
  const [filterType, setFilterType] = useState<"all" | "favorites">("all");
  const [sortType, setSortType] = useState<
    "newest" | "oldest" | "az" | "trending"
  >("newest");

  // --- STATE MÀU SẮC ---
  const [ambientColor, setAmbientColor] = useState<string>("#0f172a");

  const PREVIEW_LIMIT = 8;
  const [viewingItem, setViewingItem] = useState<AlbumItem | null>(null);
  const [editingItem, setEditingItem] = useState<{
    item: AlbumItem;
    shelfId: number;
  } | null>(null);
  const [editingShelfId, setEditingShelfId] = useState<number | null>(null);
  const [tempShelfTitle, setTempShelfTitle] = useState("");
  const shelfRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const [mascotPhase, setMascotPhase] = useState<
    "flying" | "greeting" | "returning" | "idle"
  >("flying");
  const [recommendedTrack, setRecommendedTrack] = useState<AlbumItem | null>(
    null,
  );

  // State index cho Spotlight
  const [spotlightIndex, setSpotlightIndex] = useState(0);

  // --- MUSIC PLAYER STATE ---
  const [activeTrack, setActiveTrack] = useState<AlbumItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<AlbumItem[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const [isLooping, setIsLooping] = useState(false);
  const isLoopingRef = useRef(isLooping);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    isLoopingRef.current = isLooping;
  }, [isLooping]);

  // --- EFFECT: XỬ LÝ ĐỔI MÀU PHÒNG ---
  useEffect(() => {
    if (activeTrack?.coverUrl) {
      getDominantColor(activeTrack.coverUrl).then((color) => {
        setAmbientColor(color);
      });
    } else {
      setAmbientColor("#0f172a");
    }
  }, [activeTrack]);

  // --- LOGIC: REAL-TIME UPDATE ---
  const updatePlayCount = async (track: AlbumItem) => {
    const shelf = shelves.find((s) => s.items.some((i) => i.id === track.id));
    if (!shelf) return;

    const updatedItems = shelf.items.map((i) => {
      if (i.id === track.id) {
        return {
          ...i,
          playCount: (i.playCount || 0) + 1,
          lastPlayed: Date.now(),
        };
      }
      return i;
    });

    try {
      await updateDoc(doc(db, "audio-shelves", String(shelf.id)), {
        items: updatedItems,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleFavoritePlayer = async () => {
    if (!activeTrack) return;
    const shelf = shelves.find((s) =>
      s.items.some((i) => i.id === activeTrack.id),
    );
    if (!shelf) return;
    const updatedItem = { ...activeTrack, isFavorite: !activeTrack.isFavorite };
    setActiveTrack(updatedItem);
    const updatedItems = shelf.items.map((i) =>
      i.id === activeTrack.id ? updatedItem : i,
    );
    await updateDoc(doc(db, "audio-shelves", String(shelf.id)), {
      items: updatedItems,
    });
  };

  // --- LOAD DATA ---
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onSnapshot(
      collection(db, "audio-shelves"),
      (snapshot) => {
        const loadedShelves = snapshot.docs.map(
          (doc) => doc.data() as AudioShelfData,
        );
        loadedShelves.sort((a, b) => a.id - b.id);
        setShelves(loadedShelves);
        setIsLoading(false);
      },
      (error) => {
        console.error(error);
        setIsLoading(false);
      },
    );
    return () => unsubscribe();
  }, []);

  // --- YOUTUBE PLAYER INIT ---
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = () => {
        setIsPlayerReady(true);
      };
    } else {
      setIsPlayerReady(true);
    }
  }, []);

  // --- PLAYER LOGIC ---
  useEffect(() => {
    if (!activeTrack || !activeTrack.trackUrl || !isPlayerReady) return;
    const videoId = getYouTubeId(activeTrack.trackUrl);
    if (!videoId) return;

    if (!playerRef.current) {
      try {
        playerRef.current = new window.YT.Player("youtube-player", {
          height: "0",
          width: "0",
          videoId: videoId,
          playerVars: {
            autoplay: 1,
            controls: 0,
            rel: 0,
            showinfo: 0,
            playsinline: 1,
          },
          events: {
            onReady: (event: any) => {
              event.target.setVolume(volume);
              event.target.playVideo();
              setIsPlaying(true);
              setDuration(event.target.getDuration());
              updatePlayCount(activeTrack);
            },
            onStateChange: (event: any) => {
              if (event.data === window.YT.PlayerState.PLAYING)
                setIsPlaying(true);
              if (event.data === window.YT.PlayerState.PAUSED)
                setIsPlaying(false);
              if (event.data === window.YT.PlayerState.ENDED) {
                if (isLoopingRef.current) {
                  event.target.playVideo();
                  updatePlayCount(activeTrack);
                } else {
                  handleNextTrack();
                }
              }
            },
            onError: (e: any) => console.error("YouTube Player Error:", e),
          },
        });
      } catch (e) {
        console.error("Init Player Failed", e);
      }
    } else {
      if (typeof playerRef.current.loadVideoById === "function") {
        playerRef.current.loadVideoById(videoId);
        setTimeout(() => playerRef.current.playVideo(), 100);
        setIsPlaying(true);
        updatePlayCount(activeTrack);
      }
    }
  }, [activeTrack, isPlayerReady]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (
        playerRef.current &&
        isPlaying &&
        typeof playerRef.current.getCurrentTime === "function"
      ) {
        setCurrentTime(playerRef.current.getCurrentTime());
        setDuration(playerRef.current.getDuration());
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlay = () => {
    if (
      playerRef.current &&
      typeof playerRef.current.playVideo === "function"
    ) {
      if (isPlaying) playerRef.current.pauseVideo();
      else playerRef.current.playVideo();
      setIsPlaying(!isPlaying);
    }
  };
  const handleSeek = (time: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(time, true);
      setCurrentTime(time);
    }
  };
  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    if (playerRef.current) playerRef.current.setVolume(vol);
  };

  const handleNextTrack = () => {
    if (!activeTrack || queue.length === 0) return;
    const currentIndex = queue.findIndex((t) => t.id === activeTrack.id);
    const nextIndex = (currentIndex + 1) % queue.length;
    setActiveTrack(queue[nextIndex]);
  };
  const handlePrevTrack = () => {
    if (!activeTrack || queue.length === 0) return;
    const currentIndex = queue.findIndex((t) => t.id === activeTrack.id);
    const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    setActiveTrack(queue[prevIndex]);
  };

  const playTrackFromShelf = (track: AlbumItem, shelfId: number) => {
    const shelf = shelves.find((s) => s.id === shelfId);
    if (shelf) setQueue(shelf.items);
    else setQueue([track]);
    setActiveTrack(track);
    setViewingItem(null);
  };

  const playSpotlight = (track: AlbumItem) => {
    setQueue([track]);
    setActiveTrack(track);
  };

  // --- MASCOT LOGIC ---
  useEffect(() => {
    const flyTimer = setTimeout(async () => {
      setMascotPhase("greeting");
      if (initialMood) {
        const queries = getMoodSearchQuery(initialMood);
        const randomQuery = queries[Math.floor(Math.random() * queries.length)];
        const results = await searchMusicDatabase(randomQuery);
        if (results.length > 0) {
          const track = results[Math.floor(Math.random() * results.length)];
          setRecommendedTrack({
            ...track,
            id: Date.now(),
            isFavorite: false,
            description: `Gợi ý từ Vũ Trụ vì bạn đang cảm thấy: ${initialMood.toUpperCase()}`,
            trackUrl: track.youtubeSearchLink,
          });
        }
      }
    }, 2500);
    return () => clearTimeout(flyTimer);
  }, [initialMood]);
  const handleMascotClose = () => {
    setMascotPhase("returning");
    setTimeout(() => {
      setMascotPhase("idle");
    }, 1000);
  };

  // --- DATA ACTIONS ---
  const handleAddShelf = async () => {
    const newId = Date.now();
    await setDoc(doc(db, "audio-shelves", String(newId)), {
      id: newId,
      title: "Bộ Sưu Tập Mới",
      items: [],
    });
    setEditingShelfId(newId);
    setTempShelfTitle("Bộ Sưu Tập Mới");
  };
  const handleSaveShelfTitle = async (id: number) => {
    if (!tempShelfTitle.trim()) return;
    await updateDoc(doc(db, "audio-shelves", String(id)), {
      title: tempShelfTitle,
    });
    setEditingShelfId(null);
  };
  const handleDeleteShelf = async (id: number) => {
    if (window.confirm("Xóa kệ này? Các bài hát bên trong sẽ mất.")) {
      await deleteDoc(doc(db, "audio-shelves", String(id)));
    }
  };
  const handleAddNewItem = async (shelfId: number) => {
    const newItem: AlbumItem = {
      id: Date.now(),
      title: "New Track",
      artist: "Unknown",
      coverUrl: "",
      trackUrl: "",
      year: new Date().getFullYear().toString(),
      description: "",
      isFavorite: false,
    };
    const shelf = shelves.find((s) => s.id === shelfId);
    if (shelf) {
      await updateDoc(doc(db, "audio-shelves", String(shelfId)), {
        items: [...shelf.items, newItem],
      });
      setEditingItem({ item: newItem, shelfId });
    }
  };
  const handleSaveItem = async (updatedItem: AlbumItem) => {
    if (!editingItem) return;
    const shelf = shelves.find((s) => s.id === editingItem.shelfId);
    if (shelf) {
      await updateDoc(doc(db, "audio-shelves", String(editingItem.shelfId)), {
        items: shelf.items.map((i) =>
          i.id === updatedItem.id ? updatedItem : i,
        ),
      });
      setEditingItem(null);
    }
  };
  const handleDeleteItem = async (id: number) => {
    if (!editingItem) return;
    const shelf = shelves.find((s) => s.id === editingItem.shelfId);
    if (shelf) {
      await updateDoc(doc(db, "audio-shelves", String(editingItem.shelfId)), {
        items: shelf.items.filter((i) => i.id !== id),
      });
      setEditingItem(null);
    }
  };

  const calculateTrendingScore = (item: AlbumItem) => {
    let score = 0;
    const now = Date.now();
    const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
    score += (item.playCount || 0) * 3;
    if (now - item.id < ONE_WEEK) {
      score += 40;
    }
    if (item.isFavorite) {
      score += 20;
    }
    return score;
  };

  // --- DATA PROCESSING LOGIC ---

  // 1. Tạo danh sách phẳng (All Items)
  const allFlatItems = useMemo(() => {
    return shelves.flatMap((s) => s.items);
  }, [shelves]);

  // 2. Logic New Arrivals
  const newArrivals = useMemo(() => {
    if (allFlatItems.length === 0) return [];
    return [...allFlatItems].sort((a, b) => b.id - a.id).slice(0, 5);
  }, [allFlatItems]);

  // 3. Logic Spotlight Random + CAROUSEL LOGIC
  useEffect(() => {
    if (allFlatItems.length === 0) return;
    // Vẫn giữ random mỗi 10s cho sinh động
    const pickRandom = () => {
      const randomIndex = Math.floor(Math.random() * allFlatItems.length);
      setSpotlightIndex(randomIndex);
    };
    const timer = setInterval(pickRandom, 10000);
    return () => clearInterval(timer);
  }, [allFlatItems.length]);

  // [NEW] Logic Manual Navigation (Next/Prev)
  const handleNextSpotlight = () => {
    if (allFlatItems.length === 0) return;
    setSpotlightIndex((prev) => (prev + 1) % allFlatItems.length);
  };

  const handlePrevSpotlight = () => {
    if (allFlatItems.length === 0) return;
    setSpotlightIndex(
      (prev) => (prev - 1 + allFlatItems.length) % allFlatItems.length,
    );
  };

  const allTracks = useMemo(() => {
    let tracks: { item: AlbumItem; shelfId: number }[] = [];
    shelves.forEach((shelf) => {
      shelf.items.forEach((item) => {
        tracks.push({ item, shelfId: shelf.id });
      });
    });
    if (filterType === "favorites") {
      tracks = tracks.filter((t) => t.item.isFavorite);
    }
    tracks.sort((a, b) => {
      if (sortType === "newest") return b.item.id - a.item.id;
      if (sortType === "oldest") return a.item.id - b.item.id;
      if (sortType === "az") return a.item.title.localeCompare(b.item.title);
      if (sortType === "trending") {
        return calculateTrendingScore(b.item) - calculateTrendingScore(a.item);
      }
      return 0;
    });
    return tracks;
  }, [shelves, filterType, sortType]);

  const [draggedItem, setDraggedItem] = useState<{
    item: AlbumItem;
    sourceShelfId: number;
    sourceIndex: number;
  } | null>(null);

  const handleDragStart = (
    e: React.DragEvent,
    item: AlbumItem,
    shelfId: number,
    index: number,
  ) => {
    if (viewMode === "library") {
      e.preventDefault();
      return;
    }
    setDraggedItem({ item, sourceShelfId: shelfId, sourceIndex: index });
    e.dataTransfer.effectAllowed = "move";
    (e.target as HTMLElement).classList.add("opacity-50");
  };
  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).classList.remove("opacity-50");
    setDraggedItem(null);
  };
  const handleDrop = async (
    e: React.DragEvent,
    targetShelfId: number,
    targetIndex?: number,
  ) => {
    e.preventDefault();
    if (!draggedItem) return;
    const { sourceShelfId, sourceIndex, item } = draggedItem;
    try {
      if (sourceShelfId === targetShelfId) {
        const shelf = shelves.find((s) => s.id === sourceShelfId);
        if (shelf) {
          const newItems = [...shelf.items];
          newItems.splice(sourceIndex, 1);
          const finalIndex =
            targetIndex !== undefined ? targetIndex : newItems.length;
          newItems.splice(finalIndex, 0, item);
          await updateDoc(doc(db, "audio-shelves", String(sourceShelfId)), {
            items: newItems,
          });
        }
      } else {
        const sourceShelf = shelves.find((s) => s.id === sourceShelfId);
        const targetShelf = shelves.find((s) => s.id === targetShelfId);
        if (sourceShelf && targetShelf) {
          const newSourceItems = [...sourceShelf.items];
          newSourceItems.splice(sourceIndex, 1);
          const newTargetItems = [...targetShelf.items];
          const finalIndex =
            targetIndex !== undefined ? targetIndex : newTargetItems.length;
          newTargetItems.splice(finalIndex, 0, item);
          await Promise.all([
            updateDoc(doc(db, "audio-shelves", String(sourceShelfId)), {
              items: newSourceItems,
            }),
            updateDoc(doc(db, "audio-shelves", String(targetShelfId)), {
              items: newTargetItems,
            }),
          ]);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setDraggedItem(null);
  };

  const scrollToShelf = (shelfId: number) => {
    const el = shelfRefs.current.get(shelfId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const shelfGradients = [
    "from-purple-600 to-blue-600",
    "from-emerald-500 to-teal-600",
    "from-orange-500 to-red-600",
    "from-pink-500 to-rose-500",
    "from-cyan-500 to-blue-500",
    "from-violet-600 to-indigo-600",
  ];

  const focusedShelf = focusedShelfId
    ? shelves.find((s) => s.id === focusedShelfId)
    : null;

  return (
    // ROOT CONTAINER
    <div className="relative h-full w-full flex flex-col overflow-hidden text-slate-200 font-space selection:bg-cyan-500/30">
      <style>{globalStyles}</style>

      {/* --- BACKGROUND MỚI --- */}
      <RoomBackground />

      {/* Hidden Youtube Player */}
      <div
        id="youtube-player"
        className="absolute pointer-events-none opacity-0"
      />

      {/* HEADER */}
      <div className="z-30 w-full flex flex-col bg-slate-950/50 backdrop-blur-xl border-b border-white/5 shadow-sm shrink-0 transition-all duration-300">
        {!focusedShelfId && (
          <div className="px-6 py-4 flex flex-col xl:flex-row items-center justify-between gap-6 animate-slide-down">
            {/* 1. LEFT: Logo Area */}
            <div className="flex items-center gap-4 group cursor-pointer self-start xl:self-center">
              <div className="p-3 bg-slate-900/80 rounded-2xl border border-white/10 shadow-[0_0_15px_rgba(34,211,238,0.1)] group-hover:shadow-[0_0_25px_rgba(34,211,238,0.3)] transition-all duration-300">
                <Headphones
                  size={24}
                  className="text-cyan-400 group-hover:text-cyan-300 transition-colors"
                />
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 font-syne tracking-wider uppercase">
                  Quanh<span className="text-cyan-400">Zik</span>
                </h1>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  <p className="text-[10px] text-slate-400 tracking-[0.3em] uppercase font-bold">
                    Sonic Archive
                  </p>
                </div>
              </div>
            </div>

            {/* 2. RIGHT: Controls Area */}
            <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto justify-end">
              {viewMode === "library" && (
                <div className="flex flex-wrap items-center justify-center gap-3 bg-white/5 p-1.5 rounded-xl border border-white/10 backdrop-blur-md">
                  <div className="flex items-center bg-black/20 rounded-lg p-1">
                    <button
                      onClick={() => setFilterType("all")}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-md transition-all uppercase tracking-wider ${
                        filterType === "all"
                          ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20"
                          : "text-slate-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setFilterType("favorites")}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-md transition-all uppercase tracking-wider ${
                        filterType === "favorites"
                          ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                          : "text-slate-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      Favs
                    </button>
                  </div>

                  <div className="w-px h-4 bg-white/10"></div>

                  <div className="flex items-center gap-2 px-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hidden sm:block">
                      Sort:
                    </span>
                    <select
                      value={sortType}
                      onChange={(e) => setSortType(e.target.value as any)}
                      className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer hover:text-cyan-400 transition-colors uppercase border-none focus:ring-0 py-0 pl-0 pr-6"
                      style={{ backgroundImage: "none" }}
                    >
                      <option
                        value="newest"
                        className="bg-slate-900 text-slate-300"
                      >
                        Newest
                      </option>
                      <option
                        value="oldest"
                        className="bg-slate-900 text-slate-300"
                      >
                        Oldest
                      </option>
                      <option
                        value="az"
                        className="bg-slate-900 text-slate-300"
                      >
                        A-Z
                      </option>
                      <option
                        value="trending"
                        className="bg-slate-900 text-amber-400"
                      >
                        ★ Trending
                      </option>
                    </select>
                  </div>
                  <div className="w-px h-4 bg-white/10"></div>
                  <div className="px-2">
                    <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/50 border border-cyan-500/30 px-2 py-1 rounded">
                      {allTracks.length}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="flex items-center p-1 rounded-xl bg-slate-900/80 border border-white/5 backdrop-blur-md">
                  <button
                    onClick={() => setViewMode("shelves")}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                      viewMode === "shelves"
                        ? "bg-cyan-600 text-white shadow-lg shadow-cyan-500/20"
                        : "text-slate-500 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <LayoutGrid size={14} />{" "}
                    <span className="hidden sm:inline">Shelves</span>
                  </button>
                  <button
                    onClick={() => setViewMode("library")}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                      viewMode === "library"
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                        : "text-slate-500 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Library size={14} />{" "}
                    <span className="hidden sm:inline">List</span>
                  </button>
                </div>

                <button
                  onClick={onExit}
                  className="group relative p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-lg"
                  title="Exit Room"
                >
                  <LogOut
                    size={18}
                    className="group-hover:-translate-x-0.5 transition-transform"
                  />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MAIN CONTENT BODY */}
      <div
        className={`flex-1 w-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent px-4 z-10 ${
          activeTrack ? "pb-40" : "pb-10"
        }`}
      >
        <div className="max-w-7xl mx-auto min-h-[500px] pt-6">
          {/* 1. CINEMATIC HERO BANNER (UPDATED WITH NAVIGATION) */}
          {!focusedShelfId &&
            viewMode === "shelves" &&
            allFlatItems.length > 0 && (
              <AudioHero
                item={allFlatItems[spotlightIndex % allFlatItems.length]}
                onPlay={playSpotlight}
                onViewDetail={setViewingItem}
                onNext={handleNextSpotlight} // [NEW]
                onPrev={handlePrevSpotlight} // [NEW]
              />
            )}

          {/* 2. TOP TRENDING */}
          {viewMode === "shelves" &&
            !focusedShelfId &&
            newArrivals.length > 0 && (
              <AudioNewArrivals items={newArrivals} onPlay={playSpotlight} />
            )}

          {/* 3. QUICK ACCESS SHELVES */}
          {viewMode === "shelves" && !focusedShelfId && shelves.length > 0 && (
            <div className="mb-20 animate-fade-in-up delay-200">
              <div className="flex items-center gap-3 mb-6 px-2">
                <Hash className="text-cyan-400" size={20} />
                <h3 className="text-lg font-bold font-syne uppercase tracking-widest text-slate-300">
                  Quick Access / Categories
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {shelves.map((shelf, index) => (
                  <div
                    key={`shortcut-${shelf.id}`}
                    onClick={() => scrollToShelf(shelf.id)}
                    className={`
                      relative group cursor-pointer overflow-hidden rounded-2xl p-4 h-28
                      bg-gradient-to-br ${
                        shelfGradients[index % shelfGradients.length]
                      }
                      shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300
                      flex flex-col justify-between border border-white/10 ring-1 ring-white/5
                    `}
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-full blur-2xl transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />

                    <div className="relative z-10">
                      <h4 className="font-bold text-white text-base leading-tight drop-shadow-md line-clamp-2 group-hover:tracking-wide transition-all">
                        {shelf.title}
                      </h4>
                    </div>

                    <div className="relative z-10 flex items-end justify-between mt-2">
                      <span className="text-[10px] font-mono bg-black/20 px-2 py-0.5 rounded-md text-white/90 backdrop-blur-sm border border-white/10">
                        {shelf.items.length} TRACKS
                      </span>
                      <ArrowDownCircle
                        size={20}
                        className="text-white/70 group-hover:text-white transition-colors transform group-hover:translate-y-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SHELF VIEW (GRID DISPLAY) */}
          {viewMode === "shelves" && !focusedShelfId && (
            <div className="flex flex-col gap-16 pb-20">
              {shelves.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center mt-20 opacity-50">
                  <LayoutGrid size={48} className="text-slate-600 mb-4" />
                  <p className="text-slate-500 italic font-mono">
                    Không gian trống rỗng. Khởi tạo dữ liệu ngay.
                  </p>
                </div>
              )}

              {shelves.map((shelf) => (
                <div
                  key={shelf.id}
                  ref={(el) => {
                    if (el) shelfRefs.current.set(shelf.id, el);
                  }}
                  className="relative group/shelf transition-all duration-500 bg-white/[0.02] rounded-3xl p-6 border border-white/5 hover:border-white/10 hover:bg-white/[0.04]"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, shelf.id)}
                >
                  {/* Shelf Header */}
                  <div className="flex items-end gap-4 mb-6 px-2 border-b border-white/5 pb-4">
                    <h2
                      className="text-2xl font-bold text-white group-hover/shelf:text-cyan-400 font-syne uppercase tracking-wider cursor-pointer transition-colors"
                      onClick={() => setFocusedShelfId(shelf.id)}
                    >
                      {shelf.title}
                    </h2>
                    <span className="text-xs text-slate-500 font-mono mb-1 bg-slate-800 px-2 py-0.5 rounded-full border border-white/5">
                      {shelf.items.length}
                    </span>

                    <div className="ml-auto flex gap-1 opacity-0 group-hover/shelf:opacity-100 transition-all transform translate-x-4 group-hover/shelf:translate-x-0">
                      <button
                        onClick={() => {
                          setEditingShelfId(shelf.id);
                          setTempShelfTitle(shelf.title);
                        }}
                        className="p-2 hover:bg-cyan-500/20 rounded-lg text-slate-400 hover:text-cyan-300 transition-all"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteShelf(shelf.id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-300 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Quick Edit Shelf Title */}
                    {editingShelfId === shelf.id && (
                      <div className="absolute left-6 top-16 bg-slate-900 p-3 border border-cyan-500 rounded-xl shadow-2xl z-20 flex gap-2 animate-zoom-in">
                        <input
                          autoFocus
                          className="bg-transparent border-b border-cyan-500/50 text-white text-sm outline-none w-48 font-bold"
                          value={tempShelfTitle}
                          onChange={(e) => setTempShelfTitle(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleSaveShelfTitle(shelf.id)
                          }
                        />
                        <button
                          onClick={() => handleSaveShelfTitle(shelf.id)}
                          className="hover:bg-green-500/20 p-1 rounded"
                        >
                          <Check size={16} className="text-green-400" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Shelf Items GRID LAYOUT */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 px-2">
                    {shelf.items.slice(0, PREVIEW_LIMIT).map((item, index) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) =>
                          handleDragStart(e, item, shelf.id, index)
                        }
                        onDragEnd={handleDragEnd}
                        onDrop={(e) => {
                          e.stopPropagation();
                          handleDrop(e, shelf.id, index);
                        }}
                        className="group/item relative w-full aspect-video transition-transform duration-300 hover:-translate-y-2 hover:z-10"
                      >
                        <JewelCase3D
                          item={item}
                          isPlayingThis={
                            activeTrack?.id === item.id && isPlaying
                          }
                          onClick={() => playTrackFromShelf(item, shelf.id)}
                          onEdit={() =>
                            setEditingItem({ item, shelfId: shelf.id })
                          }
                        />
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-2 bg-black/50 blur-md rounded-full group-hover/item:scale-125 transition-transform duration-300"></div>
                      </div>
                    ))}
                    <AddNewAlbum onClick={() => handleAddNewItem(shelf.id)} />
                    {shelf.items.length > PREVIEW_LIMIT && (
                      <div
                        onClick={() => setFocusedShelfId(shelf.id)}
                        className="w-full aspect-video flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] hover:border-cyan-500/50 hover:text-cyan-400 transition-all cursor-pointer group"
                      >
                        <span className="text-2xl font-bold text-slate-600 group-hover:text-cyan-400 transition-colors">
                          +{shelf.items.length - PREVIEW_LIMIT}
                        </span>
                        <span className="text-[9px] text-slate-600 uppercase tracking-widest mt-1">
                          View All
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex justify-center pb-10">
                <button
                  onClick={handleAddShelf}
                  className="group px-8 py-4 rounded-full border border-dashed border-slate-600 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/50 hover:bg-cyan-950/20 transition-all uppercase font-mono text-xs font-bold tracking-[0.2em] flex items-center gap-3 shadow-lg hover:shadow-cyan-900/20"
                >
                  <Plus
                    size={18}
                    className="group-hover:rotate-90 transition-transform duration-300"
                  />{" "}
                  Initialize New Shelf
                </button>
              </div>
            </div>
          )}

          {/* LIBRARY MODE (FLAT VIEW) */}
          {viewMode === "library" && !focusedShelfId && (
            <div className="py-8 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {allTracks.length === 0 ? (
                  <div className="col-span-full text-center text-slate-500 italic py-20 font-mono">
                    No data found in archive.
                  </div>
                ) : (
                  allTracks.map(({ item, shelfId }) => (
                    <div
                      key={item.id}
                      className="w-full aspect-video hover:-translate-y-2 transition-transform duration-300"
                    >
                      <JewelCase3D
                        item={item}
                        isPlayingThis={activeTrack?.id === item.id && isPlaying}
                        onClick={() => playTrackFromShelf(item, shelfId)}
                        onEdit={() => setEditingItem({ item, shelfId })}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* FOCUSED SHELF MODE (FULL VIEW) */}
          {focusedShelf && (
            <div className="animate-zoom-in py-4">
              <div className="flex items-center gap-6 mb-10 border-b border-white/5 pb-6">
                <button
                  onClick={() => setFocusedShelfId(null)}
                  className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all hover:-translate-x-1"
                >
                  <ArrowLeft size={24} />
                </button>
                <div>
                  <h2 className="text-4xl font-bold text-white font-syne uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                    {focusedShelf.title}
                  </h2>
                  <p className="text-slate-500 font-mono text-xs mt-2 uppercase tracking-widest">
                    Full Collection View
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {focusedShelf.items.map((item, index) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) =>
                      handleDragStart(e, item, focusedShelf.id, index)
                    }
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => {
                      e.stopPropagation();
                      handleDrop(e, focusedShelf.id, index);
                    }}
                    className="w-full aspect-video hover:-translate-y-2 transition-transform duration-300"
                  >
                    <JewelCase3D
                      item={item}
                      isPlayingThis={activeTrack?.id === item.id && isPlaying}
                      onClick={() => playTrackFromShelf(item, focusedShelf.id)}
                      onEdit={() =>
                        setEditingItem({ item, shelfId: focusedShelf.id })
                      }
                    />
                  </div>
                ))}
                <AddNewAlbum
                  onClick={() => handleAddNewItem(focusedShelf.id)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MASCOTS & MODALS LAYER */}
      {mascotPhase === "flying" && (
        <div className="fixed z-50 w-full h-full pointer-events-none">
          <FlyingBroomMascot />
        </div>
      )}

      {mascotPhase === "greeting" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md transition-all duration-500">
          <div className="relative flex flex-col items-center animate-zoom-in p-10">
            <div className="bg-slate-900/50 p-8 rounded-full border border-cyan-500/20 shadow-[0_0_100px_rgba(6,182,212,0.2)]">
              <RavenclawTaurusMascot
                greeting={
                  initialMood
                    ? getMascotMessage(initialMood)
                    : "Welcome to QuanhZik Archive"
                }
                variant="music"
                className="scale-150 origin-bottom"
              />
            </div>
            {initialMood && recommendedTrack ? (
              <div
                className="mt-10 bg-slate-900/90 border border-amber-500/30 p-5 rounded-2xl flex items-center gap-5 shadow-[0_0_50px_rgba(251,191,36,0.15)] animate-appear-from-void max-w-md cursor-pointer hover:bg-slate-800 transition-all transform hover:scale-105 hover:border-amber-500/60"
                onClick={() => {
                  setViewingItem(recommendedTrack);
                  setMascotPhase("idle");
                }}
              >
                <img
                  src={recommendedTrack.coverUrl || ""}
                  className="w-20 h-20 rounded-xl object-cover shadow-lg"
                  alt="Recommended"
                />
                <div className="text-left flex-1 min-w-0">
                  <div className="text-[10px] text-amber-400 uppercase font-bold tracking-widest mb-1">
                    Cosmic Recommendation
                  </div>
                  <div className="text-white font-bold text-lg truncate font-syne">
                    {recommendedTrack.title}
                  </div>
                  <div className="text-white/60 text-sm truncate">
                    {recommendedTrack.artist}
                  </div>
                </div>
                <div className="p-4 bg-amber-500 rounded-full text-white shadow-lg shadow-amber-500/40 animate-pulse">
                  <Play size={24} fill="currentColor" />
                </div>
              </div>
            ) : (
              <button
                onClick={handleMascotClose}
                className="mt-10 px-10 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-full font-bold shadow-lg shadow-cyan-500/30 hover:scale-105 transition-transform uppercase tracking-widest text-sm"
              >
                Access Archive
              </button>
            )}
          </div>
        </div>
      )}

      {/* MINI PLAYER WRAPPER */}
      <div
        className="w-full sticky bottom-0 z-40 transition-all duration-700 ease-in-out"
        style={{
          boxShadow: activeTrack ? `0 -10px 100px ${ambientColor}50` : "none",
        }}
      >
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none -z-10"></div>
        <MiniPlayer
          currentTrack={activeTrack}
          isPlaying={isPlaying}
          onTogglePlay={togglePlay}
          onNext={handleNextTrack}
          onPrev={handlePrevTrack}
          currentTime={currentTime}
          duration={duration}
          onSeek={handleSeek}
          volume={volume}
          onVolumeChange={handleVolumeChange}
          isLooping={isLooping}
          onToggleLoop={() => setIsLooping(!isLooping)}
          onToggleFavorite={handleToggleFavoritePlayer}
        />
      </div>

      {/* MODALS */}
      {viewingItem && (
        <DetailModal
          item={viewingItem}
          onClose={() => setViewingItem(null)}
          onPlay={() => {
            playTrackFromShelf(
              viewingItem,
              shelves.find((s) => s.items.some((i) => i.id === viewingItem.id))
                ?.id || 0,
            );
            setViewingItem(null);
          }}
          onAddToQueue={() => {
            setQueue((prev) => [...prev, viewingItem]);
            setViewingItem(null);
          }}
        />
      )}
      {editingItem && (
        <EditModal
          item={editingItem.item}
          onClose={() => setEditingItem(null)}
          onSave={handleSaveItem}
          onDelete={handleDeleteItem}
        />
      )}
    </div>
  );
};
export default AudioRoom;
