import type { ItemType } from '../../../../shared/types/types';

interface ItemSelectorProps {
  items: ItemType[];
  onSelect: (item: ItemType) => void;
  canUseItem: boolean;
}

const ItemSelector = ({ items, onSelect, canUseItem }: ItemSelectorProps) => {
  return (
    <div className="relative w-fit mx-auto bg-[#2a2a2a] border-[6px] border-[#363636] p-2 shadow-[inset_0_0_8px_#000]">
      {/* ✨ Glowing Corners */}
      <div className="absolute w-2 h-2 bg-white top-0 left-0 shadow-[0_0_6px_#ffffff]"></div>
      <div className="absolute w-2 h-2 bg-white top-0 right-0 shadow-[0_0_6px_#ffffff]"></div>
      <div className="absolute w-2 h-2 bg-white bottom-0 left-0 shadow-[0_0_6px_#ffffff]"></div>
      <div className="absolute w-2 h-2 bg-white bottom-0 right-0 shadow-[0_0_6px_#ffffff]"></div>

      {/* Heading */}
      <h2 className="text-white text-sm font-gothic mb-2 text-center tracking-wider">
        Inventory
      </h2>

      {/* Inventory Grid (1x4) */}
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, index) => {
          const item = items[index];
          return (
            <div
              key={index}
              onClick={() => item && canUseItem && onSelect(item)}
              className={`w-12 h-12 border-2 ${
                item
                  ? `border-[#5a5a5a] hover:shadow-[0_0_12px_#ffd700] ${canUseItem ? 'cursor-pointer' : 'cursor-not-allowed'}`
                  : 'border-[#2a2a2a]'
              } bg-[#1e1e1e] flex items-center justify-center transition-all duration-200 `}
            >
              {item && (
                <img
                  src={`/items/${item}.png`}
                  alt={item}
                  className={`w-12 h-12 object-contain pointer-events-none ${canUseItem ? '' : 'grayscale opacity-60'}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ItemSelector;
