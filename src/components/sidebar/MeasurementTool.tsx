import { Ruler, SquareDashed, X, Trash2 } from 'lucide-react';
import type { MeasureMode } from '@/types/map-ui';

interface MeasurementToolProps {
  mode: MeasureMode;
  onModeChange: (mode: MeasureMode) => void;
  result: string | null;
  onClear: () => void;
}

export function MeasurementTool({ mode, onModeChange, result, onClear }: MeasurementToolProps) {
  return (
    <div className="bg-card rounded-lg border border-border p-3 space-y-3">
      <h3 className="font-medium text-xs text-primary flex items-center gap-1.5">
        <Ruler className="w-3.5 h-3.5" />
        Alat Ukur
      </h3>

      {/* Mode Selection */}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          onClick={() => onModeChange(mode === 'distance' ? 'none' : 'distance')}
          className={`
            flex items-center justify-center gap-1.5 p-2.5 rounded-lg border-2 transition-all
            ${mode === 'distance' 
              ? 'border-primary bg-primary/10 text-primary' 
              : 'border-border hover:border-primary/50 text-muted-foreground'
            }
          `}
        >
          <Ruler className="w-4 h-4" />
          <span className="text-xs font-medium">Jarak</span>
        </button>
        
        <button
          onClick={() => onModeChange(mode === 'area' ? 'none' : 'area')}
          className={`
            flex items-center justify-center gap-1.5 p-2.5 rounded-lg border-2 transition-all
            ${mode === 'area' 
              ? 'border-primary bg-primary/10 text-primary' 
              : 'border-border hover:border-primary/50 text-muted-foreground'
            }
          `}
        >
          <SquareDashed className="w-4 h-4" />
          <span className="text-xs font-medium">Luas</span>
        </button>
      </div>

      {/* Instructions */}
      {mode !== 'none' && (
        <div className="bg-primary/5 rounded-lg p-2.5 border border-primary/20">
          <p className="text-xs text-foreground">
            {mode === 'distance' 
              ? 'Klik titik-titik di peta untuk mengukur jarak. Double-klik untuk selesai.'
              : 'Klik titik-titik di peta untuk membuat polygon. Double-klik untuk selesai.'
            }
          </p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-muted rounded-lg p-2.5 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Hasil:</p>
            <p className="text-sm font-bold text-primary">{result}</p>
          </div>
          <button
            onClick={onClear}
            className="p-1.5 hover:bg-background rounded-lg transition-colors"
            title="Hapus pengukuran"
          >
            <Trash2 className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Cancel Button */}
      {mode !== 'none' && (
        <button
          onClick={() => {
            onModeChange('none');
            onClear();
          }}
          className="w-full flex items-center justify-center gap-1.5 p-2 rounded-lg border border-border hover:bg-muted transition-colors text-xs text-muted-foreground"
        >
          <X className="w-3.5 h-3.5" />
          <span>Batalkan</span>
        </button>
      )}
    </div>
  );
}
