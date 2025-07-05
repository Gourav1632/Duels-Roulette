const HomeScreen = ({ onSelect }: { onSelect: (mode: string) => void }) => {
  return (
    <div className="relative w-full h-screen bg-black text-white font-gothic overflow-hidden">
      {/* Background Image */}
      <img
        src="/game_ui/homescreen.jpg"
        alt="Game Background"
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* Overlay for dimming */}
      <div className="absolute inset-0 bg-black/60 z-10" />

      {/* Menu */}
      <div className="relative z-20 flex flex-col items-center justify-center h-full gap-6 text-center px-4">
         <h1 className="text-5xl md:text-6xl font-bold text-yellow-400 drop-shadow-[0_0_12px_#d4af37] mb-6">
          Chalice of the King
        </h1>

        <div className="flex flex-col gap-4 w-full max-w-xs">
          {['Single Player', 'Multiplayer', 'How to Play', 'Lore', 'About'].map((label) => (
            <button
              key={label}
              onClick={() => onSelect(label)}
              className="text-white text-[28px] hover:text-yellow-400 transition-all duration-200 tracking-wide"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
