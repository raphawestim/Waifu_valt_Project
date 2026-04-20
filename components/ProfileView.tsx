
import React, { useState } from 'react';
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
    const { logout, deleteList, removeImageFromList } = useAuth();
    const [activeTab, setActiveTab] = useState('favorites');
    const [editingList, setEditingList] = useState<string | null>(null);

    const renderContent = () => {
        if (activeTab === 'favorites') {
            return favorites.length > 0 ? (
                // When clicking a favorite, we pass the favorites array as context
                <ImageGrid images={favorites} onImageClick={(img) => onImageClick(img, favorites)} />
            ) : <p className="text-gray-400">You have no favorited images yet.</p>;
        }
        const list = lists.find(l => l.name === activeTab);
        if (list) {
            const images = editingList === list.name
                ? list.images.map(img => ({ ...img, isEditing: true }))
                : list.images;

            return (
                <div>
                     <div className="flex justify-end gap-2 mb-4">
                        <button
                            onClick={() => setEditingList(editingList === list.name ? null : list.name)}
                            className="bg-gray-700 hover:bg-gray-600 text-sm px-4 py-2 rounded-lg"
                        >
                            {editingList === list.name ? 'Done' : 'Edit'}
                        </button>
                        <button
                            onClick={() => { if(window.confirm(`Are you sure you want to delete the list "${list.name}"?`)) deleteList(list.name); setActiveTab('favorites'); }}
                            className="bg-red-600 hover:bg-red-700 text-sm px-4 py-2 rounded-lg"
                        >
                            Delete List
                        </button>
                    </div>
                     {list.images.length > 0 ? (
                         <div className="masonry-grid">
                            {list.images.map(image => (
                                <div key={image.id} className="relative masonry-item">
                                    <div className="group relative block w-full bg-gray-900 rounded-lg overflow-hidden cursor-pointer shadow-lg" onClick={() => editingList !== list.name && onImageClick(image, list.images)}>
                                        <img src={image.thumbnailUrl} className="w-full h-auto object-cover"/>
                                        {editingList === list.name && (
                                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                                <button onClick={() => removeImageFromList(list.name, image.id)} className="bg-red-500 rounded-full p-2 text-white">
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                         </div>
                     ) : <p className="text-gray-400">This list is empty.</p>}
                </div>
            )
        }
        return null;
    };

    return (
        <div className="container mx-auto p-4 md:p-8 text-white">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Welcome, {user.username}</h1>
                    <p className="text-gray-400">Manage your collection</p>
                </div>
                <button onClick={logout} className="mt-4 sm:mt-0 bg-violet-600 hover:bg-violet-700 px-6 py-2 rounded-lg font-semibold transition">
                    Log Out
                </button>
            </div>

            <div className="border-b border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button onClick={() => {setActiveTab('favorites'); setEditingList(null);}} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'favorites' ? 'border-violet-500 text-violet-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
                        Favorites ({favorites.length})
                    </button>
                    {lists.map(list => (
                        <button key={list.name} onClick={() => {setActiveTab(list.name); setEditingList(null);}} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === list.name ? 'border-violet-500 text-violet-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
                            {list.name} ({list.images.length})
                        </button>
                    ))}
                </nav>
            </div>
            
            <div>
                {renderContent()}
            </div>
        </div>
    );
};
