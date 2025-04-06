
import React, { useEffect, useState, useRef } from 'react';
import { toast } from "sonner";
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VoiceAssistant from '@/components/VoiceAssistant';
import ProductCard, { Product } from '@/components/ProductCard';
import ShoppingCart from '@/components/ShoppingCart';
import { products, categories, findProductsByName, findProductsByCategory } from '@/data/products';
import VoiceService from '@/services/VoiceService';
import { processCommand } from '@/utils/commandProcessor';
import { Search, ShoppingBag, HelpCircle, UserCircle, LogIn, PhoneCall } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface CartItem {
  product: Product;
  quantity: number;
}

const Index = () => {
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [lastCommand, setLastCommand] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);
  const [activeCategory, setActiveCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [focusedProductId, setFocusedProductId] = useState<number | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorRetryCount, setErrorRetryCount] = useState(0);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [showingEmergency, setShowingEmergency] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const voiceServiceRef = useRef<VoiceService | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Error loading cart from localStorage", e);
      }
    }
    
    const savedContrast = localStorage.getItem('highContrast');
    if (savedContrast === 'true') {
      setIsHighContrast(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    voiceServiceRef.current = new VoiceService({
      onResult: handleVoiceResult,
      onEnd: () => {
        setIsListening(false);
        // Speech recognition ended on its own, VoiceService will try to restart it
      },
      onError: (error) => {
        console.error('Voice error:', error);
        setHasError(true);
        setErrorRetryCount(prev => prev + 1);
        
        if (error.includes('network')) {
          toast.error('Voice assistant network error', { 
            description: 'Trying to reconnect...', 
            duration: 3000 
          });
        } else {
          toast.error('Voice assistant error', { 
            description: error, 
            duration: 3000 
          });
        }
        
        // VoiceService will try to restart automatically
        setTimeout(() => {
          setHasError(false);
        }, 3000);
      }
    });

    setTimeout(() => {
      if (voiceServiceRef.current) {
        voiceServiceRef.current.startListening();
        setIsListening(true);
      }
      
      speak(user 
        ? `Welcome back ${user.name}. You can say 'help' to learn what I can do.` 
        : "Welcome to Voice Grocer Aid. I'll help you shop with voice commands. Say 'help' to learn what I can do."
      );
    }, 1000);

    return () => {
      if (voiceServiceRef.current) {
        voiceServiceRef.current.stopListening();
      }
    };
  }, [user]);

  useEffect(() => {
    if (isHighContrast) {
      document.documentElement.classList.add('high-contrast');
      localStorage.setItem('highContrast', 'true');
    } else {
      document.documentElement.classList.remove('high-contrast');
      localStorage.setItem('highContrast', 'false');
    }
  }, [isHighContrast]);

  useEffect(() => {
    const checkSpeaking = () => {
      if (voiceServiceRef.current) {
        setIsSpeaking(voiceServiceRef.current.isSpeaking());
      }
    };

    const interval = setInterval(checkSpeaking, 100);
    return () => clearInterval(interval);
  }, []);

  const speak = (text: string) => {
    if (voiceServiceRef.current) {
      voiceServiceRef.current.speak(text);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      if (voiceServiceRef.current) {
        voiceServiceRef.current.stopListening();
      }
      setIsListening(false);
    } else {
      if (voiceServiceRef.current) {
        voiceServiceRef.current.startListening();
      }
      setIsListening(true);
      setHasError(false);
    }
  };

  const toggleMute = () => {
    if (voiceServiceRef.current) {
      const newMutedState = voiceServiceRef.current.toggleMute();
      setIsMuted(newMutedState);
      toast(newMutedState ? "Voice assistant muted" : "Voice assistant unmuted");
    }
  };

  const toggleContrast = () => {
    setIsHighContrast(prev => !prev);
    speak(isHighContrast ? "High contrast mode disabled" : "High contrast mode enabled");
    toast(isHighContrast ? "High contrast mode disabled" : "High contrast mode enabled");
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const results = findProductsByName(query);
    setFilteredProducts(results);
    setActiveCategory('all');
  };

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    setSearchQuery('');
    setFilteredProducts(findProductsByCategory(categoryId));
  };

  const handleAddToCart = (product: Product, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      
      if (existingItem) {
        return prevCart.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + quantity } 
            : item
        );
      } else {
        return [...prevCart, { product, quantity }];
      }
    });
    
    toast.success(`Added to cart`, { description: `${quantity} ${product.name}` });
  };

  const handleRemoveFromCart = (productId: number, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === productId);
      
      if (!existingItem) return prevCart;
      
      if (existingItem.quantity <= quantity) {
        return prevCart.filter(item => item.product.id !== productId);
      } else {
        return prevCart.map(item => 
          item.product.id === productId 
            ? { ...item, quantity: item.quantity - quantity } 
            : item
        );
      }
    });
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      speak('Your cart is empty. Please add items before checking out.');
      return;
    }
    
    if (!user) {
      speak('Please log in or create an account to proceed with checkout.');
      toast.error('Please log in to checkout');
      navigate('/login');
      return;
    }
    
    speak('Taking you to checkout.');
    navigate('/checkout', { state: { cartItems: cart } });
  };
  
  const handleEmergencyCall = () => {
    speak("Calling helpline number. Please stay on the line for immediate assistance.");
    toast.success("Emergency helpline call initiated", {
      description: "Our support team will assist you shortly.",
      duration: 5000,
    });
    
    setShowingEmergency(true);
    
    // This would connect to a real helpline in a production app
    // For now, we'll just simulate the call with a toast and close it after a few seconds
    setTimeout(() => {
      setShowingEmergency(false);
    }, 5000);
  };
  
  const describeProduct = (product: Product) => {
    const description = `${product.name}: ${product.description} It costs $${product.price.toFixed(2)}.`;
    speak(description);
    toast.info(`Product Description`, { 
      description: description,
      duration: 5000 
    });
  };

  const handleVoiceResult = (transcript: string) => {
    if (hasError) {
      setHasError(false);
      setErrorRetryCount(0);
    }
    
    setLastCommand(transcript);
    console.log('Voice command received:', transcript);
    
    const lowerTranscript = transcript.toLowerCase();
    
    if (lowerTranscript.includes('login') || lowerTranscript.includes('sign in')) {
      speak('Taking you to the login page.');
      navigate('/login');
      return;
    }
    
    if (lowerTranscript.includes('register') || lowerTranscript.includes('sign up') || lowerTranscript.includes('create account')) {
      speak('Taking you to the registration page.');
      navigate('/register');
      return;
    }
    
    if (lowerTranscript.includes('logout') || lowerTranscript.includes('sign out')) {
      if (user) {
        speak('Signing you out.');
        logout();
        toast.success('You have been signed out');
      } else {
        speak('You are not currently signed in.');
      }
      return;
    }
    
    if (lowerTranscript.includes('checkout') || lowerTranscript.includes('pay') || lowerTranscript.includes('purchase')) {
      handleCheckout();
      return;
    }
    
    if (lowerTranscript.includes('open cart') || lowerTranscript.includes('show cart') || lowerTranscript.includes('view cart')) {
      setIsCartOpen(true);
      speak('Opening your shopping cart.');
      return;
    }
    
    if (lowerTranscript.includes('close cart') || lowerTranscript.includes('hide cart')) {
      setIsCartOpen(false);
      speak('Closing your shopping cart.');
      return;
    }
    
    // Handle emergency call request
    if (lowerTranscript.includes('emergency') || lowerTranscript.includes('help me now')) {
      handleEmergencyCall();
      return;
    }
    
    const result = processCommand(transcript, products);
    console.log('Command result:', result);
    
    speak(result.response);
    
    switch (result.action) {
      case 'search':
        if (result.data?.query) {
          handleSearch(result.data.query);
        } else if (result.data?.category) {
          handleCategoryChange(result.data.category);
        }
        break;
        
      case 'add':
        if (result.data?.product) {
          const quantity = result.data.quantity || 1;
          handleAddToCart(result.data.product, quantity);
        }
        break;
        
      case 'remove':
        if (result.data?.product) {
          const quantity = result.data.quantity || 1;
          handleRemoveFromCart(result.data.product.id, quantity);
        }
        break;
        
      case 'checkout':
        handleCheckout();
        break;
        
      case 'contrast':
        if (result.data?.contrastMode !== undefined) {
          setIsHighContrast(result.data.contrastMode);
        } else {
          setIsHighContrast(prev => !prev);
        }
        break;
        
      case 'describe':
        if (result.data?.description) {
          describeProduct(result.data.description);
          // Focus the product
          setFocusedProductId(result.data.description.id);
          setTimeout(() => setFocusedProductId(null), 3000);
        }
        break;
        
      case 'emergency':
        handleEmergencyCall();
        break;
        
      case 'help':
        break;
    }
  };

  const getCartItemQuantity = (productId: number): number => {
    const item = cart.find(item => item.product.id === productId);
    return item ? item.quantity : 0;
  };

  const getCartTotal = (): number => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  return (
    <div className={cn(
      "min-h-screen",
      isHighContrast ? "bg-black text-yellow-300" : "bg-background"
    )}>
      <header className={cn(
        "p-4",
        isHighContrast ? "bg-black text-yellow-300 border-b border-yellow-300" : "bg-primary text-white"
      )}>
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-6 w-6" />
            <h1 className="text-xl font-bold">Voice Grocer Aid</h1>
          </div>
          
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm hidden sm:inline-block">
                  Welcome, {user.name}
                </span>
                <Button 
                  size="sm" 
                  variant={isHighContrast ? "outline" : "secondary"}
                  onClick={logout}
                  className={cn(isHighContrast && "border-yellow-300 text-yellow-300 hover:bg-yellow-300/20")}
                >
                  <UserCircle className="h-4 w-4 mr-1" /> 
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant={isHighContrast ? "outline" : "secondary"}
                  onClick={() => navigate('/login')}
                  className={cn(isHighContrast && "border-yellow-300 text-yellow-300 hover:bg-yellow-300/20")}
                >
                  <LogIn className="h-4 w-4 mr-1" /> 
                  Login
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => navigate('/register')}
                  className={cn(
                    isHighContrast ? "bg-black text-yellow-300 border-yellow-300 hover:bg-yellow-300/20" : "bg-white/10 text-white"
                  )}
                >
                  Register
                </Button>
              </div>
            )}
            
            <Button 
              size="sm" 
              variant={isHighContrast ? "outline" : "secondary"}
              onClick={() => speak("Welcome to Voice Grocer Aid. You can say 'help' to learn what I can do.")}
              className={cn(isHighContrast && "border-yellow-300 text-yellow-300 hover:bg-yellow-300/20")}
            >
              <HelpCircle className="h-4 w-4 mr-1" /> 
              Help
            </Button>
            
            <Button 
              size="sm" 
              variant="destructive"
              onClick={handleEmergencyCall}
              className={cn(
                "flex items-center gap-1",
                isHighContrast && "bg-yellow-300 text-black hover:bg-yellow-400"
              )}
            >
              <PhoneCall className="h-4 w-4 mr-1" /> 
              Emergency
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto py-6 px-4">
        <div className={cn(
          "rounded-lg shadow-md p-4 mb-6",
          isHighContrast ? "bg-black border border-yellow-300" : "bg-white"
        )}>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full">
              <Search className={cn(
                "absolute left-3 top-1/2 transform -translate-y-1/2",
                isHighContrast ? "text-yellow-300" : "text-muted-foreground"
              )} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className={cn(
                  "w-full pl-10 py-2 border rounded-md focus:outline-none focus:ring-2",
                  isHighContrast 
                    ? "bg-black text-yellow-300 border-yellow-300 focus:ring-yellow-300 placeholder-yellow-300/50" 
                    : "focus:ring-primary"
                )}
              />
            </div>
            
            <div className="w-full sm:w-auto">
              <Tabs value={activeCategory} onValueChange={handleCategoryChange}>
                <TabsList className={cn(
                  "grid grid-cols-2 sm:grid-cols-4 h-auto sm:h-10 overflow-x-auto p-1",
                  isHighContrast && "bg-black border border-yellow-300"
                )}>
                  {categories.map((category) => (
                    <TabsTrigger 
                      key={category.id} 
                      value={category.id}
                      className={cn(
                        "text-xs sm:text-sm",
                        isHighContrast && "data-[state=active]:bg-yellow-300 data-[state=active]:text-black"
                      )}
                    >
                      {category.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-24">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <div 
                key={product.id}
                className={cn(
                  isHighContrast && "border-2 border-yellow-300 rounded-lg overflow-hidden",
                  focusedProductId === product.id && "ring-4 ring-offset-2",
                  focusedProductId === product.id && (isHighContrast ? "ring-yellow-300" : "ring-primary")
                )}
              >
                <ProductCard
                  product={product}
                  onAdd={handleAddToCart}
                  onRemove={handleRemoveFromCart}
                  quantity={getCartItemQuantity(product.id)}
                  focused={focusedProductId === product.id}
                />
                <Button
                  onClick={() => describeProduct(product)}
                  variant={isHighContrast ? "outline" : "secondary"}
                  size="sm"
                  className={cn(
                    "w-full rounded-t-none",
                    isHighContrast && "bg-black text-yellow-300 border-yellow-300 hover:bg-yellow-300/20"
                  )}
                >
                  Describe
                </Button>
              </div>
            ))
          ) : (
            <div className={cn(
              "col-span-full flex flex-col items-center justify-center py-12",
              isHighContrast ? "text-yellow-300" : ""
            )}>
              <p className="text-lg font-medium">No products found</p>
              <p className={cn(
                isHighContrast ? "text-yellow-300/70" : "text-muted-foreground"
              )}>
                Try a different search term or category
              </p>
            </div>
          )}
        </div>
      </main>
      
      {showingEmergency && (
        <div className={cn(
          "fixed inset-0 bg-black/80 z-[100] flex flex-col items-center justify-center p-4",
          isHighContrast && "bg-black/95"
        )}>
          <div className={cn(
            "bg-white p-6 rounded-lg max-w-md w-full text-center",
            isHighContrast && "bg-black border-2 border-yellow-300"
          )}>
            <PhoneCall className={cn(
              "mx-auto mb-4 h-16 w-16 animate-pulse",
              isHighContrast ? "text-yellow-300" : "text-red-500"
            )} />
            <h2 className={cn(
              "text-2xl font-bold mb-2",
              isHighContrast && "text-yellow-300"
            )}>
              Emergency Call
            </h2>
            <p className={cn(
              "mb-4",
              isHighContrast && "text-yellow-300"
            )}>
              Connecting to customer support...
            </p>
            <div className="animate-pulse flex justify-center gap-2">
              {[1, 2, 3].map(dot => (
                <div 
                  key={dot}
                  className={cn(
                    "h-3 w-3 rounded-full",
                    isHighContrast ? "bg-yellow-300" : "bg-red-500"
                  )}
                ></div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <VoiceAssistant
        isListening={isListening}
        isSpeaking={isSpeaking}
        toggleListening={toggleListening}
        toggleMute={toggleMute}
        isMuted={isMuted}
        lastCommand={lastCommand}
        cartCount={cart.reduce((total, item) => total + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
        hasError={hasError}
        isHighContrast={isHighContrast}
        toggleContrast={toggleContrast}
      />
      
      <ShoppingCart
        items={cart}
        onClose={() => setIsCartOpen(false)}
        onAdd={handleAddToCart}
        onRemove={handleRemoveFromCart}
        onCheckout={handleCheckout}
        isOpen={isCartOpen}
        className={isHighContrast ? "bg-black text-yellow-300 border-l border-yellow-300" : ""}
      />
    </div>
  );
};

export default Index;
