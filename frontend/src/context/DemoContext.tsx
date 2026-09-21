import React, { createContext, useContext, useState, useEffect } from 'react';
import { DemoSample, ThreatAnalysis } from '../types';
import { fetchDemoSamples, resetDemoEnvironment, analyzeEmail } from '../services/api';

interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
}

interface DemoContextType {
  samples: DemoSample[];
  activeAnalysis: ThreatAnalysis | null;
  currentAnalysis: ThreatAnalysis | null;
  setActiveAnalysis: (a: ThreatAnalysis | null) => void;
  loadSampleScenario: (sampleId: string) => Promise<ThreatAnalysis | null>;
  loadSample: (sampleId: string) => Promise<ThreatAnalysis | null>;
  resetEnvironment: () => Promise<void>;
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  isAnalyzing: boolean;
  activeWorkspace: string;
  setActiveWorkspace: (w: string) => void;
  currentPage: string;
  setCurrentPage: (p: string) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [samples, setSamples] = useState<DemoSample[]>([]);
  const [activeAnalysis, setActiveAnalysis] = useState<ThreatAnalysis | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [activeWorkspace, setActiveWorkspace] = useState<string>('Global SOC - Enterprise');
  const [currentPage, setCurrentPage] = useState<string>('dashboard');

  useEffect(() => {
    fetchDemoSamples().then(data => setSamples(data)).catch(() => {});
  }, []);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const loadSampleScenario = async (sampleId: string): Promise<ThreatAnalysis | null> => {
    const s = samples.find(x => x.id === sampleId);
    if (!s) return null;
    setIsAnalyzing(true);
    addToast({
      type: 'info',
      title: 'Ingesting Sample',
      message: `Loading ${s.name}...`
    });
    try {
      const res = await analyzeEmail({ eml_text: s.raw_eml, filename: `${s.id}.eml` });
      setActiveAnalysis(res);
      addToast({
        type: 'success',
        title: 'Forensic Analysis Complete',
        message: `${res.threat_classification} detected (Score: ${res.risk_score}/100)`
      });
      return res;
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Ingestion Error',
        message: err.message || 'Failed to analyze scenario'
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetEnvironment = async () => {
    try {
      await resetDemoEnvironment();
      addToast({
        type: 'success',
        title: 'Environment Reset',
        message: 'All cases, alerts, evidence, and sample data have been restored to baseline.'
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Reset Failed',
        message: err.message
      });
    }
  };

  return (
    <DemoContext.Provider value={{
      samples,
      activeAnalysis,
      currentAnalysis: activeAnalysis,
      setActiveAnalysis,
      loadSampleScenario,
      loadSample: loadSampleScenario,
      resetEnvironment,
      toasts,
      addToast,
      removeToast,
      isAnalyzing,
      activeWorkspace,
      setActiveWorkspace,
      currentPage,
      setCurrentPage
    }}>
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) throw new Error('useDemo must be used within DemoProvider');
  return context;
};
