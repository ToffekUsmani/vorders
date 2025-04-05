
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useElevenLabsVoice } from '@/services/ElevenLabsVoiceService';
import { toast } from 'sonner';
import { Loader2, Key } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Setup = () => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { initialize, isInitialized } = useElevenLabsVoice();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // If already initialized, redirect to the main page
    if (isInitialized) {
      navigate(user ? '/' : '/login');
    }
    
    // Check local storage for api key
    const storedKey = localStorage.getItem('elevenLabsApiKey');
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, [isInitialized, navigate, user]);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter your ElevenLabs API key');
      return;
    }

    setIsLoading(true);
    
    try {
      await initialize(apiKey);
      toast.success('Voice service initialized successfully');
      
      // Navigate to login or homepage depending on auth state
      navigate(user ? '/' : '/login');
    } catch (error) {
      console.error('Failed to initialize voice service:', error);
      toast.error('Failed to initialize voice service. Please check your API key.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    toast.info('Using default voice service');
    navigate(user ? '/' : '/login');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Voice Assistant Setup</CardTitle>
          <CardDescription>
            For the best voice experience, we recommend using ElevenLabs. 
            Enter your API key or skip to use the built-in voice assistant.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="apiKey" className="text-sm font-medium">
              ElevenLabs API Key
            </label>
            <div className="flex items-center space-x-2">
              <Key className="w-4 h-4 text-muted-foreground" />
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your ElevenLabs API key"
                className="flex-1"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              You can get your API key from{" "}
              <a 
                href="https://elevenlabs.io/speech-synthesis" 
                target="_blank" 
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                elevenlabs.io
              </a>
            </p>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleSkip}
          >
            Skip for now
          </Button>
          
          <Button 
            onClick={handleSaveApiKey} 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initializing...
              </>
            ) : (
              'Continue'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Setup;
