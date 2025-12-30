import { useState, useEffect } from 'react';
import { GeoJSONData, LandFeature } from '@/types/geojson';

export function useGeoData() {
  const [data, setData] = useState<GeoJSONData | null>(null);
  const [features, setFeatures] = useState<LandFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastModified, setLastModified] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/data.geojson');
        if (!response.ok) throw new Error('Failed to fetch data');
        
        const lastMod = response.headers.get('Last-Modified');
        if (lastMod) {
          const date = new Date(lastMod);
          setLastModified(date.toLocaleDateString('id-ID', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          }));
        }

        const geojson: GeoJSONData = await response.json();
        setData(geojson);
        setFeatures(geojson.features || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Find the best feature with complete data by KODEBD or IDTANAH
  const findBestFeature = (idTanah: string | null, kodeBd: string | null): LandFeature | null => {
    if (!features.length) return null;

    let candidates: LandFeature[] = [];

    // Priority: KODEBD first, then IDTANAH
    if (kodeBd) {
      candidates = features.filter(f => f.properties.KODEBD === kodeBd);
    } 
    
    if (candidates.length === 0 && idTanah) {
      candidates = features.filter(f => f.properties.IDTANAH === idTanah);
    }

    if (candidates.length === 0) return null;
    if (candidates.length === 1) return candidates[0];

    // If multiple candidates, pick the one with most complete data
    return candidates.reduce((prev, curr) => {
      const scorePrev = (prev.properties.NAMAEKS ? 4 : 0) + 
                        (prev.properties.NAMAMIL ? 2 : 0) + 
                        (prev.properties.LUASGIS ? 1 : 0);
      const scoreCurr = (curr.properties.NAMAEKS ? 4 : 0) + 
                        (curr.properties.NAMAMIL ? 2 : 0) + 
                        (curr.properties.LUASGIS ? 1 : 0);
      return scoreCurr > scorePrev ? curr : prev;
    });
  };

  return { data, features, loading, error, lastModified, findBestFeature };
}
