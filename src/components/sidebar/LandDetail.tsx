import { LandFeature } from '@/types/geojson';
import { ChevronLeft, Download, MapPin, User, FileText, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface LandDetailProps {
  feature: LandFeature;
  onBack: () => void;
}

export function LandDetail({ feature, onBack }: LandDetailProps) {
  const p = feature.properties;

  const formatArea = (area: number | null) => {
    if (!area) return '-';
    return area.toLocaleString('id-ID', { maximumFractionDigits: 2 }) + ' m²';
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-';
    return 'Rp ' + amount.toLocaleString('id-ID');
  };

  const address = [p.DESAKEL, p.KECAMTN, p.KABKOTA, p.PROVINS].filter(Boolean).join(', ');

  const handleDownload = () => {
    toast.info('Fitur unduh berkas belum tersedia');
  };

  const infoSections = [
    {
      title: 'Informasi Kepemilikan',
      icon: User,
      items: [
        { label: 'ID Tanah', value: p.IDTANAH || '-' },
        { label: 'Kode Bidang', value: p.KODEBD || '-' },
        { label: 'Nama Pemilik', value: p.NAMAMIL || '-' },
        { label: 'Nama Eks Pemilik', value: p.NAMAEKS || '-' },
        { label: 'Jenis Hak', value: p.JENISHAK || '-' },
      ]
    },
    {
      title: 'Lokasi',
      icon: MapPin,
      items: [
        { label: 'Alamat', value: address || '-' },
      ]
    },
    {
      title: 'Luas Tanah',
      icon: Ruler,
      items: [
        { label: 'Luas Dokumen', value: formatArea(p.LUASDOK) },
        { label: 'Luas GIS', value: formatArea(p.LUASGIS) },
      ]
    },
    {
      title: 'Informasi Harga',
      icon: FileText,
      items: [
        { label: 'Harga (Meter)', value: formatCurrency(p.HARGAMT) },
        { label: 'Harga (Bidang)', value: formatCurrency(p.HARGABL) },
      ]
    },
  ];

  return (
    <div className="h-full flex flex-col animate-slide-in-right">
      {/* Header with back button */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-3"
        >
          <ChevronLeft className="w-4 h-4" />
          Kembali ke Daftar
        </button>
        <h2 className="text-lg font-bold text-primary">
          {p.IDTANAH || 'Detail Tanah'}
        </h2>
        {p.JENISHAK && (
          <span className="inline-block mt-2 text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-md">
            {p.JENISHAK}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {infoSections.map((section, idx) => (
          <div key={idx} className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <section.icon className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm text-primary">{section.title}</h3>
            </div>
            <div className="space-y-0">
              {section.items.map((item, i) => (
                <div key={i} className="info-row">
                  <span className="info-label">{item.label}</span>
                  <span className="info-value">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Remarks */}
        {p.REMARK && (
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold text-sm text-muted-foreground mb-2">Catatan</h3>
            <p className="text-sm text-foreground">{p.REMARK}</p>
          </div>
        )}
      </div>

      {/* Footer with download button */}
      <div className="p-4 border-t border-border flex-shrink-0">
        <Button onClick={handleDownload} className="w-full" variant="default">
          <Download className="w-4 h-4 mr-2" />
          Unduh Berkas
        </Button>
      </div>
    </div>
  );
}
