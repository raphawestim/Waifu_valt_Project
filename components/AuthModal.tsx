
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
    const [username, setUsername] = useState('');
    const { login } = useAuth();
    const [isLogin, setIsLogin] = useState(true);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (username.trim()) {
            login(username);
            onClose();
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-[110] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-900 rounded-xl shadow-2xl p-8 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-center text-white mb-2">{isLogin ? 'Login' : 'Register'}</h2>
                <p className="text-center text-gray-400 mb-6">Enter a username to continue. No password needed.</p>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                            placeholder="e.g., WaifuLover69"
                        />
                    </div>
                    <button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-lg transition">
                        {isLogin ? 'Log In' : 'Sign Up'}
                    </button>
                </form>
                <div className="text-center mt-4">
                    <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-violet-400 hover:underline">
                        {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
                    </button>
                </div>
            </div>
        </div>
    );
};
