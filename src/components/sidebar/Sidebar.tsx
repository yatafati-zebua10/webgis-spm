import { useState, useMemo } from 'react';
import { LandFeature } from '@/types/geojson';
import { LandListItem } from './LandListItem';
import { LandDetail } from './LandDetail';
import { PolygonStyleControl } from './PolygonStyleControl';
import { MeasurementTool } from './MeasurementTool';
import { PrintTool } from './PrintTool';
import { FileUploadZone } from './FileUploadZone';
import type { BasemapType, PolygonStyle, MeasureMode } from '@/types/map-ui';
import { Search, Map, List, Settings, Satellite, MapPin, Mountain, Moon, Globe, X } from 'lucide-react';

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
  polygonLayerVisible: boolean;
  onPolygonLayerVisibleChange: (visible: boolean) => void;
  uploadedLayerVisible: boolean;
  onUploadedLayerVisibleChange: (visible: boolean) => void;
  onFileUpload: (data: any, fileName: string) => void;
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
  onMeasureClear,
  polygonLayerVisible,
  onPolygonLayerVisibleChange,
  uploadedLayerVisible,
  onUploadedLayerVisibleChange,
  onFileUpload
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
    { id: 'list' as TabType, label: 'Daftar', icon: List },
    { id: 'tools' as TabType, label: 'Alat', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-foreground/30 z-[1050] lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Desktop: floating, Mobile: bottom sheet */}
      <aside className={`
        fixed z-[1100]
        
        /* Mobile: bottom sheet */
        inset-x-0 bottom-0 lg:inset-x-auto lg:bottom-auto
        h-[65vh] lg:h-auto
        max-h-[85vh] lg:max-h-[calc(100vh-2rem)]
        rounded-t-2xl lg:rounded-2xl
        
        /* Desktop: floating sidebar */
        lg:top-4 lg:left-4 lg:bottom-4
        lg:w-[340px]
        
        bg-sidebar border border-sidebar-border
        flex flex-col
        transform transition-transform duration-300 ease-out
        ${isOpen ? 'translate-y-0' : 'translate-y-full lg:translate-y-0 lg:translate-x-0'}
        shadow-elevated
        overflow-hidden
      `}>
        {/* Mobile Handle & Close */}
        <div className="lg:hidden flex justify-center items-center py-2 relative">
          <div className="w-10 h-1 bg-border rounded-full" />
          <button 
            onClick={onClose}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-muted rounded-full"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Header */}
        <header className="gradient-header px-4 py-3 flex-shrink-0 lg:rounded-t-2xl">
          <h1 className="text-primary-foreground font-bold text-sm tracking-wide text-center">
            WebGIS Aset Properti
          </h1>
          <p className="text-primary-foreground/70 text-[10px] text-center mt-0.5">
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
                flex-1 py-2.5 text-xs font-medium transition-all
                flex items-center justify-center gap-1
                ${activeTab === tab.id 
                  ? 'tab-active' 
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Tab Content - Scrollable */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {/* Map Settings Tab */}
          {activeTab === 'map' && (
            <div className="p-3 space-y-3 animate-fade-in">
              {/* Basemap Selection */}
              <div className="bg-card rounded-lg border border-border p-3">
                <h3 className="font-medium text-xs text-primary mb-2">Pilih Basemap</h3>
                <div className="grid grid-cols-2 gap-1.5">
                  {BASEMAP_OPTIONS.map(option => {
                    const Icon = option.icon;
                    const isActive = basemap === option.id;
                    return (
                      <button
                        key={option.id}
                        onClick={() => onBasemapChange(option.id)}
                        className={`
                          flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all
                          ${isActive 
                            ? 'border-primary bg-primary/10 text-primary' 
                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          }
                        `}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="text-[10px] font-medium text-center">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Polygon Style Control */}
              <PolygonStyleControl
                style={polygonStyle}
                onChange={onPolygonStyleChange}
                isLayerVisible={polygonLayerVisible}
                onToggleLayer={onPolygonLayerVisibleChange}
              />

              {/* File Upload Zone */}
              <FileUploadZone
                onFileLoad={onFileUpload}
                isLayerVisible={uploadedLayerVisible}
                onToggleLayer={onUploadedLayerVisibleChange}
              />

              {/* Navigation Tips */}
              <div className="bg-card rounded-lg border border-border p-3">
                <h3 className="font-medium text-xs text-primary mb-2">Petunjuk Navigasi</h3>
                <ul className="text-muted-foreground text-[10px] space-y-1">
                  <li className="flex items-start gap-1.5">
                    <span className="text-primary">•</span>
                    <span>Scroll untuk zoom in/out</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-primary">•</span>
                    <span>Klik dan drag untuk menggeser</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-primary">•</span>
                    <span>Klik bidang untuk melihat detail</span>
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
                  <div className="p-3 space-y-2 flex-shrink-0 border-b border-border">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Cari pemilik, eks, atau ID..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 bg-muted border-0 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Cari alamat..."
                      value={addressQuery}
                      onChange={e => setAddressQuery(e.target.value)}
                      className="w-full px-3 py-2 bg-muted border-0 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  {/* Feature List */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
                    {displayFeatures.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-xs">Tidak ada data yang sesuai</p>
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
                  <div className="p-2 border-t border-border text-center flex-shrink-0">
                    <p className="text-[10px] text-muted-foreground">
                      {lastModified || 'Data tersedia'} • {displayFeatures.length} bidang
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tools Tab */}
          {activeTab === 'tools' && (
            <div className="p-3 space-y-3 animate-fade-in">
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
