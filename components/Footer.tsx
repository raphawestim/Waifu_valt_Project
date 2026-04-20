
import React from 'react';

export const Footer: React.FC = () => {
    return (
        <footer className="bg-black border-t border-gray-800 mt-12">
            <div className="container mx-auto p-6 text-center text-gray-500">
                <p>&copy; {new Date().getFullYear()} Waifu Vault. All rights reserved.</p>
                <div className="flex justify-center space-x-4 mt-2">
                    <a href="#" className="hover:text-violet-400 transition">About</a>
                    <a href="#" className="hover:text-violet-400 transition">Terms of Service</a>
                </div>
            </div>
        </footer>
    );
};
