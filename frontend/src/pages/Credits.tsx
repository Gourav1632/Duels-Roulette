import { attributions } from "../data/attributions";

const Credits = () => {

  return (
    <div className="relative w-full flex items-center justify-center min-h-screen overflow-auto">
      {/* Background Image */}
      <img
        src="/game_ui/homescreen.jpg"
        alt="Game Background"
        className="fixed inset-0 w-full h-full object-cover z-0"
      />

      {/* Dark Overlay */}
      <div className="fixed inset-0 bg-black/60 z-10" />

      {/* Foreground Content */}
      <div className="relative  z-20 max-w-4xl mx-auto p-6 text-white">
        {/* Outer wrapper with glowing corners */}
        <div className="relative">
          {/* ✨ Glowing Corners */}
          <div className="absolute w-2 h-2 bg-white top-[6px] left-[6px] shadow-[0_0_6px_#ffffff]" />
          <div className="absolute w-2 h-2 bg-white top-[6px] right-[6px] shadow-[0_0_6px_#ffffff]" />
          <div className="absolute w-2 h-2 bg-white bottom-[6px] left-[6px] shadow-[0_0_6px_#ffffff]" />
          <div className="absolute w-2 h-2 bg-white bottom-[6px] right-[6px] shadow-[0_0_6px_#ffffff]" />

          {/* Main Credit Box */}
          <div className="bg-[#2a2a2a] border-[6px] border-[#363636] shadow-[inset_0_0_8px_#000] p-6 space-y-8 font-medievalsharp">
            <h1 className="text-4xl font-bold text-center text-yellow-400">Credits</h1>

            <section className="space-y-2 text-center text-lg">
              <h2 className="text-2xl font-bold text-yellow-300">Inspiration</h2>
              <p className="text-gray-300">
                Inspired by the intense and mysterious atmosphere of <span className="text-yellow-200 font-semibold">Buckshot Roulette</span>.
              </p>
            </section>

            <section className="space-y-2 text-center text-lg">
              <h2 className="text-2xl font-bold text-yellow-300">Game Design & Art</h2>
              <p className="text-gray-300">Original Design & Development by <span className="text-yellow-200 font-semibold">Gourav Kumar</span></p>
              <p className="text-gray-300">Art and ideas with a little help from <span className="text-yellow-200 font-semibold">Sora :)</span></p>
            </section>

            <section className="space-y-2 text-center text-lg">
              <h2 className="text-2xl font-bold text-yellow-300">Music</h2>
                {attributions.map((attr, index) => (
                    <div key={index} className="text-gray-300">
                    <p>
                        <span className="text-yellow-200 font-semibold">{attr.title}</span> by {attr.artist}
                    </p>
                    <p className="text-sm text-gray-400">Source: {attr.source}</p>
                    <p className="text-sm text-gray-400">Licensed: {attr.license}</p>
                    </div>
                ))}
            </section>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Credits;
