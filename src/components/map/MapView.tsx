import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { LandFeature, GeoJSONData } from '@/types/geojson';
import * as turf from '@turf/turf';

interface MapViewProps {
  data: GeoJSONData | null;
  selectedFeature: LandFeature | null;
  onFeatureClick: (feature: LandFeature) => void;
  mapboxToken: string;
}

export function MapView({ data, selectedFeature, onFeatureClick, mapboxToken }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [112.67, -7.34],
      zoom: 13,
      attributionControl: false,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  // Add GeoJSON layer when data is available
  useEffect(() => {
    if (!map.current || !data) return;

    const addLayers = () => {
      // Remove existing layers if they exist
      if (map.current?.getLayer('land-fill')) map.current.removeLayer('land-fill');
      if (map.current?.getLayer('land-outline')) map.current.removeLayer('land-outline');
      if (map.current?.getLayer('land-labels')) map.current.removeLayer('land-labels');
      if (map.current?.getLayer('land-highlight')) map.current.removeLayer('land-highlight');
      if (map.current?.getSource('land-data')) map.current.removeSource('land-data');

      map.current?.addSource('land-data', {
        type: 'geojson',
        data: data as GeoJSON.FeatureCollection,
      });

      // Fill layer
      map.current?.addLayer({
        id: 'land-fill',
        type: 'fill',
        source: 'land-data',
        paint: {
          'fill-color': '#1e4a8c',
          'fill-opacity': 0.35,
        },
      });

      // Outline layer
      map.current?.addLayer({
        id: 'land-outline',
        type: 'line',
        source: 'land-data',
        paint: {
          'line-color': '#0f2d5a',
          'line-width': 1.5,
        },
      });

      // Labels layer
      map.current?.addLayer({
        id: 'land-labels',
        type: 'symbol',
        source: 'land-data',
        layout: {
          'text-field': ['get', 'IDTANAH'],
          'text-size': 10,
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-anchor': 'center',
        },
        paint: {
          'text-color': '#1e3a5f',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.5,
        },
        minzoom: 14,
      });

      // Highlight layer (initially empty filter)
      map.current?.addLayer({
        id: 'land-highlight',
        type: 'fill',
        source: 'land-data',
        paint: {
          'fill-color': '#0ea5e9',
          'fill-opacity': 0.6,
        },
        filter: ['==', 'KODEBD', ''],
      });

      // Click handler
      map.current?.on('click', 'land-fill', (e) => {
        if (e.features && e.features.length > 0) {
          const props = e.features[0].properties;
          // Find the complete feature from original data
          const feature = data.features.find(f => 
            f.properties.KODEBD === props?.KODEBD || 
            f.properties.IDTANAH === props?.IDTANAH
          );
          if (feature) {
            onFeatureClick(feature);
          }
        }
      });

      // Cursor change on hover
      map.current?.on('mouseenter', 'land-fill', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current?.on('mouseleave', 'land-fill', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    };

    if (map.current.isStyleLoaded()) {
      addLayers();
    } else {
      map.current.on('load', addLayers);
    }
  }, [data, onFeatureClick]);

  // Highlight selected feature
  useEffect(() => {
    if (!map.current || !selectedFeature) return;

    map.current.setFilter('land-highlight', ['==', 'KODEBD', selectedFeature.properties.KODEBD || '']);

    // Fly to feature
    const bbox = turf.bbox(selectedFeature);
    map.current.fitBounds(
      [[bbox[0], bbox[1]], [bbox[2], bbox[3]]],
      { padding: 100, maxZoom: 17, duration: 1000 }
    );
  }, [selectedFeature]);

  // Locate user function
  const locateUser = () => {
    if (!navigator.geolocation || !map.current) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
        setUserLocation(coords);

        if (userMarker.current) {
          userMarker.current.setLngLat(coords);
        } else {
          userMarker.current = new mapboxgl.Marker({
            color: '#0ea5e9',
          })
            .setLngLat(coords)
            .addTo(map.current!);
        }

        map.current?.flyTo({ center: coords, zoom: 15, duration: 1500 });
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
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
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
