
interface VoiceServiceConfig {
  onResult: (transcript: string) => void;
  onEnd: () => void;
  onError: (error: string) => void;
}

class VoiceService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis;
  private config: VoiceServiceConfig;
  private isMuted: boolean = false;
  private autoRestart: boolean = true;
  private isListening: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectTimeout: number | null = null;
  private utteranceQueue: SpeechSynthesisUtterance[] = [];
  private currentVoice: SpeechSynthesisVoice | null = null;
  private lastProcessedResult: string = '';
  private resultTimer: number | null = null;

  constructor(config: VoiceServiceConfig) {
    this.config = config;
    this.synthesis = window.speechSynthesis;
    this.loadOptimalVoice();
    this.initRecognition();
  }

  private loadOptimalVoice() {
    // Load voices immediately if available
    const voices = this.synthesis.getVoices();
    if (voices.length > 0) {
      this.selectBestVoice();
    }
    
    // Also set up the event for when voices are loaded asynchronously
    this.synthesis.onvoiceschanged = () => {
      this.selectBestVoice();
    };
  }

  private selectBestVoice() {
    const voices = this.synthesis.getVoices();
    
    // Try to find a high-quality voice
    const preferredVoice = voices.find(voice => 
      (voice.name.includes('Google US English') || 
       voice.name.includes('Microsoft David') ||
       voice.name.includes('Microsoft Zira') ||
       voice.name.includes('Samantha') ||
       voice.name.includes('Daniel'))
    );
    
    if (preferredVoice) {
      this.currentVoice = preferredVoice;
      console.log(`Selected voice: ${preferredVoice.name}`);
    } else if (voices.length > 0) {
      // Fallback to the first English voice
      this.currentVoice = voices.find(v => v.lang.includes('en')) || voices[0];
      console.log(`Fallback voice: ${this.currentVoice.name}`);
    }
  }

  private initRecognition() {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      this.config.onError('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognitionAPI();
    
    this.recognition.lang = 'en-US';
    this.recognition.continuous = true;
    this.recognition.interimResults = false; // Only get final results for better performance
    this.recognition.maxAlternatives = 2;
    
    this.recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      
      // Debounce results to avoid duplicate processing
      if (transcript !== this.lastProcessedResult) {
        this.lastProcessedResult = transcript;
        
        // Clear any existing timer
        if (this.resultTimer !== null) {
          clearTimeout(this.resultTimer);
        }
        
        // Set a new timer to process the result
        this.resultTimer = window.setTimeout(() => {
          this.config.onResult(transcript);
          this.resultTimer = null;
        }, 300);
      }
    };
    
    this.recognition.onend = () => {
      this.isListening = false;
      this.config.onEnd();
      
      // Auto restart if needed
      if (this.autoRestart) {
        this.handleReconnect();
      }
    };
    
    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      if (event.error === 'network') {
        this.config.onError(`Network connection issue. Trying to reconnect...`);
        this.handleReconnect();
      } else if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        this.config.onError(`Microphone access denied. Please allow microphone access to use voice features.`);
      } else if (event.error === 'no-speech') {
        // Silently restart on no-speech without showing error to user
        this.handleReconnect();
      } else {
        this.config.onError(`Error: ${event.error}. Trying to reconnect...`);
        this.handleReconnect();
      }
    };
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.config.onError(`Failed to reconnect after ${this.maxReconnectAttempts} attempts. Please check your network connection and reload the page.`);
      this.reconnectAttempts = 0;
      return;
    }

    this.reconnectAttempts++;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    // Use linear backoff instead of exponential for faster recovery
    const delay = Math.min(1000 * this.reconnectAttempts, 5000);
    
    this.reconnectTimeout = window.setTimeout(() => {
      console.log(`Attempting to reconnect speech recognition (attempt ${this.reconnectAttempts})`);
      this.startListening();
    }, delay);
  }

  startListening() {
    if (!this.recognition) {
      this.initRecognition();
      if (!this.recognition) return;
    }
    
    try {
      // Always stop before starting to reset any existing session
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignore errors when stopping - it might not be running
      }
      
      // Small delay to ensure clean restart
      setTimeout(() => {
        try {
          this.recognition?.start();
          this.isListening = true;
          this.autoRestart = true;
          this.reconnectAttempts = 0;
          this.lastProcessedResult = '';
        } catch (e) {
          console.error("Failed to start recognition:", e);
          this.config.onError('Failed to start voice recognition. Please reload the page.');
        }
      }, 100);
    } catch (error) {
      console.error("Failed to manage recognition:", error);
      
      // Try to recover by re-initializing
      this.initRecognition();
      setTimeout(() => {
        try {
          this.recognition?.start();
          this.isListening = true;
        } catch (err) {
          this.config.onError('Failed to start voice recognition. Please reload the page.');
        }
      }, 500);
    }
  }

  stopListening() {
    this.autoRestart = false;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.resultTimer !== null) {
      clearTimeout(this.resultTimer);
      this.resultTimer = null;
    }
    
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
        this.isListening = false;
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
  }

  speak(text: string) {
    if (this.isMuted) return;
    
    // Cancel any current speech
    this.synthesis.cancel();
    this.utteranceQueue = [];
    
    // Split long text to improve reliability
    const sentences = this.splitIntoSentences(text);
    
    // Create utterances for each sentence
    sentences.forEach(sentence => {
      if (sentence.trim().length === 0) return;
      
      const utterance = new SpeechSynthesisUtterance(sentence);
      
      // Apply settings
      utterance.rate = 1.1;  // Slightly faster for better responsiveness
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Apply voice if we have one
      if (this.currentVoice) {
        utterance.voice = this.currentVoice;
      }
      
      this.utteranceQueue.push(utterance);
    });
    
    this.processUtteranceQueue();
  }
  
  private splitIntoSentences(text: string): string[] {
    // Split text at sentence breaks to improve TTS
    return text.match(/[^.!?]+[.!?]+|\s*[^.!?]+$/g) || [text];
  }
  
  private processUtteranceQueue() {
    if (this.utteranceQueue.length === 0) return;
    
    const utterance = this.utteranceQueue.shift()!;
    
    utterance.onend = () => {
      // Process next utterance in queue with minimal delay
      setTimeout(() => this.processUtteranceQueue(), 50);
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      // Try next utterance on error
      this.processUtteranceQueue();
    };
    
    this.synthesis.speak(utterance);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    
    if (this.isMuted) {
      this.synthesis.cancel();
    }
    
    return this.isMuted;
  }

  isSpeaking() {
    return this.synthesis.speaking;
  }
  
  // Return current status
  getStatus() {
    return {
      isListening: this.isListening,
      isMuted: this.isMuted,
      isSpeaking: this.synthesis.speaking,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

export default VoiceService;
