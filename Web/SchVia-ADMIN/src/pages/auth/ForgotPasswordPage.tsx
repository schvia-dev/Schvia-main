// src/pages/ForgotPasswordPage.tsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

const ForgotPasswordPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [message, setMessage]     = useState<string | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);
  const { theme, toggleTheme }    = useTheme();
  const navigate                  = useNavigate();

  const currentColors = colors[theme];
  const bgColor       = currentColors.background;
  const textPrimary   = currentColors.text.primary;
  const textSecondary = currentColors.text.secondary;
  const errorColor    = currentColors.error;
  const logoSrc       = theme === 'light' ? APPLogoLight : APPLogoDark;
  const iconColor = theme === 'light' ? 'text-[#6A5ACD]' : 'text-[#E5E5E5]';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/web/adminForgotPassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to send reset email');
      }
      setMessage('If that account exists, a Reset Password has been sent to its email.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: bgColor }}
    >
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
        <div className="text-center mb-6">
          <div
            className="inline-flex items-center justify-center w-28 h-28 rounded-full mb-4 border-2 overflow-hidden"
            style={{
              borderColor:
                theme === 'light'
                  ? currentColors.primary
                  : '#f0f0f0',
            }}
          >
            <img
              src={logoSrc}
              alt="SchVia Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1
            className="text-2xl font-bold"
            style={{ color: textPrimary }}
          >
            Forgot Password
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: textSecondary }}
          >
            Enter your username to reset your password
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Input
            label="Username"
            type="text"
            placeholder="Your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          {error && (
            <div
              className="text-sm mb-4"
              style={{ color: errorColor }}
            >
              {error}
            </div>
          )}
          {message && (
            <div
              className="text-sm mb-4"
              style={{ color: currentColors.primary }}
            >
              {message}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={loading}
          >
            {loading ? 'Sending…' : 'Send Reset Password'}
          </Button>
        </form>

        <div
          className="mt-4 text-center text-sm"
          style={{ color: textSecondary }}
        >
          <Link to="/login" className="underline">
            Back to Sign In
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
