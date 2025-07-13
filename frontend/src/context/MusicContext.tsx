import React, { createContext, useContext, useState, useRef } from "react";
import { Howl } from "howler";
import { attributions } from "../data/attributions";

type MusicContextType = {
  isPlaying: boolean;
  currentTrackIndex: number;
  volume: number;
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  setVolume: (v: number) => void;
  currentTrack: typeof attributions[0];
};

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const soundRef = useRef<Howl | null>(null);

  const playTrack = (index: number = currentTrackIndex) => {
    if (soundRef.current) {
      soundRef.current.stop();
      soundRef.current.unload();
    }

    soundRef.current = new Howl({
      src: [attributions[index].path],
      loop: true,
      volume: volume,
      onend: () => {
        next();
      },
    });

    soundRef.current.play();
    setCurrentTrackIndex(index);
    setIsPlaying(true);
  };

  const play = () => {
    if (!soundRef.current) {
      playTrack();
    } else {
      soundRef.current.play();
      setIsPlaying(true);
    }
  };

  const pause = () => {
    soundRef.current?.pause();
    setIsPlaying(false);
  };

  const next = () => {
    const nextIndex = (currentTrackIndex + 1) % attributions.length;
    playTrack(nextIndex);
  };

  const prev = () => {
    const prevIndex = (currentTrackIndex - 1 + attributions.length) % attributions.length;
    playTrack(prevIndex);
  };

  const changeVolume = (v: number) => {
    setVolume(v);
    soundRef.current?.volume(v);
  };

  return (
    <MusicContext.Provider
      value={{
        isPlaying,
        currentTrackIndex,
        volume,
        play,
        pause,
        next,
        prev,
        setVolume: changeVolume,
        currentTrack: attributions[currentTrackIndex] ?? attributions[0],
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error("useMusic must be used within a MusicProvider");
  }
  return context;
};
