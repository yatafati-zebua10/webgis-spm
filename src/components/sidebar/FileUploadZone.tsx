import { useState, useCallback } from 'react';
import { Upload, FileUp, X, Check, AlertCircle } from 'lucide-react';

interface FileUploadZoneProps {
  onFileLoad: (data: any, fileName: string) => void;
  isLayerVisible: boolean;
  onToggleLayer: (visible: boolean) => void;
}

export function FileUploadZone({ onFileLoad, isLayerVisible, onToggleLayer }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = async (file: File) => {
    setIsLoading(true);
    setError(null);
    
    const ext = file.name.split('.').pop()?.toLowerCase();
    
    try {
      if (ext === 'geojson' || ext === 'json') {
        const text = await file.text();
        const data = JSON.parse(text);
        onFileLoad(data, file.name);
        setFileName(file.name);
      } else if (ext === 'kml') {
        const text = await file.text();
        // Parse KML to GeoJSON using simple conversion
        const parser = new DOMParser();
        const kml = parser.parseFromString(text, 'text/xml');
        const placemarks = kml.querySelectorAll('Placemark');
        
        const features: any[] = [];
        placemarks.forEach(pm => {
          const coords = pm.querySelector('coordinates');
          if (coords) {
            const coordStr = coords.textContent?.trim() || '';
            const points = coordStr.split(/\s+/).map(c => {
              const [lng, lat] = c.split(',').map(Number);
              return [lng, lat];
            }).filter(p => !isNaN(p[0]) && !isNaN(p[1]));
            
            if (points.length > 0) {
              features.push({
                type: 'Feature',
                properties: { name: pm.querySelector('name')?.textContent || 'Unknown' },
                geometry: points.length === 1 
                  ? { type: 'Point', coordinates: points[0] }
                  : { type: 'Polygon', coordinates: [points] }
              });
            }
          }
        });
        
        const geojson = { type: 'FeatureCollection', features };
        onFileLoad(geojson, file.name);
        setFileName(file.name);
      } else if (ext === 'zip' || ext === 'kmz') {
        setError('Format ZIP/KMZ membutuhkan library tambahan. Gunakan GeoJSON atau KML.');
      } else {
        setError(`Format .${ext} tidak didukung. Gunakan GeoJSON atau KML.`);
      }
    } catch (err) {
      setError('Gagal memproses file. Pastikan format file benar.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, [onFileLoad]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleClear = () => {
    setFileName(null);
    setError(null);
    onFileLoad(null, '');
  };

  return (
    <div className="bg-card rounded-lg border border-border p-3 space-y-2">
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-xs text-primary flex items-center gap-1.5">
          <Upload className="w-3.5 h-3.5" />
          Input Data Peta
        </h3>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isLayerVisible}
            onChange={e => onToggleLayer(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-8 h-4 bg-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-background after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4" />
        </label>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-3 text-center transition-all cursor-pointer
          ${isDragging 
            ? 'border-primary bg-primary/10' 
            : 'border-border hover:border-primary/50 hover:bg-muted/30'
          }
          ${fileName ? 'bg-primary/5' : ''}
        `}
      >
        <input
          type="file"
          accept=".geojson,.json,.kml,.kmz,.zip"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        {isLoading ? (
          <div className="py-2">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-muted-foreground mt-1">Memproses...</p>
          </div>
        ) : fileName ? (
          <div className="flex items-center justify-center gap-2 py-1">
            <Check className="w-4 h-4 text-green-500" />
            <span className="text-xs font-medium text-foreground truncate max-w-[150px]">{fileName}</span>
            <button
              onClick={(e) => { e.stopPropagation(); handleClear(); }}
              className="p-0.5 hover:bg-muted rounded"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <div className="py-2">
            <FileUp className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">
              Drag & drop atau klik
            </p>
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">
              GeoJSON, KML, KMZ, Shapefile (ZIP)
            </p>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-1.5 text-destructive text-xs">
          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
