import { useState, useEffect } from 'react';
import { Palette, Square, Droplets } from 'lucide-react';
import type { PolygonStyle } from '@/types/map-ui';

interface PolygonStyleControlProps {
  style: PolygonStyle;
  onChange: (style: PolygonStyle) => void;
}

const COLOR_PRESETS = [
  '#1e4a8c', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6b7280'
];

export function PolygonStyleControl({ style, onChange }: PolygonStyleControlProps) {
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
    <div className="bg-card rounded-lg border border-border p-4 space-y-4">
      <h3 className="font-semibold text-sm text-primary mb-4 flex items-center gap-2">
        <Palette className="w-4 h-4" />
        Tampilan Polygon
      </h3>

      {/* Fill Color */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Square className="w-3.5 h-3.5" />
          Warna Isi
        </label>
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 flex-wrap">
            {COLOR_PRESETS.map(color => (
              <button
                key={`fill-${color}`}
                onClick={() => handleChange('fillColor', color)}
                className={`w-6 h-6 rounded border-2 transition-all ${
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
            className="w-8 h-8 rounded cursor-pointer border border-border"
          />
        </div>
      </div>

      {/* Outline Color */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Square className="w-3.5 h-3.5 fill-transparent" />
          Warna Garis
        </label>
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 flex-wrap">
            {COLOR_PRESETS.map(color => (
              <button
                key={`outline-${color}`}
                onClick={() => handleChange('outlineColor', color)}
                className={`w-6 h-6 rounded border-2 transition-all ${
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
            className="w-8 h-8 rounded cursor-pointer border border-border"
          />
        </div>
      </div>

      {/* Opacity */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Droplets className="w-3.5 h-3.5" />
          Transparansi: {Math.round(localStyle.fillOpacity * 100)}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={localStyle.fillOpacity * 100}
          onChange={e => handleChange('fillOpacity', parseInt(e.target.value) / 100)}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
        />
      </div>
    </div>
  );
}
