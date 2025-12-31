import { ChevronUp, X } from 'lucide-react';

interface MobileToggleProps {
  isOpen: boolean;
  onClick: () => void;
}

export function MobileToggle({ isOpen, onClick }: MobileToggleProps) {
  return (
    <button
      onClick={onClick}
      className={`
        fixed z-30
        lg:hidden
        
        /* Position at bottom center when closed, hidden when open */
        ${isOpen ? 'hidden' : 'bottom-4 left-1/2 -translate-x-1/2'}
        
        px-6 py-3
        flex items-center justify-center gap-2
        rounded-full
        shadow-elevated
        transition-all duration-300
        gradient-primary text-primary-foreground
        font-medium text-sm
      `}
      aria-label={isOpen ? 'Tutup sidebar' : 'Buka sidebar'}
    >
      <ChevronUp className="w-5 h-5" />
      <span>Buka Menu</span>
    </button>
  );
}
