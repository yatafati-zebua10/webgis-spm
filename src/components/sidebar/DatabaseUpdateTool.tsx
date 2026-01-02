import { useState } from 'react';
import { Database, User, Lock, LogIn, LogOut, CheckCircle } from 'lucide-react';

export function DatabaseUpdateTool() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Dummy login - simulate delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo purposes, accept any non-empty credentials
    if (username && password) {
      setIsLoggedIn(true);
    }
    setIsLoading(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
  };

  return (
    <div className="bg-card rounded-lg border border-border p-3 space-y-3">
      <h3 className="font-medium text-xs text-primary flex items-center gap-1.5">
        <Database className="w-3.5 h-3.5" />
        Update Database
      </h3>

      {isLoggedIn ? (
        <div className="space-y-3">
          {/* Logged in state */}
          <div className="flex items-center gap-2 p-2 bg-success/10 rounded-lg border border-success/30">
            <CheckCircle className="w-4 h-4 text-success" />
            <span className="text-xs text-success font-medium">
              Terhubung sebagai {username}
            </span>
          </div>

          <div className="text-xs text-muted-foreground">
            Fitur update database akan tersedia dalam versi berikutnya.
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-1.5 p-2 rounded-lg border border-border text-muted-foreground hover:bg-muted/50 transition-colors text-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      ) : (
        <form onSubmit={handleLogin} className="space-y-2">
          {/* Username */}
          <div className="relative">
            <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-muted border-0 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              disabled={isLoading}
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-muted border-0 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              disabled={isLoading}
            />
          </div>

          {/* Login button */}
          <button
            type="submit"
            disabled={isLoading || !username || !password}
            className="w-full flex items-center justify-center gap-1.5 p-2 rounded-lg bg-primary text-primary-foreground font-medium text-xs hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </>
            )}
          </button>

          <p className="text-[10px] text-muted-foreground text-center">
            Masuk untuk mengakses fitur update database
          </p>
        </form>
      )}
    </div>
  );
}
