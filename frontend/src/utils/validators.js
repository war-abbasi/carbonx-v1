export const validators = {
  email: (value) => {
    if (!value) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email';
    return null;
  },

  password: (value) => {
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    return null;
  },

  confirmPassword: (value, original) => {
    if (!value) return 'Please confirm your password';
    if (value !== original) return 'Passwords do not match';
    return null;
  },

  name: (value) => {
    if (!value || value.trim().length < 2) return 'Full name must be at least 2 characters';
    return null;
  },
};
