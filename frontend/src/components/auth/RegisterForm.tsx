import React, { useState } from 'react';
import { Modal } from '../ui';
import { Input, Select } from '../ui/Input';
import Button from '../common/Button';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface RegisterFormProps {
  onClose: () => void;
  onSwitchToLogin: () => void;
}

const roleOptions = [
  { value: 'NGO', label: 'NGO' },
  { value: 'PANCHAYAT', label: 'Panchayat' },
  { value: 'COMMUNITY', label: 'Community' },
  { value: 'RESEARCHER', label: 'Researcher' },
  { value: 'PRIVATE_ENTITY', label: 'Private Entity' },
  { value: 'COMPANY', label: 'Company' },
];

const RegisterForm: React.FC<RegisterFormProps> = ({ onClose, onSwitchToLogin }) => {
  const { register, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    role: 'NGO',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        organizationName: formData.organizationName || undefined,
        role: formData.role,
      });
      toast.success('Registration successful!');
      onClose();
    } catch {
      toast.error('Registration failed. Please try again.');
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Create Account" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            required
          />

          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
          />

          <Input
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="••••••••"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Organization Name"
            name="organizationName"
            value={formData.organizationName}
            onChange={handleChange}
            placeholder="Optional"
          />

          <Select
            label="Role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            options={roleOptions}
            required
          />
        </div>

        <div className="pt-2">
          <Button type="submit" loading={isLoading} className="w-full">
            Create Account
          </Button>
        </div>
      </form>

      <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-medium text-ocean-600 dark:text-ocean-400 hover:text-ocean-700 dark:hover:text-ocean-300"
        >
          Sign in here
        </button>
      </div>
    </Modal>
  );
};

export default RegisterForm;