import { useState, useCallback } from 'react';
import { Upload, FileUp, X, Trash2, AlertCircle, ZoomIn } from 'lucide-react';
import * as turf from '@turf/turf';

interface UploadedLayer {
  id: string;
  fileName: string;
  format: string;
  data: any;
  visible: boolean;
}

interface FileUploadZoneProps {
  onFileLoad: (data: any, fileName: string) => void;
  isLayerVisible: boolean;
  onToggleLayer: (visible: boolean) => void;
  onZoomToLayer?: (bounds: [[number, number], [number, number]]) => void;
}

export function FileUploadZone({ onFileLoad, isLayerVisible, onToggleLayer, onZoomToLayer }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [layers, setLayers] = useState<UploadedLayer[]>([]);

  const getFileFormat = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (ext === 'geojson' || ext === 'json') return 'GeoJSON';
    if (ext === 'kml') return 'KML';
    if (ext === 'kmz') return 'KMZ';
    if (ext === 'zip') return 'SHP';
    return ext.toUpperCase();
  };

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
      let data: any = null;
      
      if (ext === 'geojson' || ext === 'json') {
        const text = await file.text();
        data = JSON.parse(text);
      } else if (ext === 'kml') {
        const text = await file.text();
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
        
        data = { type: 'FeatureCollection', features };
      } else if (ext === 'zip' || ext === 'kmz') {
        setError('Format ZIP/KMZ membutuhkan library tambahan. Gunakan GeoJSON atau KML.');
        setIsLoading(false);
        return;
      } else {
        setError(`Format .${ext} tidak didukung. Gunakan GeoJSON atau KML.`);
        setIsLoading(false);
        return;
      }

      if (data) {
        const newLayer: UploadedLayer = {
          id: `layer-${Date.now()}`,
          fileName: file.name,
          format: getFileFormat(file.name),
          data,
          visible: true
        };
        
        setLayers(prev => [...prev, newLayer]);
        onFileLoad(data, file.name);
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
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    e.target.value = '';
  };

  const handleDeleteLayer = (layerId: string) => {
    setLayers(prev => prev.filter(l => l.id !== layerId));
    // If no layers left, clear the map data
    const remainingLayers = layers.filter(l => l.id !== layerId);
    if (remainingLayers.length === 0) {
      onFileLoad(null, '');
    } else {
      // Merge remaining visible layers
      const visibleLayers = remainingLayers.filter(l => l.visible);
      if (visibleLayers.length > 0) {
        const mergedFeatures = visibleLayers.flatMap(l => l.data?.features || []);
        onFileLoad({ type: 'FeatureCollection', features: mergedFeatures }, 'merged');
      } else {
        onFileLoad(null, '');
      }
    }
  };

  const handleZoomToLayer = (layer: UploadedLayer) => {
    if (!layer.data || !onZoomToLayer) return;
    try {
      const bbox = turf.bbox(layer.data);
      onZoomToLayer([[bbox[1], bbox[0]], [bbox[3], bbox[2]]]);
    } catch (e) {
      console.error('Could not calculate bounds:', e);
    }
  };

  const handleToggleLayerVisibility = (layerId: string) => {
    setLayers(prev => {
      const updated = prev.map(l => 
        l.id === layerId ? { ...l, visible: !l.visible } : l
      );
      
      // Update map with visible layers
      const visibleLayers = updated.filter(l => l.visible);
      if (visibleLayers.length > 0) {
        const mergedFeatures = visibleLayers.flatMap(l => l.data?.features || []);
        onFileLoad({ type: 'FeatureCollection', features: mergedFeatures }, 'merged');
      } else {
        onFileLoad(null, '');
      }
      
      return updated;
    });
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

      {/* Uploaded layers list */}
      {layers.length > 0 && (
        <div className="space-y-1">
          {layers.map(layer => (
            <div 
              key={layer.id}
              className="flex items-center gap-2 px-2 py-1.5 bg-muted/50 rounded-md text-xs"
            >
              {/* Format badge */}
              <span className="px-1.5 py-0.5 bg-primary/20 text-primary rounded text-[10px] font-medium min-w-[45px] text-center">
                {layer.format}
              </span>
              
              {/* File name */}
              <span className="flex-1 truncate text-foreground/80 text-[10px]">
                {layer.fileName}
              </span>
              
              {/* Zoom to button */}
              <button
                onClick={() => handleZoomToLayer(layer)}
                className="p-1 hover:bg-primary/20 rounded transition-colors"
                title="Zoom ke layer"
              >
                <ZoomIn className="w-3 h-3 text-primary" />
              </button>
              
              {/* Delete button */}
              <button
                onClick={() => handleDeleteLayer(layer.id)}
                className="p-1 hover:bg-destructive/20 rounded transition-colors"
                title="Hapus layer"
              >
                <Trash2 className="w-3 h-3 text-destructive" />
              </button>
              
              {/* Toggle visibility */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={layer.visible}
                  onChange={() => handleToggleLayerVisibility(layer.id)}
                  className="sr-only peer"
                />
                <div className="w-6 h-3 bg-muted-foreground/30 rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-background after:rounded-full after:h-2 after:w-2 after:transition-all peer-checked:after:translate-x-3" />
              </label>
            </div>
          ))}
        </div>
      )}

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