
import React, { useRef, useState } from 'react';
import type { WaifuImage } from '../types';
import { ImageCard } from './ImageCard';

interface ContentRowProps<T> {
    title: string;
    items: T[];
    renderItem: (item: T) => React.ReactNode;
    subtitle?: string;
    variant?: 'poster' | 'landscape' | 'wide';
}

const ChevronLeft = () => (
    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
);

const ChevronRight = () => (
    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
);

export function ContentRow<T>({ title, items, renderItem, subtitle, variant = 'poster' }: ContentRowProps<T>) {
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

    const itemWidth = variant === 'landscape'
        ? 'w-[280px] sm:w-[340px] lg:w-[410px]'
        : variant === 'wide'
            ? 'w-[220px] sm:w-[280px] lg:w-[320px]'
            : 'w-[160px] md:w-[220px]';

    return (
        <section className="mb-10 group relative">
            <div className="mb-3 flex items-end justify-between gap-4 px-4 md:px-12">
                <div>
                    <h2 className="text-xl md:text-2xl font-black tracking-tight text-gray-100 transition-colors group-hover:text-white">
                        {title}
                    </h2>
                    {subtitle && <p className="mt-1 text-xs text-gray-500 md:text-sm">{subtitle}</p>}
                </div>
                <div className="hidden h-px flex-1 bg-gradient-to-r from-violet-500/30 via-white/10 to-transparent md:block" />
            </div>
            
            <div className="group/row relative">
                {/* Left Arrow */}
                <div 
                    className={`absolute top-0 bottom-0 left-0 bg-gradient-to-r from-black via-black/70 to-transparent z-40 w-16 flex items-center justify-center cursor-pointer transition-opacity duration-300 ${!isMoved ? 'hidden' : 'opacity-0 group-hover/row:opacity-100'}`}
                    onClick={() => handleClick('left')}
                >
                    <ChevronLeft />
                </div>

                {/* Row Content */}
                <div 
                    ref={rowRef}
                    className="flex items-stretch gap-3 overflow-x-scroll no-scrollbar px-4 pb-2 md:px-12 scroll-smooth"
                >
                    {items.map((item, idx) => (
                        <div key={idx} className={`flex-none ${itemWidth}`}>
                            {renderItem(item)}
                        </div>
                    ))}
                </div>

                {/* Right Arrow */}
                <div 
                    className="absolute top-0 bottom-0 right-0 bg-gradient-to-l from-black via-black/70 to-transparent z-40 w-16 flex items-center justify-center cursor-pointer opacity-0 group-hover/row:opacity-100 transition-opacity duration-300"
                    onClick={() => handleClick('right')}
                >
                    <ChevronRight />
                </div>
            </div>
        </section>
    );
}
