
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Mic, Loader2, CreditCard, Check } from 'lucide-react';
import { toast } from 'sonner';
import VoiceService from '@/services/VoiceService';

interface CartItem {
  product: {
    id: number;
    name: string;
    price: number;
    image: string;
    category: string;
    description: string;
  };
  quantity: number;
}

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
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const voiceServiceRef = useRef<VoiceService | null>(null);
  
  // Get cart from local storage or location state
  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      setCartItems(JSON.parse(storedCart));
    } else if (location.state && location.state.cartItems) {
      setCartItems(location.state.cartItems);
    }
  }, [location]);
  
  // Calculate totals based on cart
  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const shipping = subtotal > 35 ? 0 : 5;
  const tax = Math.round(subtotal * 0.08);
  const total = subtotal + shipping + tax;
  
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

    // Start listening automatically
    startListening(null);

    // Welcome message
    setTimeout(() => {
      speak("Welcome to checkout. You can say the card name, card number, expiry date, CVV or address to fill out those fields, or say 'pay now' to complete your purchase.");
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
    
    // Direct card name detection
    if (lowerTranscript.match(/card name|name on card|name is/i)) {
      const nameMatch = transcript.match(/(?:card name|name on card|name is)\s+(.*?)(?:\.|$)/i);
      if (nameMatch && nameMatch[1]) {
        setCardName(nameMatch[1].trim());
        speak(`Card name set to ${nameMatch[1].trim()}`);
        return;
      }
      setCurrentField('cardName');
      speak("Please say the name on your card");
      return;
    }
    
    // Direct card number detection
    if (lowerTranscript.match(/card number|number is/i)) {
      const numberMatch = transcript.match(/(?:card number|number is)\s+([0-9\s]+)/i);
      if (numberMatch && numberMatch[1]) {
        const cleanNumber = numberMatch[1].replace(/\D/g, '');
        setCardNumber(cleanNumber);
        speak("Card number has been set");
        return;
      }
      setCurrentField('cardNumber');
      speak("Please say your card number");
      return;
    }
    
    // Direct expiry detection
    if (lowerTranscript.match(/expiry|expiration|expires/i)) {
      const expiryMatch = transcript.match(/(?:expiry|expiration|expires).*?(\d{1,2}[\s/]+\d{2,4}|\w+ \d{4}|\w+ \d{2})/i);
      if (expiryMatch && expiryMatch[1]) {
        let formattedDate = processExpiryDate(expiryMatch[1]);
        setExpiryDate(formattedDate);
        speak(`Expiry date set to ${formattedDate}`);
        return;
      }
      setCurrentField('expiryDate');
      speak("Please say your card's expiration date");
      return;
    }
    
    // Direct CVV detection
    if (lowerTranscript.match(/cvv|security code|cvc/i)) {
      const cvvMatch = transcript.match(/(?:cvv|security code|cvc).*?(\d{3,4})/i);
      if (cvvMatch && cvvMatch[1]) {
        setCvv(cvvMatch[1]);
        speak("CVV has been set");
        return;
      }
      setCurrentField('cvv');
      speak("Please say your card's security code");
      return;
    }
    
    // Direct address detection
    if (lowerTranscript.match(/address|delivery|shipping/i) && !lowerTranscript.includes("is set")) {
      const addressMatch = transcript.match(/(?:address|delivery|shipping).*(is|at)\s+(.*?)(?:\.|$)/i);
      if (addressMatch && addressMatch[2]) {
        setAddress(addressMatch[2].trim());
        speak(`Address set to ${addressMatch[2].trim()}`);
        return;
      }
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
    
    // Field input based on current field
    if (currentField === 'cardNumber') {
      // Format as card number (remove spaces and non-digits)
      const cleanedValue = transcript.replace(/\D/g, '');
      setCardNumber(cleanedValue);
      speak("Card number has been set");
    } else if (currentField === 'cardName') {
      setCardName(transcript);
      speak(`Card name set to ${transcript}`);
    } else if (currentField === 'expiryDate') {
      // Process expiry date
      const formattedDate = processExpiryDate(transcript);
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
    } else {
      // Try to detect what the user is saying without a specific field set
      if (transcript.match(/\d{12,16}/)) {
        // Looks like a card number
        const cleanedValue = transcript.match(/\d{12,16}/)[0];
        setCardNumber(cleanedValue);
        speak("Card number has been set");
      } else if (transcript.match(/\d{1,2}[\s/]+\d{2,4}/)) {
        // Looks like an expiry date
        const formattedDate = processExpiryDate(transcript);
        setExpiryDate(formattedDate);
        speak(`Expiry date set to ${formattedDate}`);
      } else if (transcript.match(/\b\d{3,4}\b/)) {
        // Looks like a CVV
        const cleanedValue = transcript.match(/\b\d{3,4}\b/)[0];
        setCvv(cleanedValue);
        speak("CVV has been set");
      } else if (transcript.length > 10 && (transcript.includes("street") || transcript.includes("avenue") || transcript.includes("road"))) {
        // Likely an address
        setAddress(transcript);
        speak(`Address set to ${transcript}`);
      } else if (transcript.includes(" ") && !transcript.match(/\d/)) {
        // Likely a name if it has spaces and no digits
        setCardName(transcript);
        speak(`Card name set to ${transcript}`);
      }
    }
  };

  // Helper function to process different formats of expiry dates
  const processExpiryDate = (input: string): string => {
    let formattedDate = input;
    
    // Replace common words
    formattedDate = formattedDate.replace(/\s+/g, ' ');
    formattedDate = formattedDate.replace(/slash/g, '/');
    
    // If user said "March 2025" or similar, convert to MM/YY
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    months.forEach((month, index) => {
      if (input.toLowerCase().includes(month)) {
        const monthNumber = (index + 1).toString().padStart(2, '0');
        const yearMatch = input.match(/20\d\d/);
        const year = yearMatch ? yearMatch[0].slice(-2) : '';
        if (year) {
          formattedDate = `${monthNumber}/${year}`;
        }
      }
    });
    
    // Handle numeric formats like "01 25" or "01/25"
    const numericMatch = input.match(/(\d{1,2})\s*[/\s]\s*(\d{2,4})/);
    if (numericMatch) {
      const month = parseInt(numericMatch[1]).toString().padStart(2, '0');
      let year = numericMatch[2];
      if (year.length === 4) year = year.slice(-2);
      formattedDate = `${month}/${year}`;
    }
    
    return formattedDate;
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
      
      // Clear cart from localStorage
      localStorage.removeItem('cart');
      
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
            {cartItems.length > 0 ? (
              <div className="space-y-4">
                {/* List cart items */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div key={item.product.id} className="flex justify-between text-sm border-b pb-2">
                      <span>{item.quantity} × {item.product.name}</span>
                      <span>${(item.product.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                {/* Order totals */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{shipping === 0 ? 'Free' : `$${shipping}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>${tax}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-2 border-t">
                    <span>Total</span>
                    <span>${Math.round(total)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">Your cart is empty</p>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/')}
                  className="mt-4"
                >
                  Return to Shopping
                </Button>
              </div>
            )}
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
