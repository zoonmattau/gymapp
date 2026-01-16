import React, { useState } from 'react';
import { ChevronLeft, AlertCircle, Loader2, Mail, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

function LoginScreen({ onBack, onLogin, COLORS }) {
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'username'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!identifier || !password) return;

    setLoading(true);
    setError(null);

    const credentials = loginMethod === 'email'
      ? { email: identifier, password }
      : { username: identifier, password };

    const { error: authError } = await signIn(credentials);

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      onLogin();
    }
  };

  return (
    <div className="flex flex-col h-full p-6">
      <button onClick={onBack} className="mb-6" disabled={loading}>
        <ChevronLeft size={24} color={COLORS.text} />
      </button>
      <div className="flex-1">
        <h1 className="text-3xl font-bold mb-2" style={{ color: COLORS.text }}>Welcome Back</h1>
        <p className="mb-8" style={{ color: COLORS.textSecondary }}>Log in to continue your fitness journey</p>

        {error && (
          <div className="mb-4 p-3 rounded-xl flex items-center gap-2" style={{ backgroundColor: COLORS.error + '20' }}>
            <AlertCircle size={18} color={COLORS.error} />
            <p className="text-sm" style={{ color: COLORS.error }}>{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Login method toggle */}
          <div className="flex gap-2 p-1 rounded-xl" style={{ backgroundColor: COLORS.surface }}>
            <button
              onClick={() => { setLoginMethod('email'); setIdentifier(''); setError(null); }}
              disabled={loading}
              className="flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all"
              style={{
                backgroundColor: loginMethod === 'email' ? COLORS.primary : 'transparent',
                color: loginMethod === 'email' ? COLORS.text : COLORS.textSecondary
              }}
            >
              <Mail size={16} />
              <span className="text-sm font-medium">Email</span>
            </button>
            <button
              onClick={() => { setLoginMethod('username'); setIdentifier(''); setError(null); }}
              disabled={loading}
              className="flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all"
              style={{
                backgroundColor: loginMethod === 'username' ? COLORS.primary : 'transparent',
                color: loginMethod === 'username' ? COLORS.text : COLORS.textSecondary
              }}
            >
              <User size={16} />
              <span className="text-sm font-medium">Username</span>
            </button>
          </div>

          <div>
            <label className="text-sm mb-2 block" style={{ color: COLORS.textSecondary }}>
              {loginMethod === 'email' ? 'Email' : 'Username'}
            </label>
            <input
              type={loginMethod === 'email' ? 'email' : 'text'}
              placeholder={loginMethod === 'email' ? 'your@email.com' : 'your_username'}
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              disabled={loading}
              className="w-full p-4 rounded-xl outline-none"
              style={{ backgroundColor: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.surfaceLight}` }}
            />
          </div>
          <div>
            <label className="text-sm mb-2 block" style={{ color: COLORS.textSecondary }}>Password</label>
            <input type="password" placeholder="********" value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="w-full p-4 rounded-xl outline-none"
              style={{ backgroundColor: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.surfaceLight}` }} />
          </div>
        </div>
      </div>
      <button onClick={handleLogin} disabled={!identifier || !password || loading}
        className="w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2"
        style={{ backgroundColor: COLORS.primary, color: COLORS.text, opacity: identifier && password && !loading ? 1 : 0.5 }}>
        {loading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Logging in...
          </>
        ) : (
          'Log In'
        )}
      </button>
    </div>
  );
}

export default LoginScreen;
