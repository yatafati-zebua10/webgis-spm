import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle, Key, ExternalLink } from 'lucide-react';

interface MapboxTokenInputProps {
  onTokenSubmit: (token: string) => void;
}

export function MapboxTokenInput({ onTokenSubmit }: MapboxTokenInputProps) {
  const [token, setToken] = useState('');
  const [storedToken, setStoredToken] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('mapbox_token');
    if (saved) {
      setStoredToken(saved);
      onTokenSubmit(saved);
    }
  }, [onTokenSubmit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      localStorage.setItem('mapbox_token', token.trim());
      onTokenSubmit(token.trim());
    }
  };

  if (storedToken) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/95 backdrop-blur-sm z-50">
      <div className="max-w-md w-full mx-4 bg-card p-6 rounded-xl shadow-elevated border border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Key className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-foreground">Mapbox Token</h2>
            <p className="text-sm text-muted-foreground">Diperlukan untuk menampilkan peta</p>
          </div>
        </div>

        <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 mb-4">
          <div className="flex gap-2">
            <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">
              Masukkan Mapbox public token Anda. Token dapat diperoleh dari{' '}
              <a 
                href="https://mapbox.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary font-medium hover:underline inline-flex items-center gap-1"
              >
                mapbox.com
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="pk.eyJ1IjoieW91..."
            value={token}
            onChange={e => setToken(e.target.value)}
            className="font-mono text-sm"
          />
          <Button type="submit" className="w-full" disabled={!token.trim()}>
            Simpan & Lanjutkan
          </Button>
        </form>
      </div>
    </div>
  );
}
