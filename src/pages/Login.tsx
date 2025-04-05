
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mic, Loader2, VolumeX, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { useElevenLabsVoice } from '@/services/ElevenLabsVoiceService';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentField, setCurrentField] = useState<'email' | 'password' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    speak, 
    startListening, 
    stopListening, 
    isListening, 
    lastTranscript, 
    hasError,
    toggleMute,
    isMuted
  } = useElevenLabsVoice();

  // Welcome message on page load
  useEffect(() => {
    setTimeout(() => {
      speak("Welcome to the login page. You can use voice commands to enter your email, password, and log in. Say 'email' to start entering your email address.");
    }, 1000);
    
    // Start listening automatically
    startListening();
    
    return () => {
      stopListening();
    };
  }, []);

  // Process voice commands
  useEffect(() => {
    if (!lastTranscript || !isListening) return;
    
    const transcript = lastTranscript.toLowerCase();
    
    // Process commands
    if (transcript.includes('email')) {
      setCurrentField('email');
      emailInputRef.current?.focus();
      speak("Please say your email address");
      return;
    }
    
    if (transcript.includes('password')) {
      setCurrentField('password');
      passwordInputRef.current?.focus();
      speak("Please say your password");
      return;
    }
    
    if (transcript.includes('login') || transcript.includes('submit') || transcript.includes('sign in')) {
      handleSubmit();
      return;
    }
    
    if (transcript.includes('register') || transcript.includes('sign up')) {
      speak("Taking you to the registration page");
      navigate('/register');
      return;
    }
    
    if (transcript.includes('help')) {
      speak("You can say email to input your email, password to input your password, login to submit the form, or register to create a new account.");
      return;
    }
    
    // Field input
    if (currentField === 'email') {
      // Remove spaces and convert to lowercase for email
      const cleanedEmail = lastTranscript.replace(/\s+/g, '').toLowerCase();
      setEmail(cleanedEmail);
      speak(`Email set to ${cleanedEmail.split('').join(' ')}`);
    } else if (currentField === 'password') {
      // Remove spaces for password
      const cleanedPassword = lastTranscript.replace(/\s+/g, '');
      setPassword(cleanedPassword);
      speak("Password has been set");
    }
  }, [lastTranscript, isListening, currentField]);

  const handleVoiceButtonClick = (field: 'email' | 'password' | null) => {
    setCurrentField(field);
    if (!isListening) {
      startListening();
    }
    
    if (field === 'email') {
      speak("Please say your email address");
      emailInputRef.current?.focus();
    } else if (field === 'password') {
      speak("Please say your password");
      passwordInputRef.current?.focus();
    } else {
      speak("I'm listening. What would you like to do?");
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!email || !password) {
      speak("Please provide both email and password");
      toast.error("Please provide both email and password");
      return;
    }
    
    try {
      setIsSubmitting(true);
      await login(email, password);
      speak("Login successful! Taking you to the shop.");
      toast.success("Login successful!");
      navigate('/');
    } catch (error) {
      speak("Login failed. Please try again.");
      toast.error("Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Voice Grocer Aid</h1>
          <h2 className="text-2xl mt-6 mb-2">Login</h2>
          <p className="text-muted-foreground">
            Sign in to your account or{" "}
            <Link to="/register" className="text-primary hover:underline">
              create a new account
            </Link>
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="email">Email</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleVoiceButtonClick('email')}
                  className="h-8 w-8 p-0"
                >
                  <Mic className="h-4 w-4" />
                  <span className="sr-only">Use voice for email</span>
                </Button>
              </div>
              <Input
                ref={emailInputRef}
                id="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleVoiceButtonClick('password')}
                  className="h-8 w-8 p-0"
                >
                  <Mic className="h-4 w-4" />
                  <span className="sr-only">Use voice for password</span>
                </Button>
              </div>
              <Input
                ref={passwordInputRef}
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>
          
          <div className="mt-6 space-y-4">
            <Button
              type="button"
              variant={isListening ? "default" : "secondary"}
              className="w-full"
              onClick={() => {
                if (isListening) {
                  stopListening();
                } else {
                  startListening();
                  handleVoiceButtonClick(null);
                }
              }}
            >
              {isListening ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Listening...
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-4 w-4" />
                  Use Voice Assistant
                </>
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={toggleMute}
            >
              {isMuted ? (
                <>
                  <VolumeX className="mr-2 h-4 w-4" />
                  Unmute Voice
                </>
              ) : (
                <>
                  <Volume2 className="mr-2 h-4 w-4" />
                  Mute Voice
                </>
              )}
            </Button>
            
            {hasError && (
              <p className="text-center text-sm text-red-500">
                Voice assistant has encountered an error. Please try refreshing the page.
              </p>
            )}
            
            {currentField && (
              <div className="mt-2 text-center text-sm text-muted-foreground">
                Currently listening for: <span className="font-medium">{currentField}</span>
              </div>
            )}
            
            {lastTranscript && (
              <div className="mt-2 p-2 border rounded-md bg-muted/50">
                <p className="text-sm">I heard: "{lastTranscript}"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
