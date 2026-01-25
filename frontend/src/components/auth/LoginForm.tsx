import React, { useState } from 'react';
import { Modal } from '../ui';
import { Input } from '../ui/Input';
import Button from '../common/Button';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface LoginFormProps {
  onClose: () => void;
  onSwitchToRegister: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onClose, onSwitchToRegister }) => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await login(email, password);
      toast.success('Welcome back!');
      onClose();
    } catch {
      toast.error('Invalid email or password');
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Welcome Back" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />

        <div className="pt-2">
          <Button type="submit" loading={isLoading} className="w-full">
            Sign In
          </Button>
        </div>
      </form>

      <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-medium text-ocean-600 dark:text-ocean-400 hover:text-ocean-700 dark:hover:text-ocean-300"
        >
          Register here
        </button>
      </div>
    </Modal>
  );
};

export default LoginForm;