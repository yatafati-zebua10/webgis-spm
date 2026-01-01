export type BasemapType = 'osm' | 'satellite' | 'googleMaps' | 'hybrid';

export type MeasureMode = 'none' | 'distance' | 'area';

export interface PolygonStyle {
  fillColor: string;
  outlineColor: string;
  fillOpacity: number;
}
