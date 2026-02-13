import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

export default function ScrollToTop({ scrollContainerRef }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const toggleVisibility = () => {
            if (container.scrollTop > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        container.addEventListener('scroll', toggleVisibility);
        return () => container.removeEventListener('scroll', toggleVisibility);
    }, [scrollContainerRef]);

    const scrollToTop = () => {
        scrollContainerRef.current.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <button
            onClick={scrollToTop}
            className={`btn btn-primary btn-icon shadow-lg ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
            style={{
                position: 'fixed',
                bottom: 'calc(var(--safe-area-bottom) + 100px)',
                right: 'calc(var(--safe-area-right) + 20px)',
                zIndex: 1000,
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4), 0 8px 10px -6px rgba(16, 185, 129, 0.4)',
                background: 'var(--primary-color)'
            }}
            aria-label="Scroll to top"
        >
            <ChevronUp size={24} color="white" />
        </button>
    );
}
