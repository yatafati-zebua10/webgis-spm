import { ChevronUp, ChevronDown } from 'lucide-react';

interface MobileToggleProps {
  isOpen: boolean;
  onClick: () => void;
}

export function MobileToggle({ isOpen, onClick }: MobileToggleProps) {
  // Always render on mobile, hidden on desktop
  return (
    <>
      {/* Sidebar leak/peek when closed */}
      {!isOpen && (
        <div 
          className="
            fixed z-[1090]
            lg:hidden
            bottom-0 left-0 right-0
            h-6
            bg-sidebar/80 backdrop-blur-sm
            rounded-t-xl
            border-t border-sidebar-border
          "
          onClick={onClick}
        />
      )}
      
      {/* Toggle button - bottom left, moves with sidebar */}
      <button
        onClick={onClick}
        className={`
          fixed z-[1200]
          lg:hidden
          left-3
          px-3 py-2
          flex items-center justify-center gap-1.5
          rounded-full
          shadow-elevated
          transition-all duration-300 ease-out
          gradient-primary text-primary-foreground
          font-medium text-xs
          active:scale-95
          ${isOpen 
            ? 'bottom-[calc(65vh-0.5rem)]' 
            : 'bottom-8'
          }
        `}
        aria-label={isOpen ? "Tutup sidebar" : "Buka sidebar"}
      >
        {isOpen ? (
          <>
            <ChevronDown className="w-4 h-4" />
            <span>Tutup</span>
          </>
        ) : (
          <>
            <ChevronUp className="w-4 h-4" />
            <span>Menu</span>
          </>
        )}
      </button>
    </>
  );
}
