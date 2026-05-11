
import React, { useRef, useState } from 'react';
import type { WaifuImage } from '../types';
import { ImageCard } from './ImageCard';

interface ContentRowProps<T> {
    title: string;
    items: T[];
    renderItem: (item: T) => React.ReactNode;
}

const ChevronLeft = () => (
    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
);

const ChevronRight = () => (
    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
);

export function ContentRow<T>({ title, items, renderItem }: ContentRowProps<T>) {
    const rowRef = useRef<HTMLDivElement>(null);
    const [isMoved, setIsMoved] = useState(false);

    const handleClick = (direction: 'left' | 'right') => {
        if (rowRef.current) {
            const { scrollLeft, clientWidth } = rowRef.current;
            const scrollTo = direction === 'left' 
                ? scrollLeft - clientWidth 
                : scrollLeft + clientWidth;
            
            rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
            
            if (direction === 'right') setIsMoved(true);
            if (direction === 'left' && scrollTo <= 0) setIsMoved(false);
        }
    };

    if (items.length === 0) return null;

    return (
        <div className="mb-8 group relative">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-100 mb-2 px-4 md:px-12 transition-colors hover:text-white cursor-pointer">
                {title}
            </h2>
            
            <div className="group/row relative">
                {/* Left Arrow */}
                <div 
                    className={`absolute top-0 bottom-0 left-0 bg-black/50 z-40 w-12 flex items-center justify-center cursor-pointer transition-opacity duration-300 hover:bg-black/70 ${!isMoved ? 'hidden' : 'opacity-0 group-hover/row:opacity-100'}`}
                    onClick={() => handleClick('left')}
                >
                    <ChevronLeft />
                </div>

                {/* Row Content */}
                <div 
                    ref={rowRef}
                    className="flex items-center space-x-2 overflow-x-scroll no-scrollbar px-4 md:px-12 scroll-smooth"
                >
                    {items.map((item, idx) => (
                        <div key={idx} className="flex-none w-[160px] md:w-[220px]">
                            {renderItem(item)}
                        </div>
                    ))}
                </div>

                {/* Right Arrow */}
                <div 
                    className="absolute top-0 bottom-0 right-0 bg-black/50 z-40 w-12 flex items-center justify-center cursor-pointer opacity-0 group-hover/row:opacity-100 transition-opacity duration-300 hover:bg-black/70"
                    onClick={() => handleClick('right')}
                >
                    <ChevronRight />
                </div>
            </div>
        </div>
    );
}
