import { LandFeature } from '@/types/geojson';

interface LandListItemProps {
  feature: LandFeature;
  onClick: () => void;
}

export function LandListItem({ feature, onClick }: LandListItemProps) {
  const p = feature.properties;
  
  const formatArea = (area: number | null) => {
    if (!area) return null;
    return area.toLocaleString('id-ID', { maximumFractionDigits: 0 }) + ' m²';
  };

  const address = [p.DESAKEL, p.KECAMTN, p.KABKOTA].filter(Boolean).join(', ');
  const displayArea = formatArea(p.LUASDOK) || formatArea(p.LUASGIS);

  return (
    <div 
      onClick={onClick}
      className="feature-card group"
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-primary truncate">
            {p.IDTANAH || 'Tanpa ID'}
          </p>
          <p className="font-medium text-foreground mt-1 truncate">
            {p.NAMAMIL || 'Pemilik tidak diketahui'}
            {p.NAMAEKS && (
              <span className="text-muted-foreground text-[10px] ml-1">
                (Eks. {p.NAMAEKS})
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {address || 'Alamat tidak tersedia'}
          </p>
        </div>
        {displayArea && (
          <span className="text-xs font-semibold text-success bg-success/10 px-2 py-1 rounded-md whitespace-nowrap">
            {displayArea}
          </span>
        )}
      </div>
    </div>
  );
}
