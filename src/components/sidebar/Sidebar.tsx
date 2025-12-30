import { useState, useMemo } from 'react';
import { LandFeature } from '@/types/geojson';
import { LandListItem } from './LandListItem';
import { LandDetail } from './LandDetail';
import { Search, ChevronLeft, Map, List, Settings } from 'lucide-react';

interface SidebarProps {
  features: LandFeature[];
  selectedFeature: LandFeature | null;
  onFeatureSelect: (feature: LandFeature) => void;
  onBack: () => void;
  lastModified: string | null;
  isOpen: boolean;
  onClose: () => void;
  findBestFeature: (idTanah: string | null, kodeBd: string | null) => LandFeature | null;
}

type TabType = 'map' | 'list' | 'tools';

export function Sidebar({ 
  features, 
  selectedFeature, 
  onFeatureSelect, 
  onBack, 
  lastModified,
  isOpen,
  onClose,
  findBestFeature
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

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-50 
        w-[85%] sm:w-[380px] lg:w-[380px] 
        bg-sidebar border-r border-sidebar-border
        flex flex-col
        transform transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        shadow-elevated lg:shadow-none
      `}>
        {/* Header */}
        <header className="gradient-header px-5 py-5 flex-shrink-0">
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
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {/* Map Settings Tab */}
          {activeTab === 'map' && (
            <div className="p-4 space-y-4 animate-fade-in">
              <div className="bg-card rounded-lg border border-border p-4">
                <h3 className="font-semibold text-sm text-primary mb-3">Pengaturan Peta</h3>
                <p className="text-muted-foreground text-sm">
                  Gunakan kontrol di peta untuk navigasi dan zoom.
                </p>
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
            <div className="p-4 space-y-4 animate-fade-in">
              <div className="bg-card rounded-lg border border-border p-4">
                <h3 className="font-semibold text-sm text-primary mb-3">Pengukuran</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Fitur pengukuran jarak dan luas tersedia di peta.
                </p>
              </div>
              <div className="bg-card rounded-lg border border-border p-4">
                <h3 className="font-semibold text-sm text-primary mb-3">Cetak Peta</h3>
                <p className="text-muted-foreground text-sm">
                  Fitur cetak peta akan tersedia dalam versi mendatang.
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
