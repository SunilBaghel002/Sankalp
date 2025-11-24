// src/components/RouteTitle.tsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface RouteTitleProps {
    titles: Record<string, string>;
    defaultTitle?: string;
}

const RouteTitle: React.FC<RouteTitleProps> = ({
    titles,
    defaultTitle = 'Sankalp - Habit Tracker'
}) => {
    const location = useLocation();

    useEffect(() => {
        const currentTitle = titles[location.pathname] || defaultTitle;
        document.title = currentTitle;
    }, [location.pathname, titles, defaultTitle]);

    return null; // This component doesn't render anything
};

export default RouteTitle;