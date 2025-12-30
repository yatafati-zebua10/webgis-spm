import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LandFeature, GeoJSONData } from '@/types/geojson';
import * as turf from '@turf/turf';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export type BasemapType = 'streets' | 'satellite' | 'topo' | 'osm' | 'dark';

interface MapViewProps {
  data: GeoJSONData | null;
  selectedFeature: LandFeature | null;
  onFeatureClick: (feature: LandFeature) => void;
  basemap: BasemapType;
}

const BASEMAP_URLS: Record<BasemapType, { url: string; attribution: string }> = {
  streets: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri'
  },
  topo: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri'
  },
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  dark: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri'
  }
};

export function MapView({ data, selectedFeature, onFeatureClick, basemap }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const geoJsonLayer = useRef<L.GeoJSON | null>(null);
  const highlightLayer = useRef<L.GeoJSON | null>(null);
  const basemapLayer = useRef<L.TileLayer | null>(null);
  const userMarker = useRef<L.Marker | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = L.map(mapContainer.current, {
      center: [-7.34, 112.67],
      zoom: 13,
      zoomControl: false,
    });

    // Add zoom control to bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map.current);

    // Add initial basemap
    const { url, attribution } = BASEMAP_URLS[basemap];
    basemapLayer.current = L.tileLayer(url, { attribution }).addTo(map.current);

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update basemap when changed
  useEffect(() => {
    if (!map.current) return;

    const { url, attribution } = BASEMAP_URLS[basemap];

    if (basemapLayer.current) {
      map.current.removeLayer(basemapLayer.current);
    }

    basemapLayer.current = L.tileLayer(url, { attribution }).addTo(map.current);
    basemapLayer.current.bringToBack();
  }, [basemap]);

  // Add GeoJSON layer when data is available
  useEffect(() => {
    if (!map.current || !data) return;

    // Remove existing layer
    if (geoJsonLayer.current) {
      map.current.removeLayer(geoJsonLayer.current);
    }

    geoJsonLayer.current = L.geoJSON(data as GeoJSON.FeatureCollection, {
      style: {
        color: '#0f2d5a',
        weight: 1.5,
        fillColor: '#1e4a8c',
        fillOpacity: 0.35,
      },
      onEachFeature: (feature, layer) => {
        layer.on('click', () => {
          const landFeature = data.features.find(f =>
            f.properties.KODEBD === feature.properties?.KODEBD ||
            f.properties.IDTANAH === feature.properties?.IDTANAH
          );
          if (landFeature) {
            onFeatureClick(landFeature);
          }
        });

        layer.on('mouseover', () => {
          (layer as L.Path).setStyle({ fillOpacity: 0.5 });
        });

        layer.on('mouseout', () => {
          (layer as L.Path).setStyle({ fillOpacity: 0.35 });
        });

        // Add tooltip with ID
        if (feature.properties?.IDTANAH) {
          layer.bindTooltip(feature.properties.IDTANAH, {
            permanent: false,
            direction: 'center',
            className: 'land-tooltip'
          });
        }
      }
    }).addTo(map.current);

  }, [data, onFeatureClick]);

  // Highlight selected feature
  useEffect(() => {
    if (!map.current || !data) return;

    // Remove existing highlight
    if (highlightLayer.current) {
      map.current.removeLayer(highlightLayer.current);
      highlightLayer.current = null;
    }

    if (!selectedFeature) return;

    // Add highlight layer
    highlightLayer.current = L.geoJSON(selectedFeature as GeoJSON.Feature, {
      style: {
        color: '#0ea5e9',
        weight: 3,
        fillColor: '#0ea5e9',
        fillOpacity: 0.5,
      }
    }).addTo(map.current);

    // Fly to feature
    const bbox = turf.bbox(selectedFeature);
    map.current.fitBounds([
      [bbox[1], bbox[0]],
      [bbox[3], bbox[2]]
    ], { padding: [50, 50], maxZoom: 17 });

  }, [selectedFeature, data]);

  // Locate user function
  const locateUser = () => {
    if (!navigator.geolocation || !map.current) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: L.LatLngTuple = [position.coords.latitude, position.coords.longitude];

        if (userMarker.current) {
          userMarker.current.setLatLng(coords);
        } else {
          userMarker.current = L.marker(coords, {
            icon: L.divIcon({
              className: 'user-location-marker',
              html: '<div class="user-marker-dot"></div>',
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            })
          }).addTo(map.current!);
        }

        map.current?.flyTo(coords, 15);
      },
      (error) => {
        console.error('Geolocation error:', error);
      }
    );
  };

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainer} className="h-full w-full" />

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-[1000]">
        <button
          onClick={locateUser}
          className="control-button"
          title="Lokasi Saya"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
