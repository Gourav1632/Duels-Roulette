import React from "react";

const items = [
  {
    name: "Royal Scrutiny Glass",
    key: "royal_scrutiny_glass",
    effect: "Reveal if the current chalice is poisoned or holy.",
  },
  {
    name: "Verdict Amplifier",
    key: "verdict_amplifier",
    effect: "Double the effect of the chalice (twice as poisonous or holy).",
  },
  {
    name: "Crown Disavowal",
    key: "crown_disavowal",
    effect: "Vaporize the chalice’s contents—safe or deadly.",
  },
  {
    name: "Royal Chain Order",
    key: "royal_chain_order",
    effect: "Restrain a player, preventing them from acting next turn.",
  },
  {
    name: "Sovereign Potion",
    key: "sovereign_potion",
    effect: "Restore 1 life to yourself.",
  },
  {
    name: "Chronicle Ledger",
    key: "chronicle_ledger",
    effect: "Peek into the future—see the contents of a random upcoming chalice.",
  },
  {
    name: "Paradox Dial",
    key: "paradox_dial",
    effect: "Flip the chalice’s nature—poison becomes holy, and vice versa.",
  },
  {
    name: "Thief's Tooth",
    key: "thiefs_tooth",
    effect: "Steal a random item from another player.",
  },
];

const HowToPlay = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-[#1b1a1a] text-white rounded-2xl shadow-lg space-y-6">
      <h1 className="text-4xl font-bold text-center text-yellow-400">How to Play</h1>

      <section className="space-y-2 text-lg">
        <p>
          Welcome to <span className="font-semibold text-yellow-300">Chalice of King</span> — a
          deadly court game of deception, fate, and cunning.
        </p>
        <p>
          You and your opponents sit at the royal table, where mysterious chalices await. Some
          contain holy blessings. Others… death.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-2xl font-bold text-yellow-300">Game Modes</h2>
        <ul className="list-disc list-inside space-y-1 text-lg">
          <li>
            <strong>Single Player:</strong> Face off against a cunning AI.
          </li>
          <li>
            <strong>Multiplayer:</strong> Battle with up to 4 players in turn-based chaos.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-2xl font-bold text-yellow-300">Turn Actions</h2>
        <ul className="list-disc list-inside space-y-1 text-lg">
          <li>
            <strong>Drink:</strong> Brave the unknown and sip from a chalice.
          </li>
          <li>
            <strong>Offer:</strong> Politely pass the chalice to another… friend or foe.
          </li>
          <li>
            <strong>Force:</strong> Make another player drink—willing or not.
          </li>
        </ul>
        <p className="text-sm italic text-gray-400">
          Use your instincts, items, and deceit to survive the king’s game.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-yellow-300 mb-2">Items & Artifacts</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((item) => (
            <div
              key={item.key}
              className="bg-[#2a2a2a] p-4 rounded-xl border border-yellow-800"
            >
              <h3 className="text-xl font-semibold text-yellow-200">{item.name}</h3>
              <p className="text-sm text-gray-300">{item.effect}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="text-center text-md italic text-gray-400 mt-8">
        <p>Only one shall rise. The rest shall drink... their fate.</p>
      </section>
    </div>
  );
};

export default HowToPlay;
