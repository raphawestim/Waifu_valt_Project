
import React, { useState, useEffect } from 'react';

const LogoIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 17L12 22L22 17" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 12L12 17L22 12" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const SearchIcon = () => (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
);

const BellIcon = () => (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
);

const UserIcon = () => (
    <img src="https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png" alt="User" className="w-8 h-8 rounded bg-gray-700 cursor-pointer" />
);

interface NavbarProps {
    onSearch: (query: string) => void;
    onToggleSidebar: () => void;
    onAuthClick: () => void;
    onLogoClick: () => void;
    onNavigate: (view: 'home' | 'search' | 'profile' | 'explore' | 'my-list') => void;
    isLoggedIn: boolean;
    currentView: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearch, onAuthClick, onLogoClick, onNavigate, currentView }) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [showSearchInput, setShowSearchInput] = useState(false);
    const [query, setQuery] = useState('');

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query);
        }
    };

    const NavLink = ({ view, label }: { view: 'home' | 'explore' | 'my-list', label: string }) => (
        <button 
            onClick={() => onNavigate(view)} 
            className={`text-sm font-medium transition-colors duration-200 ${
                (currentView === view) || (view === 'my-list' && currentView === 'profile') 
                ? 'text-white cursor-default' 
                : 'text-gray-300 hover:text-gray-100'
            }`}
        >
            {label}
        </button>
    );

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'bg-white dark:bg-[#141414]' : 'bg-gradient-to-b from-white/90 dark:from-black/90 to-transparent'}`}>
            <div className="px-4 md:px-12 h-[68px] flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <div 
                        className="flex items-center cursor-pointer mr-4"
                        onClick={onLogoClick}
                    >
                        <LogoIcon />
                        <span className="text-2xl font-black text-violet-500 ml-2 tracking-tighter hidden sm:block">VAULT</span>
                    </div>
                    
                    <nav className="hidden md:flex items-center space-x-5">
                        <NavLink view="home" label="Home" />
                        <NavLink view="explore" label="Explore APIs" />
                        <NavLink view="my-list" label="My List" />
                    </nav>
                </div>

                <div className="flex items-center space-x-6">
                    {/* Search Bar */}
                    <div className={`flex items-center border ${showSearchInput ? 'border-white bg-black/80' : 'border-transparent bg-transparent'} transition-all duration-300 px-1 py-0.5`}>
                        <button 
                            onClick={() => setShowSearchInput(!showSearchInput)} 
                            className="p-1 focus:outline-none"
                        >
                            <SearchIcon />
                        </button>
                        <form onSubmit={handleSearchSubmit}>
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search tags, characters..."
                                className={`bg-transparent text-white text-sm border-none outline-none transition-all duration-300 placeholder-gray-400 ${showSearchInput ? 'w-48 md:w-64 pl-2 pr-2' : 'w-0'}`}
                                onBlur={() => !query && setShowSearchInput(false)}
                            />
                        </form>
                    </div>

                    <div className="hidden sm:block text-white cursor-pointer hover:text-gray-300 transition">
                         <BellIcon />
                    </div>

                    <button onClick={onAuthClick} className="flex items-center group">
                        <UserIcon />
                        <span className={`ml-2 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity hidden lg:block`}>
                            Profile
                        </span>
                    </button>
                </div>
            </div>
        </header>
    );
};
