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
    <div className="bg-card rounded-lg border border-border p-4 space-y-4">
      <h3 className="font-semibold text-sm text-primary mb-3">Pengukuran</h3>
      
      {/* Mode Buttons - Large for mobile */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onModeChange(mode === 'distance' ? 'none' : 'distance')}
          className={`
            flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all
            ${mode === 'distance' 
              ? 'border-primary bg-primary/10 text-primary' 
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
            }
          `}
        >
          <Ruler className="w-8 h-8" />
          <span className="text-sm font-medium">Jarak</span>
        </button>
        
        <button
          onClick={() => onModeChange(mode === 'area' ? 'none' : 'area')}
          className={`
            flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all
            ${mode === 'area' 
              ? 'border-primary bg-primary/10 text-primary' 
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
            }
          `}
        >
          <SquareDashed className="w-8 h-8" />
          <span className="text-sm font-medium">Luas</span>
        </button>
      </div>

      {/* Instructions */}
      {mode !== 'none' && (
        <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-sm text-muted-foreground">
            {mode === 'distance' 
              ? 'Klik pada peta untuk menambah titik. Klik dua kali untuk selesai.'
              : 'Klik pada peta untuk menambah titik polygon. Klik dua kali untuk selesai.'
            }
          </p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="p-4 bg-success/10 rounded-lg border border-success/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                {mode === 'distance' ? 'Total Jarak' : 'Total Luas'}
              </p>
              <p className="text-lg font-bold text-success">{result}</p>
            </div>
            <button
              onClick={onClear}
              className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Cancel Button */}
      {mode !== 'none' && (
        <button
          onClick={() => {
            onModeChange('none');
            onClear();
          }}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
        >
          <X className="w-5 h-5" />
          <span className="font-medium">Batalkan Pengukuran</span>
        </button>
      )}
    </div>
  );
}
