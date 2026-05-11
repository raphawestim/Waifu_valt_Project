import React, { useState, useRef } from 'react';
import type { User, WaifuImage, UserList } from '../types';
import { useAuth } from '../context/AuthContext';
import { ImageGrid } from './ImageGrid';

interface ProfileViewProps {
    user: User;
    favorites: WaifuImage[];
    lists: UserList[];
    onImageClick: (image: WaifuImage, list: WaifuImage[]) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, favorites, lists, onImageClick }) => {
    const { logout, updateProfile, deleteList, removeImageFromList } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [editingList, setEditingList] = useState<string | null>(null);

    // Form state
    const [username, setUsername] = useState(user.username);
    const [blacklistTags, setBlacklistTags] = useState(user.blacklistTags || '');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(user.avatar_url || null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('newUsername', username);
        formData.append('blacklistTags', blacklistTags);
        if (selectedFile) {
            formData.append('avatar', selectedFile);
        }
        await updateProfile(formData);
        alert('Profile updated successfully!');
    };

    const renderContent = () => {
        if (activeTab === 'profile') {
            return (
                <div className="max-w-2xl bg-white dark:bg-[#151515] p-6 sm:p-8 rounded-2xl shadow-xl border border-black/5 dark:border-white/5 animate-fade-in">
                    <form onSubmit={handleSaveProfile} className="space-y-6">
                        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-violet-500/20 bg-neutral-100 dark:bg-[#0a0a0a] shadow-lg flex items-center justify-center">
                                    {previewUrl ? (
                                        <img src={previewUrl} className="w-full h-full object-cover" alt="Profile Avatar" />
                                    ) : (
                                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 px-3 py-1.5 rounded-full bg-violet-50 dark:bg-violet-900/20 transition-colors"
                                >
                                    Change Avatar
                                </button>
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </div>

                            <div className="flex-1 w-full space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Username</label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        className="w-full bg-neutral-50 dark:bg-[#0a0a0a] border border-black/10 dark:border-white/10 rounded-xl py-2.5 px-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 focus:outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Blacklist Tags</label>
                                    <textarea
                                        value={blacklistTags}
                                        onChange={e => setBlacklistTags(e.target.value)}
                                        placeholder="loli, guro, tags separadas por vírgula"
                                        className="w-full bg-neutral-50 dark:bg-[#0a0a0a] border border-black/10 dark:border-white/10 rounded-xl py-2.5 px-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 focus:outline-none transition-all resize-none h-24"
                                    />
                                    <p className="text-[10px] text-gray-500 mt-1">Tags informadas aqui serão removidas de todas as suas buscas.</p>
                                </div>
                                <div className="pt-2 flex justify-end">
                                    <button
                                        type="submit"
                                        className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-violet-500/30 transition-all"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            );
        }

        if (activeTab === 'favorites') {
            return favorites.length > 0 ? (
                <div className="animate-fade-in">
                    <ImageGrid images={favorites} onImageClick={(img) => onImageClick(img, favorites)} />
                </div>
            ) : <div className="text-center py-12"><p className="text-gray-400 font-medium">You have no favorited images yet.</p></div>;
        }

        return null;
    };

    return (
        <div className="w-full min-h-[calc(100vh-80px)] p-4 sm:p-8 md:p-12">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">Your Profile</h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Manage settings and favorites</p>
                    </div>
                    <button onClick={logout} className="bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-colors">
                        Log Out
                    </button>
                </div>

                <div className="border-b border-black/10 dark:border-white/10 mb-8">
                    <nav className="-mb-px flex space-x-6 sm:space-x-8" aria-label="Tabs">
                        <button 
                            onClick={() => setActiveTab('profile')} 
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm transition-colors ${activeTab === 'profile' ? 'border-violet-500 text-violet-600 dark:text-violet-400' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
                        >
                            Settings
                        </button>
                        <button 
                            onClick={() => setActiveTab('favorites')} 
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm transition-colors ${activeTab === 'favorites' ? 'border-violet-500 text-violet-600 dark:text-violet-400' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
                        >
                            Favorites ({favorites.length})
                        </button>
                    </nav>
                </div>
                
                {renderContent()}
            </div>
        </div>
    );
};
