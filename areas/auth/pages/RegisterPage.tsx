import React from 'react';
import { LoginPage } from './LoginPage';

interface RegisterPageProps {
  onBackToPortal: () => void;
  onSubmit: (username: string) => Promise<void> | void;
  onLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onBackToPortal, onSubmit, onLogin }) => (
  <LoginPage
    title="Register"
    onBackToPortal={onBackToPortal}
    onSubmit={onSubmit}
    onRegister={onLogin}
    alternateActionLabel="Already have a profile? Login"
  />
);
