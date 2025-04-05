
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { ArrowLeft, HelpCircle, Volume2 } from 'lucide-react';
import VoiceAssistant from '@/components/VoiceAssistant';
import { useElevenLabsVoice } from '@/services/ElevenLabsVoiceService';

const HelpPage = () => {
  const navigate = useNavigate();
  const { speak, isListening, isSpeaking, startListening, stopListening, toggleMute, isMuted } = useElevenLabsVoice();

  const helpSections = [
    {
      title: "Getting Started",
      content: "Welcome to Voice Grocer Aid, a shopping application designed for visually impaired users. On this page, you'll learn how to use voice commands to navigate and shop."
    },
    {
      title: "Navigation Commands",
      content: "You can say 'go to home', 'go to checkout', 'go to help', or 'go back' to navigate between pages. Say 'login' or 'register' to access those pages."
    },
    {
      title: "Shopping Commands",
      content: "To find products, say 'search for [product name]' or 'show me [category]'. To add items, say 'add [product] to cart' or 'add [number] [product] to cart'."
    },
    {
      title: "Cart Commands",
      content: "Say 'view cart' or 'open cart' to check your shopping cart. You can then say 'remove [product]' or 'change quantity of [product] to [number]'."
    },
    {
      title: "Checkout Commands",
      content: "During checkout, you can say 'complete order', 'confirm purchase', or 'review my order' to proceed with payment."
    },
    {
      title: "Help Commands",
      content: "Say 'help' at any time to access help information. You can also say 'describe page' to get an audio description of the current page."
    },
    {
      title: "Contact Information",
      content: "For additional support, call our helpline at 1-800-555-1234 or email us at support@voicegroceraid.com."
    }
  ];

  // Welcome message when the page loads
  useEffect(() => {
    const welcomeMessage = "Welcome to the help page. Here you can learn how to use Voice Grocer Aid with voice commands. Select any section to hear more information, or say 'back to shopping' to return to the main page.";
    speak(welcomeMessage);
    
    if (!isListening) {
      startListening();
    }
    
    return () => {
      if (isListening) {
        stopListening();
      }
    };
  }, []);

  const handleVoiceCommand = (command: string) => {
    const lowercaseCommand = command.toLowerCase();
    
    if (lowercaseCommand.includes('back') || 
        lowercaseCommand.includes('home') || 
        lowercaseCommand.includes('shopping')) {
      speak("Going back to the main page");
      navigate('/');
    } else if (lowercaseCommand.includes('read all') || 
               lowercaseCommand.includes('tell me everything')) {
      readAllSections();
    }

    // Check for specific section requests
    helpSections.forEach((section, index) => {
      if (lowercaseCommand.includes(section.title.toLowerCase())) {
        speak(section.content);
      }
    });
  };

  const readAllSections = () => {
    let fullText = "Here's all help information: ";
    helpSections.forEach(section => {
      fullText += `${section.title}. ${section.content}. `;
    });
    speak(fullText);
  };

  const handleBackClick = () => {
    speak("Going back to the main page");
    navigate('/');
  };

  const speakSection = (content: string) => {
    speak(content);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-white p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-6 w-6" />
            <h1 className="text-xl font-bold">Help & Guidance</h1>
          </div>
          
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handleBackClick}
            className="flex items-center gap-1"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </Button>
        </div>
      </header>
      
      <main className="container mx-auto py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-primary/10 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-2">Voice Assistant Help</h2>
            <p className="mb-4">
              This page contains guidance on how to use Voice Grocer Aid. You can listen to any section by clicking the speaker icon or saying the section name.
            </p>
            <Button 
              onClick={readAllSections}
              className="flex items-center gap-2"
            >
              <Volume2 size={18} />
              Read All Sections
            </Button>
          </div>
          
          <Accordion type="single" collapsible className="mb-24">
            {helpSections.map((section, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-lg font-medium">
                  <div className="flex justify-between items-center w-full pr-4">
                    {section.title}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        speakSection(section.content);
                      }}
                      className="h-8 w-8 rounded-full"
                    >
                      <Volume2 size={16} />
                      <span className="sr-only">Listen</span>
                    </Button>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-base">
                  {section.content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </main>
      
      <VoiceAssistant
        isListening={isListening}
        isSpeaking={isSpeaking}
        toggleListening={isListening ? stopListening : startListening}
        toggleMute={toggleMute}
        isMuted={isMuted}
        lastCommand=""
        cartCount={0}
        onCartClick={() => navigate('/')}
      />
    </div>
  );
};

export default HelpPage;
