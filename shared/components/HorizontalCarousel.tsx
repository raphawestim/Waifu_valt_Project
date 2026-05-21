import React, { useRef } from 'react';

interface HorizontalCarouselProps {
  children: React.ReactNode;
  ariaLabel: string;
  tone?: 'cyan' | 'fuchsia' | 'amber';
}

const toneClasses: Record<NonNullable<HorizontalCarouselProps['tone']>, string> = {
  cyan: 'border-cyan-300/25 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20',
  fuchsia: 'border-fuchsia-300/25 bg-fuchsia-500/10 text-fuchsia-100 hover:bg-fuchsia-500/20',
  amber: 'border-amber-300/25 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20',
};

export const HorizontalCarousel: React.FC<HorizontalCarouselProps> = ({ children, ariaLabel, tone = 'cyan' }) => {
  const trackRef = useRef<HTMLDivElement | null>(null);

  const scrollByPage = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * Math.max(track.clientWidth * 0.82, 280), behavior: 'smooth' });
  };

  return (
    <div className="relative max-w-full overflow-hidden" aria-label={ariaLabel}>
      <div className="mb-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => scrollByPage(-1)}
          className={`flex h-9 w-9 items-center justify-center rounded-full border text-lg font-black transition ${toneClasses[tone]}`}
          aria-label="Previous"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => scrollByPage(1)}
          className={`flex h-9 w-9 items-center justify-center rounded-full border text-lg font-black transition ${toneClasses[tone]}`}
          aria-label="Next"
        >
          ›
        </button>
      </div>
      <div
        ref={trackRef}
        className="flex max-w-full snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-3 no-scrollbar"
      >
        {children}
      </div>
    </div>
  );
};
