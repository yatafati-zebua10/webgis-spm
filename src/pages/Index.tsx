import { useState, useCallback } from 'react';
import { MapView } from '@/components/map/MapView';
import { MapboxTokenInput } from '@/components/map/MapboxTokenInput';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { MobileToggle } from '@/components/sidebar/MobileToggle';
import { useGeoData } from '@/hooks/useGeoData';
import { LandFeature } from '@/types/geojson';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { data, features, loading, error, lastModified, findBestFeature } = useGeoData();
  const [selectedFeature, setSelectedFeature] = useState<LandFeature | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mapboxToken, setMapboxToken] = useState<string>('');

  const handleFeatureSelect = useCallback((feature: LandFeature) => {
    // CRITICAL BUG FIX: Always get the best feature with complete data
    const bestFeature = findBestFeature(feature.properties.IDTANAH, feature.properties.KODEBD);
    setSelectedFeature(bestFeature || feature);
    setSidebarOpen(true);
  }, [findBestFeature]);

  const handleBack = useCallback(() => {
    setSelectedFeature(null);
  }, []);

  const handleTokenSubmit = useCallback((token: string) => {
    setMapboxToken(token);
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
      {/* Sidebar */}
      <Sidebar
        features={features}
        selectedFeature={selectedFeature}
        onFeatureSelect={handleFeatureSelect}
        onBack={handleBack}
        lastModified={lastModified}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        findBestFeature={findBestFeature}
      />

      {/* Map */}
      <main className="flex-1 relative">
        {!mapboxToken ? (
          <MapboxTokenInput onTokenSubmit={handleTokenSubmit} />
        ) : (
          <MapView
            data={data}
            selectedFeature={selectedFeature}
            onFeatureClick={handleFeatureSelect}
            mapboxToken={mapboxToken}
          />
        )}
      </main>

      {/* Mobile Toggle */}
      <MobileToggle 
        isOpen={sidebarOpen} 
        onClick={() => setSidebarOpen(!sidebarOpen)} 
      />
    </div>
  );
};

export default Index;
