
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, ShoppingCart, WifiOff, RefreshCw, HelpCircle, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface VoiceAssistantProps {
  isListening: boolean;
  isSpeaking: boolean;
  toggleListening: () => void;
  toggleMute: () => void;
  isMuted: boolean;
  lastCommand: string;
  cartCount: number;
  onCartClick: () => void;
  hasError?: boolean;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  isListening,
  isSpeaking,
  toggleListening,
  toggleMute,
  isMuted,
  lastCommand,
  cartCount,
  onCartClick,
  hasError = false,
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const micRef = useRef<HTMLDivElement>(null);
  const [connectionStatus, setConnectionStatus] = useState<'active' | 'error' | 'reconnecting'>(
    hasError ? 'error' : 'active'
  );
  const [showRetry, setShowRetry] = useState(false);

  // Update connection status when error state changes
  useEffect(() => {
    setConnectionStatus(hasError ? 'error' : isListening ? 'active' : 'reconnecting');
    setShowRetry(hasError);
  }, [hasError, isListening]);

  useEffect(() => {
    if (isListening && !hasError) {
      toast({
        title: "Voice Assistant Active",
        description: "I'm listening. What would you like to do?",
        duration: 3000,
      });
    }
  }, [isListening, toast, hasError]);

  useEffect(() => {
    if (hasError) {
      toast({
        title: "Voice Assistant Error",
        description: "Having trouble with the microphone. Trying to reconnect...",
        variant: "destructive",
        duration: 5000,
      });
    }
  }, [hasError, toast]);

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the parent click handler from firing
    setConnectionStatus('reconnecting');
    setShowRetry(false);
    setTimeout(() => {
      toggleListening();
    }, 500);
  };

  const navigateToHelp = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/help');
  };

  const navigateToHome = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/');
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-4">
      {lastCommand && (
        <div className="bg-white/90 backdrop-blur-sm text-primary px-6 py-3 rounded-full shadow-lg animate-fade-in">
          <p className="font-medium">"{lastCommand}"</p>
        </div>
      )}
      
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={navigateToHome}
          className="rounded-full shadow-md bg-white h-12 w-12"
          aria-label="Go to home page"
        >
          <Home className="h-6 w-6" />
        </Button>

        <Button 
          variant="outline" 
          size="icon" 
          onClick={toggleMute}
          className="rounded-full shadow-md bg-white h-12 w-12"
          aria-label={isMuted ? "Unmute voice assistant" : "Mute voice assistant"}
        >
          {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
        </Button>
        
        <div 
          ref={micRef}
          onClick={toggleListening}
          className={cn(
            "relative flex items-center justify-center w-16 h-16 rounded-full cursor-pointer text-white shadow-lg",
            isListening && !hasError ? "bg-primary pulse-animation" : "",
            hasError ? "bg-red-500 animate-pulse" : "bg-primary",
            !isListening && !hasError ? "bg-slate-400" : ""
          )}
          aria-label={isListening ? "Stop listening" : "Start listening"}
        >
          <div className="relative z-10 flex items-center justify-center w-full h-full">
            {hasError ? (
              <div className="relative">
                <WifiOff className="h-8 w-8" />
                {showRetry && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute -top-8 -right-8 h-6 w-6 p-1 bg-white text-red-500 rounded-full hover:bg-white/80"
                    onClick={handleRetry}
                    aria-label="Retry connection"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ) : isListening ? (
              <Mic className="h-8 w-8 animate-bounce-subtle" />
            ) : (
              <MicOff className="h-8 w-8" />
            )}
          </div>
        </div>

        <Button 
          variant="outline" 
          size="icon" 
          onClick={navigateToHelp}
          className="rounded-full shadow-md bg-white h-12 w-12"
          aria-label="Get help"
        >
          <HelpCircle className="h-6 w-6" />
        </Button>
        
        <Button 
          variant="outline" 
          size="icon" 
          onClick={onCartClick}
          className="rounded-full shadow-md bg-white h-12 w-12 relative"
          aria-label="Open shopping cart"
        >
          <ShoppingCart className="h-6 w-6" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </Button>
      </div>

      {/* Connection status indicator */}
      <div className="text-xs text-center text-white bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
        {connectionStatus === 'active' && "Voice assistant active"}
        {connectionStatus === 'error' && "Network error - tap to retry"}
        {connectionStatus === 'reconnecting' && "Reconnecting..."}
      </div>
    </div>
  );
};

export default VoiceAssistant;
