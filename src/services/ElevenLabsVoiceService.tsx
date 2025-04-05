
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useConversation, Role } from '@11labs/react';

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

  const conversation = useConversation({
    onMessage: (props: { message: string; source: Role }) => {
      if (props.source === 'user') {
        setLastTranscript(props.message);
        if (onTranscriptCallback) {
          onTranscriptCallback(props.message);
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
      if (fallbackService) {
        fallbackService.startListening();
      }
    }
  });

  useEffect(() => {
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

  useEffect(() => {
    const checkSpeaking = () => {
      setIsSpeaking(window.speechSynthesis.speaking);
    };
    
    const interval = setInterval(checkSpeaking, 100);
    return () => clearInterval(interval);
  }, []);

  const initialize = async (key: string, onTranscript?: (text: string) => void) => {
    try {
      localStorage.setItem('elevenLabsApiKey', key);
      setApiKey(key);
      
      if (onTranscript) {
        setOnTranscriptCallback(() => onTranscript);
      }
      
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
    
    if (isInitialized && apiKey && !hasError) {
      setIsSpeaking(true);
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else if (fallbackService) {
      fallbackService.speak(text);
    }
  };

  const startListening = () => {
    if (isInitialized && apiKey && !hasError) {
      setIsListening(true);
    } else if (fallbackService) {
      fallbackService.startListening();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (isInitialized && apiKey && !hasError) {
      setIsListening(false);
    } else if (fallbackService) {
      fallbackService.stopListening();
      setIsListening(false);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
    } else {
      window.speechSynthesis.cancel();
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
