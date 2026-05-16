import { useState, useCallback, useEffect } from 'react';
import * as personalizerApi from '../lib/personalizer-api';

const ERROR_MESSAGES = {
  'Rate limit exceeded': 'Too many requests. Please wait a minute and try again.',
  'Unauthorized': 'Please sign in to continue.',
  'Invalid or expired token': 'Your session has expired. Please sign in again.',
  'targetName required': 'Please enter a target name.',
  'Scan failed': 'Unable to scan profiles. Please try again.',
  'Generation failed': 'Unable to generate content. Please try again.',
  'Save failed': 'Unable to save. Please try again.',
  'default': 'Something went wrong. Please try again.'
};

function getErrorMessage(error) {
  const msg = error?.message || error || '';
  for (const [key, message] of Object.entries(ERROR_MESSAGES)) {
    if (msg.includes(key)) return message;
  }
  return ERROR_MESSAGES['default'];
}

function validateTargetName(value) {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 500) return null;
  if (!/^[a-zA-Z0-9_\-\s,]+$/.test(trimmed)) return null;
  return trimmed;
}

export const usePersonalizerStore = () => {
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem('personalizer-state');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return {
      currentStep: 1,
      appId: 'ai-video-agency',
      mode: 'cold-email',
      targetName: '',
      targetCompany: '',
      manualNotes: '',
      offer: '',
      goal: '',
      tone: 'professional',
      cta: '',
      projectId: null,
      scanId: null,
      scanResults: null,
      output: null,
      isScanning: false,
      isGenerating: false,
      error: '',
      history: [],
      apps: [],
      showResultsView: 'table',
      topSites: 500,
      selectedTags: [],
      excludedTags: [],
      enablePermutations: false,
      disableRecursive: false,
      disableParsing: false,
      withDomains: false,
      scanProgress: 0
    };
  });

  useEffect(() => {
    localStorage.setItem('personalizer-state', JSON.stringify(state));
  }, [state]);

  const update = useCallback((patch) => {
    setState(prev => ({ ...prev, ...patch }));
  }, []);

  const setError = useCallback((error) => {
    update({ error: getErrorMessage(error) });
  }, [update]);

  const clearError = useCallback(() => {
    update({ error: '' });
  }, [update]);

  const reset = useCallback(() => {
    setState({
      currentStep: 1,
      appId: 'ai-video-agency',
      mode: 'cold-email',
      targetName: '',
      targetCompany: '',
      manualNotes: '',
      offer: '',
      goal: '',
      tone: 'professional',
      cta: '',
      projectId: null,
      scanId: null,
      scanResults: null,
      output: null,
      isScanning: false,
      isGenerating: false,
      error: '',
      history: state.history,
      apps: state.apps,
      showResultsView: 'table',
      topSites: 500,
      selectedTags: [],
      excludedTags: [],
      enablePermutations: false,
      disableRecursive: false,
      disableParsing: false,
      withDomains: false,
      scanProgress: 0
    });
  }, [state.history, state.apps]);

  const scan = useCallback(async (overrides = {}) => {
    const targetName = validateTargetName(overrides.targetName || state.targetName);
    if (!targetName) {
      setError('Please enter a valid target name (letters, numbers, spaces, commas only)');
      return null;
    }

    update({ isScanning: true, error: '', scanProgress: 0 });
    const interval = setInterval(() => {
      setState(prev => ({ ...prev, scanProgress: Math.min(prev.scanProgress + 5, 95) }));
    }, 200);

    try {
      const result = await personalizerApi.scanProfile(targetName, {
        targetCompany: overrides.targetCompany || state.targetCompany,
        topSites: overrides.topSites || state.topSites,
        tags: overrides.selectedTags || state.selectedTags,
        excludedTags: overrides.excludedTags || state.excludedTags,
        enablePermutations: overrides.enablePermutations || state.enablePermutations,
        disableRecursive: overrides.disableRecursive || state.disableRecursive,
        disableParsing: overrides.disableParsing || state.disableParsing,
        withDomains: overrides.withDomains || state.withDomains
      });

      update({
        scanResults: result.scanData,
        scanId: result.scanId,
        scanProgress: 100,
        isScanning: false
      });
      clearInterval(interval);
      return result;
    } catch (err) {
      clearInterval(interval);
      setError(err);
      update({ isScanning: false });
      return null;
    }
  }, [state, update, setError]);

  const generate = useCallback(async (overrides = {}) => {
    const targetName = validateTargetName(overrides.targetName || state.targetName);
    if (!targetName) {
      setError('Please enter a valid target name');
      return null;
    }

    update({ isGenerating: true, error: '' });

    try {
      const result = await personalizerApi.generateContent({
        appId: overrides.appId || state.appId,
        mode: overrides.mode || state.mode,
        targetName,
        targetCompany: overrides.targetCompany || state.targetCompany,
        manualNotes: overrides.manualNotes || state.manualNotes,
        offer: overrides.offer || state.offer,
        goal: overrides.goal || state.goal,
        tone: overrides.tone || state.tone,
        cta: overrides.cta || state.cta,
        scanResults: overrides.scanResults || state.scanResults,
        projectId: overrides.projectId || state.projectId
      });

      update({
        output: result.output,
        project: result.project,
        projectId: result.project?.id,
        currentStep: 6,
        isGenerating: false
      });
      return result;
    } catch (err) {
      setError(err);
      update({ isGenerating: false });
      return null;
    }
  }, [state, update, setError]);

  const save = useCallback(async () => {
    if (!state.projectId) {
      setError('No project to save');
      return null;
    }
    try {
      const result = await personalizerApi.saveProject(state.projectId);
      update({ currentStep: 7 });
      return result;
    } catch (err) {
      setError(err);
      return null;
    }
  }, [state.projectId, update, setError]);

  const loadProject = useCallback(async (projectId) => {
    try {
      const project = await personalizerApi.getProject(projectId);
      if (project) {
        update({
          projectId: project.id,
          appId: project.app_id,
          mode: project.mode,
          targetName: project.target_name,
          targetCompany: project.target_company || '',
          manualNotes: project.manual_notes || '',
          scanId: project.scan_id
        });
      }
      return project;
    } catch (err) {
      setError(err);
      return null;
    }
  }, [update, setError]);

  const loadHistory = useCallback(async () => {
    try {
      const result = await personalizerApi.getHistory();
      update({ history: result.data || [] });
      return result;
    } catch (err) {
      setError(err);
      return null;
    }
  }, [update, setError]);

  const loadApps = useCallback(async () => {
    try {
      const apps = await personalizerApi.getApps();
      update({ apps: apps || [] });
      return apps;
    } catch {
      return null;
    }
  }, [update]);

  const goToStep = useCallback((step) => {
    update({ currentStep: step });
  }, [update]);

  const nextStep = useCallback(() => {
    setState(prev => ({ ...prev, currentStep: Math.min(prev.currentStep + 1, 8) }));
  }, []);

  const prevStep = useCallback(() => {
    setState(prev => ({ ...prev, currentStep: Math.max(prev.currentStep - 1, 1) }));
  }, []);

  return {
    ...state,
    update,
    setError,
    clearError,
    reset,
    scan,
    generate,
    save,
    loadProject,
    loadHistory,
    loadApps,
    goToStep,
    nextStep,
    prevStep,
    validateTargetName,
    getErrorMessage
  };
};

export { validateTargetName, getErrorMessage };
