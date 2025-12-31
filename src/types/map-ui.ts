export type BasemapType = 'streets' | 'satellite' | 'topo' | 'osm' | 'dark';

export type MeasureMode = 'none' | 'distance' | 'area';

export interface PolygonStyle {
  fillColor: string;
  outlineColor: string;
  fillOpacity: number;
}
