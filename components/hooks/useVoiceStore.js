import { useState, useEffect } from 'react';

// Mock voice data - in production this would come from an API
const MOCK_VOICES = [
  {
    id: 'voice-1',
    name: 'Emma (US Female)',
    language: 'English (US)',
    gender: 'female',
    languageCode: 'en-US',
    sample: '/audio/samples/emma.mp3'
  },
  {
    id: 'voice-2',
    name: 'James (US Male)',
    language: 'English (US)',
    gender: 'male',
    languageCode: 'en-US',
    sample: '/audio/samples/james.mp3'
  },
  {
    id: 'voice-3',
    name: 'Sophie (UK Female)',
    language: 'English (UK)',
    gender: 'female',
    languageCode: 'en-GB',
    sample: '/audio/samples/sophie.mp3'
  },
  {
    id: 'voice-4',
    name: 'Pierre (French Male)',
    language: 'French',
    gender: 'male',
    languageCode: 'fr-FR',
    sample: '/audio/samples/pierre.mp3'
  }
];

export const useVoiceStore = () => {
  const [voices, setVoices] = useState(MOCK_VOICES);
  const [generatedItems, setGeneratedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load voices from API/storage
  useEffect(() => {
    loadVoices();
    loadGeneratedItems();
  }, []);

  const loadVoices = async () => {
    try {
      // In production: fetch from API
      // const response = await fetch('/api/voices');
      // const data = await response.json();
      // setVoices(data);
    } catch (error) {
      console.error('Failed to load voices:', error);
    }
  };

  const loadGeneratedItems = () => {
    try {
      const saved = localStorage.getItem('generatedVoiceItems');
      if (saved) {
        setGeneratedItems(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load generated items:', error);
    }
  };

  const generateSpeech = async (text, voice) => {
    setIsLoading(true);
    try {
      // In production: call Google TTS API
      // For demo: simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock audio URL generation
      const audioUrl = `data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQXAjCO0fLOfjAFLG7J7N+ZVwgOWqfq6qRZGgxGn+HwvmcXAjCP0fLOfjI=`;

      const newItem = {
        id: Date.now().toString(),
        text,
        voice,
        audioUrl,
        duration: '0:15', // Mock duration
        createdAt: new Date().toISOString(),
        title: text.length > 30 ? `${text.substring(0, 30)}...` : text
      };

      const updatedItems = [...generatedItems, newItem];
      setGeneratedItems(updatedItems);

      // Save to localStorage
      localStorage.setItem('generatedVoiceItems', JSON.stringify(updatedItems));

      return audioUrl;
    } catch (error) {
      console.error('Failed to generate speech:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteItem = (itemId) => {
    const updatedItems = generatedItems.filter(item => item.id !== itemId);
    setGeneratedItems(updatedItems);
    localStorage.setItem('generatedVoiceItems', JSON.stringify(updatedItems));
  };

  const updateItem = (itemId, updates) => {
    const updatedItems = generatedItems.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    );
    setGeneratedItems(updatedItems);
    localStorage.setItem('generatedVoiceItems', JSON.stringify(updatedItems));
  };

  return {
    voices,
    generatedItems,
    isLoading,
    generateSpeech,
    deleteItem,
    updateItem
  };
};