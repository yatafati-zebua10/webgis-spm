import { useState, useMemo } from 'react';
import { LandFeature } from '@/types/geojson';
import { LandListItem } from './LandListItem';
import { LandDetail } from './LandDetail';
import { PolygonStyleControl } from './PolygonStyleControl';
import { MeasurementTool } from './MeasurementTool';
import { PrintTool } from './PrintTool';
import type { BasemapType, PolygonStyle, MeasureMode } from '@/types/map-ui';
import { Search, Map, List, Settings, Satellite, MapPin, Mountain, Moon, Globe } from 'lucide-react';

interface SidebarProps {
  features: LandFeature[];
  selectedFeature: LandFeature | null;
  onFeatureSelect: (feature: LandFeature) => void;
  onBack: () => void;
  lastModified: string | null;
  isOpen: boolean;
  onClose: () => void;
  findBestFeature: (idTanah: string | null, kodeBd: string | null) => LandFeature | null;
  basemap: BasemapType;
  onBasemapChange: (basemap: BasemapType) => void;
  polygonStyle: PolygonStyle;
  onPolygonStyleChange: (style: PolygonStyle) => void;
  measureMode: MeasureMode;
  onMeasureModeChange: (mode: MeasureMode) => void;
  measureResult: string | null;
  onMeasureClear: () => void;
}

type TabType = 'map' | 'list' | 'tools';

interface BasemapOption {
  id: BasemapType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const BASEMAP_OPTIONS: BasemapOption[] = [
  { id: 'osm', label: 'OpenStreetMap', icon: Globe, description: 'Peta OpenStreetMap' },
  { id: 'satellite', label: 'Satelit Google', icon: Satellite, description: 'Citra satelit Google' },
  { id: 'streets', label: 'Streets', icon: MapPin, description: 'Peta jalan ESRI' },
  { id: 'topo', label: 'Topografi', icon: Mountain, description: 'Peta topografi ESRI' },
  { id: 'dark', label: 'Dark', icon: Moon, description: 'Peta gelap ESRI' },
];

export function Sidebar({ 
  features, 
  selectedFeature, 
  onFeatureSelect, 
  onBack, 
  lastModified,
  isOpen,
  onClose,
  findBestFeature,
  basemap,
  onBasemapChange,
  polygonStyle,
  onPolygonStyleChange,
  measureMode,
  onMeasureModeChange,
  measureResult,
  onMeasureClear
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [addressQuery, setAddressQuery] = useState('');

  const filteredFeatures = useMemo(() => {
    return features.filter(f => {
      const p = f.properties;
      const q1 = searchQuery.toLowerCase();
      const q2 = addressQuery.toLowerCase();
      
      const matchName = !q1 || [p.NAMAMIL, p.NAMAEKS, p.IDTANAH, p.KODEBD]
        .some(v => (v || '').toLowerCase().includes(q1));
      
      const matchAddress = !q2 || [p.DESAKEL, p.KECAMTN, p.KABKOTA]
        .some(v => (v || '').toLowerCase().includes(q2));
      
      return matchName && matchAddress;
    });
  }, [features, searchQuery, addressQuery]);

  // Only show features with owner name in the list
  const displayFeatures = useMemo(() => {
    return filteredFeatures.filter(f => f.properties.NAMAMIL);
  }, [filteredFeatures]);

  const handleFeatureClick = (feature: LandFeature) => {
    // Use findBestFeature to get the most complete data - THIS IS THE BUG FIX
    const bestFeature = findBestFeature(feature.properties.IDTANAH, feature.properties.KODEBD);
    onFeatureSelect(bestFeature || feature);
  };

  const handleMeasureClear = () => {
    (window as any).__clearMeasurements?.();
    onMeasureClear();
  };

  const tabs = [
    { id: 'map' as TabType, label: 'Peta', icon: Map },
    { id: 'list' as TabType, label: 'Daftar Tanah', icon: List },
    { id: 'tools' as TabType, label: 'Alat', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-foreground/30 z-40 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Desktop: floating, Mobile: bottom sheet */}
      <aside className={`
        fixed z-[1100]
        
        /* Mobile: bottom sheet */
        inset-x-0 bottom-0 lg:inset-x-auto lg:bottom-auto
        h-[70vh] lg:h-auto
        rounded-t-2xl lg:rounded-2xl
        
        /* Desktop: floating sidebar */
        lg:top-4 lg:left-4 lg:bottom-4
        lg:w-[380px]
        
        bg-sidebar border border-sidebar-border
        flex flex-col
        transform transition-transform duration-300 ease-out
        ${isOpen ? 'translate-y-0' : 'translate-y-full lg:translate-y-0 lg:translate-x-0'}
        shadow-elevated
      `}>
        {/* Mobile Handle */}
        <div className="lg:hidden flex justify-center py-2">
          <div className="w-12 h-1.5 bg-border rounded-full" />
        </div>

        {/* Header */}
        <header className="gradient-header px-5 py-4 flex-shrink-0 lg:rounded-t-2xl">
          <h1 className="text-primary-foreground font-bold text-lg tracking-wide text-center">
            WebGIS Aset Properti
          </h1>
          <p className="text-primary-foreground/70 text-xs text-center mt-1">
            PT. Suparma, Tbk.
          </p>
        </header>

        {/* Tabs */}
        <nav className="flex border-b border-sidebar-border flex-shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 py-3.5 text-sm font-medium transition-all
                flex items-center justify-center gap-1.5
                ${activeTab === tab.id 
                  ? 'tab-active' 
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {/* Map Settings Tab */}
          {activeTab === 'map' && (
            <div className="p-4 space-y-4 animate-fade-in overflow-y-auto h-full scrollbar-thin">
              {/* Basemap Selection */}
              <div className="bg-card rounded-lg border border-border p-4">
                <h3 className="font-semibold text-sm text-primary mb-4">Pilih Basemap</h3>
                <div className="grid grid-cols-2 gap-2">
                  {BASEMAP_OPTIONS.map(option => {
                    const Icon = option.icon;
                    const isActive = basemap === option.id;
                    return (
                      <button
                        key={option.id}
                        onClick={() => onBasemapChange(option.id)}
                        className={`
                          flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all
                          ${isActive 
                            ? 'border-primary bg-primary/10 text-primary' 
                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          }
                        `}
                      >
                        <Icon className={`w-6 h-6 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="text-xs font-medium text-center">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Polygon Style Control */}
              <PolygonStyleControl
                style={polygonStyle}
                onChange={onPolygonStyleChange}
              />

              {/* Navigation Tips */}
              <div className="bg-card rounded-lg border border-border p-4">
                <h3 className="font-semibold text-sm text-primary mb-3">Petunjuk Navigasi</h3>
                <ul className="text-muted-foreground text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Gunakan scroll untuk zoom in/out</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Klik dan drag untuk menggeser peta</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Klik bidang tanah untuk melihat detail</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Land List Tab */}
          {activeTab === 'list' && (
            <div className="h-full flex flex-col animate-fade-in">
              {selectedFeature ? (
                <LandDetail 
                  feature={selectedFeature} 
                  onBack={onBack} 
                />
              ) : (
                <>
                  {/* Search Section */}
                  <div className="p-4 space-y-3 flex-shrink-0 border-b border-border">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Cari pemilik, eks, atau ID tanah..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="search-input pl-10"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Cari alamat (desa, kecamatan, kabupaten)..."
                      value={addressQuery}
                      onChange={e => setAddressQuery(e.target.value)}
                      className="search-input"
                    />
                  </div>

                  {/* Feature List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin">
                    {displayFeatures.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p className="text-sm">Tidak ada data yang sesuai</p>
                      </div>
                    ) : (
                      displayFeatures.map((feature, idx) => (
                        <LandListItem
                          key={feature.properties.KODEBD || idx}
                          feature={feature}
                          onClick={() => handleFeatureClick(feature)}
                        />
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-3 border-t border-border text-center flex-shrink-0">
                    <p className="text-xs text-muted-foreground">
                      Data diperbarui: {lastModified || 'Tidak tersedia'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {displayFeatures.length} bidang tanah
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tools Tab */}
          {activeTab === 'tools' && (
            <div className="p-4 space-y-4 animate-fade-in overflow-y-auto h-full scrollbar-thin">
              {/* Measurement Tool */}
              <MeasurementTool
                mode={measureMode}
                onModeChange={onMeasureModeChange}
                result={measureResult}
                onClear={handleMeasureClear}
              />

              {/* Print Tool */}
              <PrintTool mapContainerId="map-container" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
