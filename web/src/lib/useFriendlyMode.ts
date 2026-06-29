import { useState, useEffect } from 'react';

export function useFriendlyMode() {
  const [isSimpleMode, setIsSimpleMode] = useState<boolean>(true);

  useEffect(() => {
    const stored = localStorage.getItem('cargotrust_simple_mode');
    if (stored !== null) {
      setIsSimpleMode(stored === 'true');
    } else {
      localStorage.setItem('cargotrust_simple_mode', 'true');
      setIsSimpleMode(true);
    }
  }, []);

  const toggleSimpleMode = () => {
    const newVal = !isSimpleMode;
    setIsSimpleMode(newVal);
    localStorage.setItem('cargotrust_simple_mode', String(newVal));
    // Trigger custom event so other components update instantly
    window.dispatchEvent(new Event('cargotrust_mode_change'));
  };

  useEffect(() => {
    const handleModeChange = () => {
      const stored = localStorage.getItem('cargotrust_simple_mode');
      if (stored !== null) {
        setIsSimpleMode(stored === 'true');
      }
    };
    window.addEventListener('cargotrust_mode_change', handleModeChange);
    return () => {
      window.removeEventListener('cargotrust_mode_change', handleModeChange);
    };
  }, []);

  return { isSimpleMode, toggleSimpleMode };
}
