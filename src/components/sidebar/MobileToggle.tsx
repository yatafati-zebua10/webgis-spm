import { Menu } from 'lucide-react';

interface MobileToggleProps {
  isOpen: boolean;
  onClick: () => void;
}

export function MobileToggle({ isOpen, onClick }: MobileToggleProps) {
  return (
    <button
      onClick={onClick}
      className={`
        fixed right-0 top-1/2 -translate-y-1/2 z-30
        w-12 h-20 
        flex items-center justify-center
        rounded-l-lg
        shadow-elevated
        transition-all duration-300
        lg:hidden
        ${isOpen 
          ? 'bg-destructive text-destructive-foreground' 
          : 'gradient-primary text-primary-foreground'
        }
      `}
      aria-label={isOpen ? 'Tutup sidebar' : 'Buka sidebar'}
    >
      <Menu className="w-6 h-6" />
    </button>
  );
}
