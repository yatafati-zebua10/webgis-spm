export interface LandProperties {
  Id: number;
  KODEBD: string;
  IDTANAH: string;
  NAMAMIL: string | null;
  NAMAEKS: string | null;
  JENISHAK: string | null;
  DESAKEL: string | null;
  KECAMTN: string | null;
  KABKOTA: string | null;
  PROVINS: string | null;
  BERKDOK: string | null;
  BERKGBR: string | null;
  BERKPJK: string | null;
  HISTORI: string | null;
  HARGAMT: number;
  HARGABL: number;
  REMARK: string | null;
  LUASDOK: number;
  LUASGIS: number;
}

export interface LandFeature {
  type: "Feature";
  properties: LandProperties;
  geometry: {
    type: "MultiPolygon";
    coordinates: number[][][][];
  };
}

export interface GeoJSONData {
  type: "FeatureCollection";
  name: string;
  features: LandFeature[];
}
