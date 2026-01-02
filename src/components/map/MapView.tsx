import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LandFeature, GeoJSONData } from '@/types/geojson';
import * as turf from '@turf/turf';
import type { BasemapType, PolygonStyle, MeasureMode } from '@/types/map-ui';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapViewProps {
  data: GeoJSONData | null;
  selectedFeature: LandFeature | null;
  onFeatureClick: (feature: LandFeature) => void;
  basemap: BasemapType;
  polygonStyle: PolygonStyle;
  measureMode: MeasureMode;
  onMeasureResult: (result: string | null) => void;
  onMeasureClear: () => void;
  polygonLayerVisible: boolean;
  uploadedData: any;
  uploadedLayerVisible: boolean;
  onClickCoordinate?: (coord: { lat: number; lng: number } | null) => void;
  zoomToBounds?: [[number, number], [number, number]] | null;
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
  googleMaps: {
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
    maxZoom: 20
  },
  hybrid: {
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
    maxZoom: 20
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
  onMeasureClear,
  polygonLayerVisible,
  uploadedData,
  uploadedLayerVisible,
  onClickCoordinate,
  zoomToBounds
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const geoJsonLayer = useRef<L.GeoJSON | null>(null);
  const uploadedLayer = useRef<L.GeoJSON | null>(null);
  const highlightLayer = useRef<L.GeoJSON | null>(null);
  const basemapLayer = useRef<L.TileLayer | null>(null);
  const userMarker = useRef<L.Marker | null>(null);
  const clickMarker = useRef<L.Marker | null>(null);
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

    L.control.zoom({ position: 'bottomright' }).addTo(map.current);

    const { url, attribution, maxZoom } = BASEMAP_URLS['osm'];
    basemapLayer.current = L.tileLayer(url, { attribution, maxZoom: maxZoom || 19 }).addTo(map.current);

    labelsLayer.current = L.layerGroup().addTo(map.current);
    measureLayer.current = L.layerGroup().addTo(map.current);

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update basemap
  useEffect(() => {
    if (!map.current) return;
    const { url, attribution, maxZoom } = BASEMAP_URLS[basemap];
    if (basemapLayer.current) map.current.removeLayer(basemapLayer.current);
    basemapLayer.current = L.tileLayer(url, { attribution, maxZoom: maxZoom || 19 }).addTo(map.current);
    basemapLayer.current.bringToBack();
  }, [basemap]);

  // Update labels
  const updateLabels = useCallback(() => {
    if (!map.current || !data || !labelsLayer.current) return;
    labelsLayer.current.clearLayers();
    const zoom = map.current.getZoom();
    if (zoom < 14) return;

    // Calculate feature areas for smart label display
    const featuresWithArea = data.features.map(feature => {
      let area = 0;
      try {
        area = turf.area(feature as turf.AllGeoJSON);
      } catch (e) {}
      return { feature, area };
    }).sort((a, b) => b.area - a.area);

    // At lower zoom levels, only show labels for larger features
    const maxLabels = zoom >= 17 ? featuresWithArea.length : zoom >= 16 ? Math.ceil(featuresWithArea.length * 0.7) : zoom >= 15 ? Math.ceil(featuresWithArea.length * 0.4) : Math.ceil(featuresWithArea.length * 0.2);
    const visibleFeatures = featuresWithArea.slice(0, maxLabels);

    visibleFeatures.forEach(({ feature, area }) => {
      const idDesa = feature.properties.IDTANAH || feature.properties.KODEBD;
      if (!idDesa) return;
      try {
        const center = turf.center(feature as turf.AllGeoJSON);
        const [lng, lat] = center.geometry.coordinates;
        
        // Dynamic font size based on zoom and area
        const baseFontSize = zoom >= 17 ? 11 : zoom >= 16 ? 10 : zoom >= 15 ? 9 : 8;
        const fontSize = area < 500 ? Math.max(baseFontSize - 2, 7) : baseFontSize;
        
        // Small lands get random rotation for visual variety
        const rotation = area < 1000 ? (Math.random() * 30 - 15) : 0;
        
        const label = L.divIcon({
          className: 'land-label-text',
          html: `<span style="font-size: ${fontSize}px; transform: rotate(${rotation}deg); display: inline-block;">${idDesa}</span>`,
          iconSize: [80, 16],
          iconAnchor: [40, 8]
        });
        L.marker([lat, lng], { icon: label, interactive: false }).addTo(labelsLayer.current!);
      } catch (e) {}
    });
  }, [data]);

  // GeoJSON layer
  useEffect(() => {
    if (!map.current || !data) return;
    if (geoJsonLayer.current) map.current.removeLayer(geoJsonLayer.current);

    if (!polygonLayerVisible) {
      labelsLayer.current?.clearLayers();
      return;
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
          if (landFeature) onFeatureClick(landFeature);
        });
        layer.on('mouseover', () => (layer as L.Path).setStyle({ fillOpacity: Math.min(polygonStyle.fillOpacity + 0.15, 1) }));
        layer.on('mouseout', () => (layer as L.Path).setStyle({ fillOpacity: polygonStyle.fillOpacity }));
      }
    }).addTo(map.current);

    updateLabels();
    map.current.on('zoomend', updateLabels);
    return () => { map.current?.off('zoomend', updateLabels); };
  }, [data, onFeatureClick, polygonStyle, updateLabels, polygonLayerVisible]);

  // Uploaded data layer
  useEffect(() => {
    if (!map.current) return;
    if (uploadedLayer.current) {
      map.current.removeLayer(uploadedLayer.current);
      uploadedLayer.current = null;
    }
    if (!uploadedData || !uploadedLayerVisible) return;

    uploadedLayer.current = L.geoJSON(uploadedData, {
      style: { color: '#ef4444', weight: 2, fillColor: '#ef4444', fillOpacity: 0.3 }
    }).addTo(map.current);
  }, [uploadedData, uploadedLayerVisible]);

  // Highlight selected
  useEffect(() => {
    if (!map.current || !data) return;
    if (highlightLayer.current) {
      map.current.removeLayer(highlightLayer.current);
      highlightLayer.current = null;
    }
    if (!selectedFeature) return;

    highlightLayer.current = L.geoJSON(selectedFeature as GeoJSON.Feature, {
      style: { color: '#0ea5e9', weight: 3, fillColor: '#0ea5e9', fillOpacity: 0.5 }
    }).addTo(map.current);

    const bbox = turf.bbox(selectedFeature);
    map.current.fitBounds([[bbox[1], bbox[0]], [bbox[3], bbox[2]]], { padding: [50, 50], maxZoom: 17 });
  }, [selectedFeature, data]);

  // Click to show coordinate marker
  useEffect(() => {
    if (!map.current) return;

    const handleCoordinateClick = (e: L.LeafletMouseEvent) => {
      // Only show coordinate marker when NOT in measure mode
      if (measureMode !== 'none') return;
      
      const { lat, lng } = e.latlng;
      
      // Update or create click marker
      if (clickMarker.current) {
        clickMarker.current.setLatLng([lat, lng]);
      } else {
        clickMarker.current = L.marker([lat, lng], {
          icon: L.icon({
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
          })
        }).addTo(map.current!);
      }
      
      onClickCoordinate?.({ lat, lng });
    };

    map.current.on('click', handleCoordinateClick);
    return () => { map.current?.off('click', handleCoordinateClick); };
  }, [measureMode, onClickCoordinate]);

  // Measurement
  useEffect(() => {
    if (!map.current) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (measureMode === 'none') return;
      measurePoints.current.push(e.latlng);
      L.circleMarker(e.latlng, { radius: 6, fillColor: '#0ea5e9', color: '#fff', weight: 2, fillOpacity: 1 }).addTo(measureLayer.current!);

      if (measureMode === 'distance') {
        if (measureLine.current) map.current!.removeLayer(measureLine.current);
        measureLine.current = L.polyline(measurePoints.current, { color: '#0ea5e9', weight: 3, dashArray: '10, 5' }).addTo(measureLayer.current!);
        if (measurePoints.current.length >= 2) {
          let totalDistance = 0;
          for (let i = 1; i < measurePoints.current.length; i++) {
            const from = turf.point([measurePoints.current[i-1].lng, measurePoints.current[i-1].lat]);
            const to = turf.point([measurePoints.current[i].lng, measurePoints.current[i].lat]);
            totalDistance += turf.distance(from, to, { units: 'meters' });
          }
          onMeasureResult(totalDistance >= 1000 ? `${(totalDistance / 1000).toFixed(2)} km` : `${totalDistance.toFixed(2)} m`);
        }
      } else if (measureMode === 'area') {
        if (measurePolygon.current) map.current!.removeLayer(measurePolygon.current);
        if (measurePoints.current.length >= 3) {
          measurePolygon.current = L.polygon(measurePoints.current, { color: '#0ea5e9', weight: 2, fillColor: '#0ea5e9', fillOpacity: 0.3 }).addTo(measureLayer.current!);
          const coords = measurePoints.current.map(p => [p.lng, p.lat]);
          coords.push(coords[0]);
          const area = turf.area(turf.polygon([coords]));
          onMeasureResult(area >= 10000 ? `${(area / 10000).toFixed(2)} ha` : `${area.toFixed(2)} m²`);
        } else {
          if (measureLine.current) map.current!.removeLayer(measureLine.current);
          measureLine.current = L.polyline(measurePoints.current, { color: '#0ea5e9', weight: 2, dashArray: '5, 5' }).addTo(measureLayer.current!);
        }
      }
    };

    map.current.on('click', handleMapClick);
    if (measureMode === 'none') {
      measurePoints.current = [];
      measureLayer.current?.clearLayers();
      measureLine.current = null;
      measurePolygon.current = null;
    }

    return () => { map.current?.off('click', handleMapClick); };
  }, [measureMode, onMeasureResult]);

  // Zoom to bounds
  useEffect(() => {
    if (!map.current || !zoomToBounds) return;
    map.current.fitBounds(zoomToBounds, { padding: [50, 50], maxZoom: 17 });
  }, [zoomToBounds]);

  useEffect(() => {
    (window as any).__clearMeasurements = () => {
      measurePoints.current = [];
      measureLayer.current?.clearLayers();
      measureLine.current = null;
      measurePolygon.current = null;
      onMeasureResult(null);
    };
  }, [onMeasureResult]);

  const locateUser = () => {
    if (!navigator.geolocation || !map.current) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: L.LatLngTuple = [position.coords.latitude, position.coords.longitude];
        if (userMarker.current) userMarker.current.setLatLng(coords);
        else {
          userMarker.current = L.marker(coords, {
            icon: L.divIcon({ className: 'user-location-marker', html: '<div class="user-marker-dot"></div>', iconSize: [20, 20], iconAnchor: [10, 10] })
          }).addTo(map.current!);
        }
        map.current?.flyTo(coords, 15);
      },
      (error) => console.error('Geolocation error:', error)
    );
  };

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainer} id="map-container" className="h-full w-full" />
      {measureMode !== 'none' && (
        <div className="absolute top-4 left-4 z-[1000] bg-primary text-primary-foreground px-3 py-1.5 rounded-lg shadow-lg font-medium text-xs">
          Mode: {measureMode === 'distance' ? 'Ukur Jarak' : 'Ukur Luas'}
        </div>
      )}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-[1000]">
        <button onClick={locateUser} className="control-button" title="Lokasi Saya">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
