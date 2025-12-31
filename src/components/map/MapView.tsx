import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LandFeature, GeoJSONData } from '@/types/geojson';
import * as turf from '@turf/turf';
import { PolygonStyle } from '@/components/sidebar/PolygonStyleControl';
import { MeasureMode } from '@/components/sidebar/MeasurementTool';

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
  polygonStyle: PolygonStyle;
  measureMode: MeasureMode;
  onMeasureResult: (result: string | null) => void;
  onMeasureClear: () => void;
}

const BASEMAP_URLS: Record<BasemapType, { url: string; attribution: string; maxZoom?: number }> = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  satellite: {
    url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
    maxZoom: 20
  },
  streets: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri'
  },
  topo: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri'
  },
  dark: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri'
  }
};

export function MapView({ 
  data, 
  selectedFeature, 
  onFeatureClick, 
  basemap, 
  polygonStyle,
  measureMode,
  onMeasureResult,
  onMeasureClear
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const geoJsonLayer = useRef<L.GeoJSON | null>(null);
  const highlightLayer = useRef<L.GeoJSON | null>(null);
  const basemapLayer = useRef<L.TileLayer | null>(null);
  const userMarker = useRef<L.Marker | null>(null);
  const labelsLayer = useRef<L.LayerGroup | null>(null);
  
  // Measurement refs
  const measurePoints = useRef<L.LatLng[]>([]);
  const measureLayer = useRef<L.LayerGroup | null>(null);
  const measureLine = useRef<L.Polyline | null>(null);
  const measurePolygon = useRef<L.Polygon | null>(null);

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

    // Add initial basemap (default is OSM)
    const { url, attribution, maxZoom } = BASEMAP_URLS['osm'];
    basemapLayer.current = L.tileLayer(url, { attribution, maxZoom: maxZoom || 19 }).addTo(map.current);

    // Initialize labels layer
    labelsLayer.current = L.layerGroup().addTo(map.current);

    // Initialize measurement layer
    measureLayer.current = L.layerGroup().addTo(map.current);

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update basemap when changed
  useEffect(() => {
    if (!map.current) return;

    const { url, attribution, maxZoom } = BASEMAP_URLS[basemap];

    if (basemapLayer.current) {
      map.current.removeLayer(basemapLayer.current);
    }

    basemapLayer.current = L.tileLayer(url, { attribution, maxZoom: maxZoom || 19 }).addTo(map.current);
    basemapLayer.current.bringToBack();
  }, [basemap]);

  // Update labels based on zoom
  const updateLabels = useCallback(() => {
    if (!map.current || !data || !labelsLayer.current) return;

    labelsLayer.current.clearLayers();
    const zoom = map.current.getZoom();

    // Only show labels at certain zoom levels
    if (zoom < 14) return;

    const fontSize = zoom >= 17 ? 12 : zoom >= 15 ? 10 : 8;
    
    data.features.forEach(feature => {
      const idDesa = feature.properties.IDTANAH || feature.properties.KODEBD;
      if (!idDesa) return;

      try {
        const center = turf.center(feature as turf.AllGeoJSON);
        const [lng, lat] = center.geometry.coordinates;

        const label = L.divIcon({
          className: 'land-label',
          html: `<span style="font-size: ${fontSize}px">${idDesa}</span>`,
          iconSize: [100, 20],
          iconAnchor: [50, 10]
        });

        L.marker([lat, lng], { icon: label, interactive: false }).addTo(labelsLayer.current!);
      } catch (e) {
        // Skip invalid geometries
      }
    });
  }, [data]);

  // Add GeoJSON layer when data is available
  useEffect(() => {
    if (!map.current || !data) return;

    // Remove existing layer
    if (geoJsonLayer.current) {
      map.current.removeLayer(geoJsonLayer.current);
    }

    geoJsonLayer.current = L.geoJSON(data as GeoJSON.FeatureCollection, {
      style: {
        color: polygonStyle.outlineColor,
        weight: 1.5,
        fillColor: polygonStyle.fillColor,
        fillOpacity: polygonStyle.fillOpacity,
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
          (layer as L.Path).setStyle({ fillOpacity: Math.min(polygonStyle.fillOpacity + 0.15, 1) });
        });

        layer.on('mouseout', () => {
          (layer as L.Path).setStyle({ fillOpacity: polygonStyle.fillOpacity });
        });
      }
    }).addTo(map.current);

    // Update labels
    updateLabels();

    // Listen for zoom changes
    map.current.on('zoomend', updateLabels);

    return () => {
      map.current?.off('zoomend', updateLabels);
    };
  }, [data, onFeatureClick, polygonStyle, updateLabels]);

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

  // Measurement mode handler
  useEffect(() => {
    if (!map.current) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (measureMode === 'none') return;

      measurePoints.current.push(e.latlng);
      
      // Add point marker
      const marker = L.circleMarker(e.latlng, {
        radius: 6,
        fillColor: '#0ea5e9',
        color: '#fff',
        weight: 2,
        fillOpacity: 1
      }).addTo(measureLayer.current!);

      if (measureMode === 'distance') {
        // Update line
        if (measureLine.current) {
          map.current!.removeLayer(measureLine.current);
        }
        measureLine.current = L.polyline(measurePoints.current, {
          color: '#0ea5e9',
          weight: 3,
          dashArray: '10, 5'
        }).addTo(measureLayer.current!);

        // Calculate distance
        if (measurePoints.current.length >= 2) {
          let totalDistance = 0;
          for (let i = 1; i < measurePoints.current.length; i++) {
            const from = turf.point([measurePoints.current[i-1].lng, measurePoints.current[i-1].lat]);
            const to = turf.point([measurePoints.current[i].lng, measurePoints.current[i].lat]);
            totalDistance += turf.distance(from, to, { units: 'meters' });
          }
          
          if (totalDistance >= 1000) {
            onMeasureResult(`${(totalDistance / 1000).toFixed(2)} km`);
          } else {
            onMeasureResult(`${totalDistance.toFixed(2)} m`);
          }
        }
      } else if (measureMode === 'area') {
        // Update polygon
        if (measurePolygon.current) {
          map.current!.removeLayer(measurePolygon.current);
        }
        if (measurePoints.current.length >= 3) {
          measurePolygon.current = L.polygon(measurePoints.current, {
            color: '#0ea5e9',
            weight: 2,
            fillColor: '#0ea5e9',
            fillOpacity: 0.3
          }).addTo(measureLayer.current!);

          // Calculate area
          const coords = measurePoints.current.map(p => [p.lng, p.lat]);
          coords.push(coords[0]); // Close the polygon
          const polygon = turf.polygon([coords]);
          const area = turf.area(polygon);
          
          if (area >= 10000) {
            onMeasureResult(`${(area / 10000).toFixed(2)} ha`);
          } else {
            onMeasureResult(`${area.toFixed(2)} m²`);
          }
        } else {
          // Draw line while building polygon
          if (measureLine.current) {
            map.current!.removeLayer(measureLine.current);
          }
          measureLine.current = L.polyline(measurePoints.current, {
            color: '#0ea5e9',
            weight: 2,
            dashArray: '5, 5'
          }).addTo(measureLayer.current!);
        }
      }
    };

    const handleDblClick = (e: L.LeafletMouseEvent) => {
      if (measureMode === 'none') return;
      e.originalEvent.preventDefault();
      // Double click finishes measurement - keep result shown
    };

    map.current.on('click', handleMapClick);
    map.current.on('dblclick', handleDblClick);

    // Clear measurement when mode changes to none or changes type
    if (measureMode === 'none') {
      measurePoints.current = [];
      measureLayer.current?.clearLayers();
      measureLine.current = null;
      measurePolygon.current = null;
    }

    return () => {
      map.current?.off('click', handleMapClick);
      map.current?.off('dblclick', handleDblClick);
    };
  }, [measureMode, onMeasureResult]);

  // Clear measurements when requested
  useEffect(() => {
    const clearMeasurements = () => {
      measurePoints.current = [];
      measureLayer.current?.clearLayers();
      measureLine.current = null;
      measurePolygon.current = null;
    };

    // This is called when onMeasureClear is triggered
    return () => {
      // Cleanup if needed
    };
  }, []);

  // Expose clear function
  useEffect(() => {
    (window as any).__clearMeasurements = () => {
      measurePoints.current = [];
      measureLayer.current?.clearLayers();
      measureLine.current = null;
      measurePolygon.current = null;
      onMeasureResult(null);
    };
  }, [onMeasureResult]);

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
      <div ref={mapContainer} id="map-container" className="h-full w-full" />

      {/* Measurement Mode Indicator */}
      {measureMode !== 'none' && (
        <div className="absolute top-4 left-4 z-[1000] bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg font-medium text-sm">
          Mode: {measureMode === 'distance' ? 'Ukur Jarak' : 'Ukur Luas'}
        </div>
      )}

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
