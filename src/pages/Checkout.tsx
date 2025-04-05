
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Mic, Loader2, CreditCard, Check } from 'lucide-react';
import { toast } from 'sonner';
import VoiceService from '@/services/VoiceService';

const Checkout = () => {
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [address, setAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentField, setCurrentField] = useState<'cardNumber' | 'cardName' | 'expiryDate' | 'cvv' | 'address' | null>(null);
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const voiceServiceRef = useRef<VoiceService | null>(null);
  
  useEffect(() => {
    // Initialize voice service
    voiceServiceRef.current = new VoiceService({
      onResult: handleVoiceResult,
      onEnd: () => setIsListening(false),
      onError: (error) => {
        console.error('Voice error:', error);
        toast.error('Voice assistant error', { description: error });
        setIsListening(false);
      }
    });

    // Welcome message
    setTimeout(() => {
      speak("Welcome to checkout. You can say the name of any field to fill it out, or 'pay now' to complete your purchase.");
    }, 1000);

    return () => {
      if (isListening && voiceServiceRef.current) {
        voiceServiceRef.current.stopListening();
      }
    };
  }, []);

  const speak = (text: string) => {
    if (voiceServiceRef.current) {
      voiceServiceRef.current.speak(text);
    }
  };

  const startListening = (field: 'cardNumber' | 'cardName' | 'expiryDate' | 'cvv' | 'address' | null) => {
    if (voiceServiceRef.current) {
      setCurrentField(field);
      setIsListening(true);
      voiceServiceRef.current.startListening();
      
      if (field === 'cardNumber') {
        speak("Please say your card number");
      } else if (field === 'cardName') {
        speak("Please say the name on your card");
      } else if (field === 'expiryDate') {
        speak("Please say your card's expiration date in month slash year format");
      } else if (field === 'cvv') {
        speak("Please say your card's security code");
      } else if (field === 'address') {
        speak("Please say your delivery address");
      } else {
        speak("I'm listening. What would you like to do?");
      }
    }
  };

  const handleVoiceResult = (transcript: string) => {
    const lowerTranscript = transcript.toLowerCase();
    
    // Commands
    if (lowerTranscript.includes('card number')) {
      setCurrentField('cardNumber');
      speak("Please say your card number");
      return;
    }
    
    if (lowerTranscript.includes('name on card') || lowerTranscript.includes('card name')) {
      setCurrentField('cardName');
      speak("Please say the name on your card");
      return;
    }
    
    if (lowerTranscript.includes('expiry') || lowerTranscript.includes('expiration')) {
      setCurrentField('expiryDate');
      speak("Please say your card's expiration date");
      return;
    }
    
    if (lowerTranscript.includes('cvv') || lowerTranscript.includes('security code') || lowerTranscript.includes('cvc')) {
      setCurrentField('cvv');
      speak("Please say your card's security code");
      return;
    }
    
    if (lowerTranscript.includes('address') || lowerTranscript.includes('delivery')) {
      setCurrentField('address');
      speak("Please say your delivery address");
      return;
    }
    
    if (lowerTranscript.includes('pay') || lowerTranscript.includes('checkout') || lowerTranscript.includes('purchase')) {
      handleSubmit();
      return;
    }
    
    if (lowerTranscript.includes('cancel') || lowerTranscript.includes('go back')) {
      speak("Canceling payment and returning to shopping");
      navigate('/');
      return;
    }
    
    if (lowerTranscript.includes('help')) {
      speak("You can say card number, name on card, expiry date, CVV, address to fill out those fields, or say pay now to complete your purchase.");
      return;
    }
    
    // Field input
    if (currentField === 'cardNumber') {
      // Format as card number (remove spaces and non-digits)
      const cleanedValue = transcript.replace(/\D/g, '');
      setCardNumber(cleanedValue);
      speak("Card number has been set");
    } else if (currentField === 'cardName') {
      setCardName(transcript);
      speak(`Card name set to ${transcript}`);
    } else if (currentField === 'expiryDate') {
      // Try to extract month/year format
      let formattedDate = transcript;
      
      // Replace common words
      formattedDate = formattedDate.replace(/\s+/g, '');
      formattedDate = formattedDate.replace(/slash/g, '/');
      
      // If user said "March 2025" or similar, convert to MM/YY
      const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
      months.forEach((month, index) => {
        if (transcript.toLowerCase().includes(month)) {
          const monthNumber = (index + 1).toString().padStart(2, '0');
          const yearMatch = transcript.match(/20\d\d/);
          const year = yearMatch ? yearMatch[0].slice(-2) : '';
          if (year) {
            formattedDate = `${monthNumber}/${year}`;
          }
        }
      });
      
      setExpiryDate(formattedDate);
      speak(`Expiry date set to ${formattedDate}`);
    } else if (currentField === 'cvv') {
      // Remove non-digits
      const cleanedValue = transcript.replace(/\D/g, '');
      setCvv(cleanedValue);
      speak("CVV has been set");
    } else if (currentField === 'address') {
      setAddress(transcript);
      speak(`Address set to ${transcript}`);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!cardNumber || !cardName || !expiryDate || !cvv || !address) {
      speak("Please fill out all payment details");
      toast.error("Please fill out all required fields");
      return;
    }
    
    try {
      setIsProcessing(true);
      
      // Simulate payment processing
      speak("Processing your payment. Please wait.");
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsSuccess(true);
      speak("Payment successful! Your order will be delivered soon. Thank you for shopping with Voice Grocer Aid.");
      
      // Redirect after success message
      setTimeout(() => {
        navigate('/');
      }, 5000);
      
    } catch (error) {
      speak("Payment failed. Please check your details and try again.");
      toast.error("Payment processing failed. Please try again.");
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          
          <h1 className="text-2xl font-bold">Payment Successful!</h1>
          <p className="text-muted-foreground">Your order has been placed and will be delivered soon.</p>
          
          <Button onClick={() => navigate('/')} className="mt-4">
            Return to Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Checkout</h1>
        
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Payment Form */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => startListening('cardNumber')}
                    className="h-8 w-8 p-0"
                  >
                    <Mic className="h-4 w-4" />
                    <span className="sr-only">Use voice for card number</span>
                  </Button>
                </div>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full"
                  maxLength={16}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="cardName">Name on Card</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => startListening('cardName')}
                    className="h-8 w-8 p-0"
                  >
                    <Mic className="h-4 w-4" />
                    <span className="sr-only">Use voice for card name</span>
                  </Button>
                </div>
                <Input
                  id="cardName"
                  placeholder="John Smith"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => startListening('expiryDate')}
                      className="h-8 w-8 p-0"
                    >
                      <Mic className="h-4 w-4" />
                      <span className="sr-only">Use voice for expiry date</span>
                    </Button>
                  </div>
                  <Input
                    id="expiryDate"
                    placeholder="MM/YY"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="cvv">CVV</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => startListening('cvv')}
                      className="h-8 w-8 p-0"
                    >
                      <Mic className="h-4 w-4" />
                      <span className="sr-only">Use voice for CVV</span>
                    </Button>
                  </div>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    maxLength={4}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="address">Delivery Address</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => startListening('address')}
                    className="h-8 w-8 p-0"
                  >
                    <Mic className="h-4 w-4" />
                    <span className="sr-only">Use voice for address</span>
                  </Button>
                </div>
                <Input
                  id="address"
                  placeholder="123 Main St, City, Country"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay Now
                  </>
                )}
              </Button>
            </form>
            
            <div className="mt-6">
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => startListening(null)}
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
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            {/* This would typically be populated with items from the cart */}
            <div className="space-y-4">
              <div className="flex justify-between pb-4 border-b">
                <span className="text-muted-foreground">Subtotal</span>
                <span>$45.95</span>
              </div>
              <div className="flex justify-between pb-4 border-b">
                <span className="text-muted-foreground">Shipping</span>
                <span>$4.99</span>
              </div>
              <div className="flex justify-between pb-4 border-b">
                <span className="text-muted-foreground">Tax</span>
                <span>$5.12</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>$56.06</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <Button variant="outline" onClick={() => navigate('/')}>Back to Shopping</Button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
