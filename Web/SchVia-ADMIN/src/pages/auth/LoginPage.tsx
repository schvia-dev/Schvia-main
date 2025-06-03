// src/pages/LoginPage.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Moon, Sun } from 'lucide-react';
import { colors, getColor } from '../../constants/colors';
import APPLogoLight from '../../assets/logo_light.png';
import APPLogoDark from '../../assets/logo_dark.png';
import RoundButton from '../../components/ui/RoundButton';
import { motion } from 'framer-motion';

const LoginPage: React.FC = () => {
  const [username, setUsername]     = useState('');
  const [password, setPassword]     = useState('');
  const [loginError, setLoginError] = useState('');
  const { login, user, loading, error } = useAuth();
  const { theme, toggleTheme }      = useTheme();
  const navigate                    = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!username.trim() || !password.trim()) {
      setLoginError('Please enter both username and password');
      return;
    }
    const success = await login(username, password);
    if (success) navigate('/', { replace: true });
  };

  // theme & colors
  const currentColors = colors[theme];
  const bgColor       = currentColors.background;
  const textPrimary   = currentColors.text.primary;
  const textSecondary = currentColors.text.secondary;
  const errorColor    = currentColors.error;
  const logoSrc       = theme === 'light' ? APPLogoLight : APPLogoDark;
  const iconColor = theme === 'light' ? 'text-[#6A5ACD]' : 'text-[#E5E5E5]';

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: bgColor }}
    >
      {/* Theme toggle */}
      <div className="absolute top-4 right-4">
        <motion.div
           whileHover={{ scale: 1.05 }}
           whileTap={{ scale: 0.95 }}
           transition={{ type: 'spring', stiffness: 300, damping: 20 }}
         >
        {/* <button
          onClick={toggleTheme}
          className="p-2 rounded-full transition-colors"
          style={{ backgroundColor: theme === 'light' ? '#f0f0f0' : '#333' }}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? (
            <Moon color={getColor('text.secondary', theme)} size={20} />
          ) : (
            <Sun color={getColor('text.primary', theme)} size={20} />
          )}
        </button> */}
        <RoundButton
          onClick={toggleTheme}
          variant="outline"
          size="md"
          icon={ theme === 'light'
                  ? <Moon className={iconColor} size={20} />
                  : <Sun  className={iconColor} size={20} />}
          aria-label="Toggle theme"
        />
        </motion.div>
      </div>

      <Card className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-6">
          <div
            className="inline-flex items-center justify-center w-28 h-28 rounded-full mb-4 border-2 overflow-hidden"
            style={{
              borderColor:
                theme === 'light' ? currentColors.primary : '#f0f0f0',
            }}
          >
            <img
              src={logoSrc}
              alt="SchVia Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: textPrimary }}>
            SchVia – College Admin Portal
          </h1>
          <p className="text-sm mt-1" style={{ color: textSecondary }}>
            Sign in to access your dashboard
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Input
            label="Username"
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {(loginError || error) && (
            <div className="text-sm mb-4" style={{ color: errorColor }}>
              {loginError || error}
            </div>
          )}

          <Button type="submit" variant="primary" fullWidth disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        {/* Forgot Password Link */}
        <div className="mt-4 text-right">
          <Link
            to="/forgotpassword"
            className="text-sm underline"
            style={{ color: textSecondary }}
          >
            Forgot Password?
          </Link>
        </div>

        {/* Demo credentials */}
        <div
          className="mt-6 text-center text-sm"
          style={{ color: textSecondary }}
        >
          <p>Demo Credentials:</p>
          <p>username: admin_mru, password: 12345678</p>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
