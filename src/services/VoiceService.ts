
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
  private maxReconnectAttempts: number = 10; // Increased from 5 to 10
  private reconnectTimeout: number | null = null;
  private utteranceQueue: SpeechSynthesisUtterance[] = [];
  private currentVoice: SpeechSynthesisVoice | null = null;

  constructor(config: VoiceServiceConfig) {
    this.config = config;
    this.synthesis = window.speechSynthesis;
    this.loadOptimalVoice();
    this.initRecognition();
  }

  private loadOptimalVoice() {
    // Wait for voices to be loaded
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = () => {
        this.selectBestVoice();
      };
    } else {
      // Fallback for browsers that don't support onvoiceschanged
      setTimeout(() => this.selectBestVoice(), 1000);
    }
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
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 3;
    
    this.recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      if (event.results[event.results.length - 1].isFinal) {
        this.config.onResult(transcript);
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
    
    // Exponential backoff for reconnection attempts
    const delay = Math.min(1000 * (2 ** (this.reconnectAttempts - 1)), 10000);
    
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
      if (this.isListening) {
        try {
          this.recognition.stop();
          setTimeout(() => {
            this.recognition?.start();
            this.isListening = true;
          }, 100);
        } catch (e) {
          console.warn("Error stopping already running recognition", e);
        }
      } else {
        this.recognition.start();
        this.isListening = true;
      }
      
      this.autoRestart = true;
      this.reconnectAttempts = 0;
    } catch (error) {
      console.error("Failed to start recognition:", error);
      
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
      utterance.rate = 0.95;  // Slightly slower for better clarity
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
      // Process next utterance in queue
      setTimeout(() => this.processUtteranceQueue(), 150);
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
