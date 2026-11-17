import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { hasProfileData } from '../services/matchingService.js';

/**
 * Perfil profissional local (sem conta, sem servidor).
 * Fica SOMENTE no localStorage deste navegador: não é enviado ao backend nem a terceiros,
 * não sincroniza entre dispositivos e pode ser apagado a qualquer momento.
 * O documento original (PDF/DOCX) nunca é armazenado — apenas os campos estruturados.
 */
export const STORAGE_KEY = 'jobsmarica.curriculo.v1';

export const EMPTY_RESUME = {
  name: '', objective: '', desiredRoles: [], city: 'Maricá', neighborhood: '',
  educationLevel: '', formations: [], courses: [], experiences: [], noExperience: false,
  hardSkills: [], softSkills: [], languages: [],
  desiredContracts: [], desiredModes: [], areas: [],
};

const ResumeContext = createContext(null);

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { ...EMPTY_RESUME, ...parsed };
  } catch {
    return null;
  }
}

export function ResumeProvider({ children }) {
  const [resume, setResume] = useState(read);
  const [storageError, setStorageError] = useState(null);

  // Mantém abas abertas do site sincronizadas.
  useEffect(() => {
    const onStorage = (e) => e.key === STORAGE_KEY && setResume(read());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const save = useCallback((data) => {
    const value = { ...EMPTY_RESUME, ...data, updatedAt: new Date().toISOString() };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      setStorageError(null);
    } catch {
      setStorageError('Não foi possível salvar neste navegador (armazenamento bloqueado ou cheio).');
      return false;
    }
    setResume(value);
    return true;
  }, []);

  const clear = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* nada a remover */ }
    setResume(null);
  }, []);

  const value = useMemo(() => ({
    resume, save, clear, storageError, hasResume: hasProfileData(resume),
  }), [resume, save, clear, storageError]);
  return <ResumeContext.Provider value={value}>{children}</ResumeContext.Provider>;
}

export const useResume = () => useContext(ResumeContext);
