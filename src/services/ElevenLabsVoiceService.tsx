
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useConversation } from '@11labs/react';

interface ElevenLabsVoiceContextProps {
  speak: (text: string) => void;
  isSpeaking: boolean;
  startListening: () => void;
  stopListening: () => void;
  isListening: boolean;
  lastTranscript: string;
  hasError: boolean;
  toggleMute: () => void;
  isMuted: boolean;
  initialize: (apiKey: string, onTranscript?: (text: string) => void) => Promise<void>;
  isInitialized: boolean;
}

interface ConversationMessage {
  role: string;
  content: string;
}

const ElevenLabsVoiceContext = createContext<ElevenLabsVoiceContextProps | undefined>(undefined);

export const ElevenLabsVoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiKey, setApiKey] = useState<string | null>(localStorage.getItem('elevenLabsApiKey'));
  const [isInitialized, setIsInitialized] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [hasError, setHasError] = useState(false);
  const [onTranscriptCallback, setOnTranscriptCallback] = useState<((text: string) => void) | undefined>(undefined);
  const [fallbackService, setFallbackService] = useState<any | null>(null);

  // Initialize ElevenLabs conversation
  const conversation = useConversation({
    onMessage: (message: ConversationMessage) => {
      if (message.role === 'user') {
        setLastTranscript(message.content);
        if (onTranscriptCallback) {
          onTranscriptCallback(message.content);
        }
      }
    },
    onConnect: () => {
      setHasError(false);
    },
    onDisconnect: () => {
      setIsListening(false);
    },
    onError: (error) => {
      console.error('ElevenLabs error:', error);
      setHasError(true);
      // Fall back to Web Speech API if available
      if (fallbackService) {
        fallbackService.startListening();
      }
    }
  });

  // Initialize fallback Web Speech API service
  useEffect(() => {
    // Import dynamically to avoid issues if Speech API isn't available
    import('./VoiceService').then((VoiceServiceModule) => {
      const service = new VoiceServiceModule.default({
        onResult: (transcript: string) => {
          setLastTranscript(transcript);
          if (onTranscriptCallback) {
            onTranscriptCallback(transcript);
          }
        },
        onEnd: () => setIsListening(false),
        onError: (error: string) => {
          console.error('Fallback voice error:', error);
          setHasError(true);
        }
      });
      setFallbackService(service);
    });
  }, [onTranscriptCallback]);
  
  // Check if speech synthesis is speaking
  useEffect(() => {
    const checkSpeaking = () => {
      setIsSpeaking(window.speechSynthesis.speaking);
    };
    
    const interval = setInterval(checkSpeaking, 100);
    return () => clearInterval(interval);
  }, []);

  const initialize = async (key: string, onTranscript?: (text: string) => void) => {
    try {
      // Store API key
      localStorage.setItem('elevenLabsApiKey', key);
      setApiKey(key);
      
      if (onTranscript) {
        setOnTranscriptCallback(() => onTranscript);
      }
      
      // For ElevenLabs API initialization, we would need to set up the agent
      // This is a placeholder for the actual initialization
      setIsInitialized(true);
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to initialize ElevenLabs voice service:', error);
      setHasError(true);
      return Promise.reject(error);
    }
  };

  const speak = (text: string) => {
    if (isMuted) return;
    
    // If ElevenLabs is initialized and working, use it
    if (isInitialized && apiKey && !hasError) {
      // ElevenLabs speech synthesis would go here
      // This is a placeholder for the actual implementation
      setIsSpeaking(true);
      
      // For now, fall back to Web Speech API
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else if (fallbackService) {
      // Fall back to Web Speech API
      fallbackService.speak(text);
    }
  };

  const startListening = () => {
    if (isInitialized && apiKey && !hasError) {
      // Start ElevenLabs conversation
      // This would be the actual implementation
      setIsListening(true);
    } else if (fallbackService) {
      // Fall back to Web Speech API
      fallbackService.startListening();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (isInitialized && apiKey && !hasError) {
      // Stop ElevenLabs conversation
      // This would be the actual implementation
      setIsListening(false);
    } else if (fallbackService) {
      // Fall back to Web Speech API
      fallbackService.stopListening();
      setIsListening(false);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
    } else {
      window.speechSynthesis.cancel(); // Stop any current speech
      setIsMuted(true);
    }
    
    return !isMuted;
  };

  return (
    <ElevenLabsVoiceContext.Provider
      value={{
        speak,
        isSpeaking,
        startListening,
        stopListening,
        isListening,
        lastTranscript,
        hasError,
        toggleMute,
        isMuted,
        initialize,
        isInitialized,
      }}
    >
      {children}
    </ElevenLabsVoiceContext.Provider>
  );
};

export const useElevenLabsVoice = () => {
  const context = useContext(ElevenLabsVoiceContext);
  if (context === undefined) {
    throw new Error('useElevenLabsVoice must be used within an ElevenLabsVoiceProvider');
  }
  return context;
};
