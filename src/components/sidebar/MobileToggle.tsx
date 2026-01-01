import { ChevronUp } from 'lucide-react';

interface MobileToggleProps {
  isOpen: boolean;
  onClick: () => void;
}

export function MobileToggle({ isOpen, onClick }: MobileToggleProps) {
  // Always render on mobile, hidden on desktop
  // Show when sidebar is closed
  if (isOpen) return null;
  
  return (
    <button
      onClick={onClick}
      className="
        fixed z-[1200]
        lg:hidden
        bottom-4 left-1/2 -translate-x-1/2
        px-5 py-2.5
        flex items-center justify-center gap-2
        rounded-full
        shadow-elevated
        transition-all duration-300
        gradient-primary text-primary-foreground
        font-medium text-xs
        active:scale-95
      "
      aria-label="Buka sidebar"
    >
      <ChevronUp className="w-4 h-4" />
      <span>Buka Menu</span>
    </button>
  );
}
