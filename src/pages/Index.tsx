import { useState, useCallback } from 'react';
import { MapView, BasemapType } from '@/components/map/MapView';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { MobileToggle } from '@/components/sidebar/MobileToggle';
import { useGeoData } from '@/hooks/useGeoData';
import { LandFeature } from '@/types/geojson';
import { PolygonStyle } from '@/components/sidebar/PolygonStyleControl';
import { MeasureMode } from '@/components/sidebar/MeasurementTool';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { data, features, loading, error, lastModified, findBestFeature } = useGeoData();
  const [selectedFeature, setSelectedFeature] = useState<LandFeature | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [basemap, setBasemap] = useState<BasemapType>('osm'); // Default OSM
  
  // Polygon styling state
  const [polygonStyle, setPolygonStyle] = useState<PolygonStyle>({
    fillColor: '#1e4a8c',
    outlineColor: '#0f2d5a',
    fillOpacity: 0.35
  });

  // Measurement state
  const [measureMode, setMeasureMode] = useState<MeasureMode>('none');
  const [measureResult, setMeasureResult] = useState<string | null>(null);

  const handleFeatureSelect = useCallback((feature: LandFeature) => {
    // CRITICAL BUG FIX: Always get the best feature with complete data
    const bestFeature = findBestFeature(feature.properties.IDTANAH, feature.properties.KODEBD);
    setSelectedFeature(bestFeature || feature);
    setSidebarOpen(true);
  }, [findBestFeature]);

  const handleBack = useCallback(() => {
    setSelectedFeature(null);
  }, []);

  const handleBasemapChange = useCallback((newBasemap: BasemapType) => {
    setBasemap(newBasemap);
  }, []);

  const handlePolygonStyleChange = useCallback((style: PolygonStyle) => {
    setPolygonStyle(style);
  }, []);

  const handleMeasureModeChange = useCallback((mode: MeasureMode) => {
    setMeasureMode(mode);
    if (mode !== 'none') {
      setMeasureResult(null);
      (window as any).__clearMeasurements?.();
    }
  }, []);

  const handleMeasureResult = useCallback((result: string | null) => {
    setMeasureResult(result);
  }, []);

  const handleMeasureClear = useCallback(() => {
    setMeasureResult(null);
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">Memuat data aset...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">Gagal Memuat Data</h2>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Map - Full screen */}
      <main className="flex-1 relative">
        <MapView
          data={data}
          selectedFeature={selectedFeature}
          onFeatureClick={handleFeatureSelect}
          basemap={basemap}
          polygonStyle={polygonStyle}
          measureMode={measureMode}
          onMeasureResult={handleMeasureResult}
          onMeasureClear={handleMeasureClear}
        />
      </main>

      {/* Sidebar - Floating on desktop, bottom sheet on mobile */}
      <Sidebar
        features={features}
        selectedFeature={selectedFeature}
        onFeatureSelect={handleFeatureSelect}
        onBack={handleBack}
        lastModified={lastModified}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        findBestFeature={findBestFeature}
        basemap={basemap}
        onBasemapChange={handleBasemapChange}
        polygonStyle={polygonStyle}
        onPolygonStyleChange={handlePolygonStyleChange}
        measureMode={measureMode}
        onMeasureModeChange={handleMeasureModeChange}
        measureResult={measureResult}
        onMeasureClear={handleMeasureClear}
      />

      {/* Mobile Toggle */}
      <MobileToggle 
        isOpen={sidebarOpen} 
        onClick={() => setSidebarOpen(!sidebarOpen)} 
      />
    </div>
  );
};

export default Index;
