import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";

const RadioContext = createContext();

export function RadioProvider({ children }) {
  const [currentStation, setCurrentStation] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [recentStations, setRecentStations] = useState([]);

  const audioRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);
  const playPromiseRef = useRef(null);

  // Load favorites and recent from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem("radioFavorites");
    const savedRecent = localStorage.getItem("radioRecent");
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
    if (savedRecent) setRecentStations(JSON.parse(savedRecent));
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem("radioFavorites", JSON.stringify(favorites));
  }, [favorites]);

  // Save recent to localStorage
  useEffect(() => {
    localStorage.setItem(
      "radioRecent",
      JSON.stringify(recentStations.slice(0, 10))
    );
  }, [recentStations]);

  // Setup audio analyser
  const setupAnalyser = useCallback(() => {
    if (!audioRef.current) return;

    try {
      if (analyserRef.current) {
        analyserRef.current.disconnect();
      }

      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaElementSource(audioRef.current);

      source.connect(analyser);
      analyser.connect(audioContext.destination);
      analyser.fftSize = 256;

      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateVisualizer = () => {
        if (!analyserRef.current || !audioRef.current) {
          return;
        }
        try {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average =
            dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setAudioLevel(average / 255);
          animationRef.current = requestAnimationFrame(updateVisualizer);
        } catch (err) {
          console.warn("Visualizer update error:", err);
        }
      };

      updateVisualizer();
      audioContext
        .resume()
        .catch((err) => console.warn("AudioContext resume error:", err));
    } catch (err) {
      console.warn("Analyser setup error:", err);
    }
  }, []);

  // Stop playback
  const stopPlayback = useCallback(async () => {
    if (playPromiseRef.current) {
      try {
        await playPromiseRef.current;
      } catch (err) {
        // Ignore promise errors
      }
      playPromiseRef.current = null;
    }

    if (audioRef.current) {
      try {
        await audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current.load();
      } catch (err) {
        console.warn("Pause error:", err);
      }
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch (err) {
        console.warn("Disconnect error:", err);
      }
      analyserRef.current = null;
    }

    setIsPlaying(false);
    setAudioLevel(0);
  }, []);

  // Play station
  const playStation = useCallback(
    async (station) => {
      if (!audioRef.current) return;

      if (currentStation?.src === station.src && isPlaying) {
        await stopPlayback();
        setCurrentStation(null);
        return;
      }

      await stopPlayback();

      setError(null);
      setIsLoading(true);
      setCurrentStation(station);

      try {
        const audio = audioRef.current;
        audio.src = station.src;
        audio.volume = volume / 100;
        audio.crossOrigin = "anonymous";
        audio.load();

        await new Promise((resolve, reject) => {
          const timeout = setTimeout(
            () => reject(new Error("Load timeout")),
            10000
          );

          const canPlayHandler = () => {
            clearTimeout(timeout);
            audio.removeEventListener("canplaythrough", canPlayHandler);
            audio.removeEventListener("error", errorHandler);
            resolve();
          };

          const errorHandler = (e) => {
            clearTimeout(timeout);
            audio.removeEventListener("canplaythrough", canPlayHandler);
            audio.removeEventListener("error", errorHandler);
            reject(
              new Error(
                `Failed to load: ${audio.error?.message || "Unknown error"}`
              )
            );
          };

          audio.addEventListener("canplaythrough", canPlayHandler);
          audio.addEventListener("error", errorHandler);
        });

        const playPromise = audio.play();
        playPromiseRef.current = playPromise;

        if (playPromise !== undefined) {
          await playPromise;
          setIsPlaying(true);
          setupAnalyser();

          setRecentStations((prev) => {
            const filtered = prev.filter((s) => s.src !== station.src);
            return [station, ...filtered].slice(0, 10);
          });
        }
      } catch (err) {
        console.error("Playback error:", err);
        setError(
          `Unable to play "${station.name}". The station might be offline.`
        );
        setIsPlaying(false);
        setCurrentStation(null);

        if (audioRef.current) {
          audioRef.current.src = "";
        }
      } finally {
        setIsLoading(false);
      }
    },
    [currentStation, isPlaying, volume, stopPlayback, setupAnalyser]
  );

  // Handle volume change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, [stopPlayback]);

  // Toggle favorite
  const toggleFavorite = useCallback((station) => {
    setFavorites((prev) => {
      const isFavorite = prev.some((s) => s.src === station.src);
      if (isFavorite) {
        return prev.filter((s) => s.src !== station.src);
      } else {
        return [...prev, station];
      }
    });
  }, []);

  const value = {
    currentStation,
    isPlaying,
    volume,
    audioLevel,
    isLoading,
    error,
    favorites,
    recentStations,
    playStation,
    stopPlayback,
    setVolume,
    toggleFavorite
  };

  return (
    <RadioContext.Provider value={value}>
      <audio ref={audioRef} style={{ display: "none" }} />
      {children}
    </RadioContext.Provider>
  );
}

export function useRadio() {
  const context = useContext(RadioContext);
  if (!context) {
    throw new Error("useRadio must be used within RadioProvider");
  }
  return context;
}
