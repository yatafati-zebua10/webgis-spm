import { useState, useEffect } from 'react';
import { Palette, Square, Droplets } from 'lucide-react';
import type { PolygonStyle } from '@/types/map-ui';

interface PolygonStyleControlProps {
  style: PolygonStyle;
  onChange: (style: PolygonStyle) => void;
  isLayerVisible: boolean;
  onToggleLayer: (visible: boolean) => void;
}

const COLOR_PRESETS = [
  '#1e4a8c', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6b7280'
];

export function PolygonStyleControl({ style, onChange, isLayerVisible, onToggleLayer }: PolygonStyleControlProps) {
  const [localStyle, setLocalStyle] = useState(style);

  useEffect(() => {
    setLocalStyle(style);
  }, [style]);

  const handleChange = (key: keyof PolygonStyle, value: string | number) => {
    const newStyle = { ...localStyle, [key]: value };
    setLocalStyle(newStyle);
    onChange(newStyle);
  };

  return (
    <div className="bg-card rounded-lg border border-border p-3 space-y-3">
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-xs text-primary flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5" />
          Tampilan Polygon
        </h3>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isLayerVisible}
            onChange={e => onToggleLayer(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-8 h-4 bg-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-background after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4" />
        </label>
      </div>

      {/* Fill Color */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Square className="w-3 h-3" />
          Warna Isi
        </label>
        <div className="flex items-center gap-1.5">
          <div className="flex gap-1 flex-wrap">
            {COLOR_PRESETS.map(color => (
              <button
                key={`fill-${color}`}
                onClick={() => handleChange('fillColor', color)}
                className={`w-5 h-5 rounded border-2 transition-all ${
                  localStyle.fillColor === color ? 'border-primary scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <input
            type="color"
            value={localStyle.fillColor}
            onChange={e => handleChange('fillColor', e.target.value)}
            className="w-6 h-6 rounded cursor-pointer border border-border"
          />
        </div>
      </div>

      {/* Outline Color */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Square className="w-3 h-3 fill-transparent" />
          Warna Garis
        </label>
        <div className="flex items-center gap-1.5">
          <div className="flex gap-1 flex-wrap">
            {COLOR_PRESETS.map(color => (
              <button
                key={`outline-${color}`}
                onClick={() => handleChange('outlineColor', color)}
                className={`w-5 h-5 rounded border-2 transition-all ${
                  localStyle.outlineColor === color ? 'border-primary scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <input
            type="color"
            value={localStyle.outlineColor}
            onChange={e => handleChange('outlineColor', e.target.value)}
            className="w-6 h-6 rounded cursor-pointer border border-border"
          />
        </div>
      </div>

      {/* Opacity */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Droplets className="w-3 h-3" />
          Transparansi: {Math.round(localStyle.fillOpacity * 100)}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={localStyle.fillOpacity * 100}
          onChange={e => handleChange('fillOpacity', parseInt(e.target.value) / 100)}
          className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
        />
      </div>
    </div>
  );
}
