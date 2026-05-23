import React from 'react';
import { LoginPage } from './LoginPage';
import type { AuthCredentials, AuthOptions } from '../../../context/AuthContext';

interface RegisterPageProps {
  onBackToPortal: () => void;
  onSubmit: (payload: AuthCredentials, options?: AuthOptions) => Promise<void> | void;
  onLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onBackToPortal, onSubmit, onLogin }) => (
  <LoginPage
    title="Register"
    onBackToPortal={onBackToPortal}
    onSubmit={onSubmit}
    onRegister={onLogin}
    alternateActionLabel="Already have a profile? Login"
    mode="register"
  />
);
