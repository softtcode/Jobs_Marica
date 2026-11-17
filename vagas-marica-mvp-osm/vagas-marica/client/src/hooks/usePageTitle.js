import { useEffect } from 'react';

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Jobs Maricá` : 'Jobs Maricá — oportunidades de trabalho em Maricá e região';
  }, [title]);
}
