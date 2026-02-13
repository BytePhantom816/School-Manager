import { useState, useEffect } from 'react';

export function useDevice() {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
            setIsDesktop(window.innerWidth > 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return { isMobile, isDesktop };
}
