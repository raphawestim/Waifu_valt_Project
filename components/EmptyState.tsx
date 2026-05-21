
import React from 'react';

export const EmptyState: React.FC = () => (
    <div className="text-center py-16">
        <div className="text-6xl mb-4">😔</div>
        <h3 className="text-2xl font-bold text-white mb-2">No Vault Results</h3>
        <p className="text-gray-400">Try adjusting your search or filters.</p>
    </div>
);
