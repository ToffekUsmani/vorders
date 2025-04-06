
import React, { useEffect } from 'react';
import { X, Plus, Minus, ShoppingBag, Home, ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product } from './ProductCard';
import { useElevenLabsVoice } from '@/services/ElevenLabsVoiceService';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface CartItem {
  product: Product;
  quantity: number;
}

interface ShoppingCartProps {
  items: CartItem[];
  onClose: () => void;
  onAdd: (product: Product) => void;
  onRemove: (productId: number) => void;
  onCheckout: () => void;
  isOpen: boolean;
  className?: string;
}

const ShoppingCart: React.FC<ShoppingCartProps> = ({ 
  items, 
  onClose, 
  onAdd, 
  onRemove, 
  onCheckout, 
  isOpen,
  className 
}) => {
  const { speak } = useElevenLabsVoice();
  const navigate = useNavigate();
  const isHighContrast = className?.includes('text-yellow-300');
  
  useEffect(() => {
    if (isOpen && items.length > 0) {
      // Create voice summary when cart opens
      const totalPrice = calculateTotalPrice();
      const subtotal = totalPrice;
      const shipping = totalPrice > 35 ? 0 : 5;
      const tax = totalPrice * 0.08;
      const finalTotal = subtotal + shipping + tax;
      
      const summary = `Your cart has ${items.length} types of items with a total of ${items.reduce((sum, item) => sum + item.quantity, 0)} products. 
                       The subtotal is $${subtotal.toFixed(2)}, shipping is ${shipping === 0 ? 'free' : '$' + shipping.toFixed(2)},
                       and tax is $${tax.toFixed(2)}. Your total cost is $${finalTotal.toFixed(2)}. 
                       ${items.map(item => `${item.quantity} ${item.product.name} at $${item.product.price.toFixed(2)} each.`).join(' ')}
                       Say "checkout" to proceed or "continue shopping" to go back.`;
      speak(summary);
    } else if (isOpen && items.length === 0) {
      speak("Your cart is empty. Say 'continue shopping' to browse products.");
    }
  }, [isOpen, items]);

  const calculateTotalPrice = () => {
    return items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
  };

  const handleRemoveCompleteItem = (product: Product) => {
    // Remove all quantities of this product
    for (let i = 0; i < getQuantity(product.id); i++) {
      onRemove(product.id);
    }
    speak(`Removed all ${product.name} from your cart`);
  };

  const getQuantity = (productId: number): number => {
    const item = items.find(item => item.product.id === productId);
    return item ? item.quantity : 0;
  };

  const handleBackToHome = () => {
    speak("Going back to the main page");
    navigate('/');
    onClose();
  };

  const handleVoiceAction = (action: string, product: Product) => {
    switch(action) {
      case 'add':
        onAdd(product);
        speak(`Added one more ${product.name}. You now have ${getQuantity(product.id) + 1}.`);
        break;
      case 'remove':
        if (getQuantity(product.id) > 0) {
          onRemove(product.id);
          const newQuantity = getQuantity(product.id) - 1;
          speak(`Removed one ${product.name}. You now have ${newQuantity}.`);
        }
        break;
      case 'delete':
        handleRemoveCompleteItem(product);
        break;
    }
  };
  
  if (!isOpen) return null;
  
  const totalPrice = calculateTotalPrice();
  const shipping = totalPrice > 35 ? 0 : 5;
  const tax = totalPrice * 0.08;
  const finalTotal = totalPrice + shipping + tax;
  const estimatedDeliveryDate = new Date();
  estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 2);
  const formattedDeliveryDate = estimatedDeliveryDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
      <div className={cn(`w-full max-w-md h-full overflow-y-auto`, className)}>
        <div className={cn(
          "p-4 border-b flex items-center justify-between",
          isHighContrast ? "bg-black text-yellow-300 border-yellow-300" : "bg-primary text-white"
        )}>
          <h2 className="text-xl font-semibold flex items-center">
            <ShoppingBag className="mr-2" /> Shopping Cart
          </h2>
          <button
            onClick={onClose}
            className={cn(
              "p-1 rounded-full",
              isHighContrast ? "hover:bg-yellow-300/20" : "hover:bg-white/20"
            )}
            aria-label="Close cart"
          >
            <X />
          </button>
        </div>
        
        <div className={cn(
          "p-4 border-b flex items-center justify-between",
          isHighContrast ? "bg-black border-yellow-300" : "bg-gray-100"
        )}>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackToHome}
            className={cn(
              "flex items-center gap-1",
              isHighContrast && "border-yellow-300 text-yellow-300 hover:bg-yellow-300/20"
            )}
          >
            <Home size={16} />
            <span className="hidden sm:inline">Home</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className={cn(
              "flex items-center gap-1",
              isHighContrast && "border-yellow-300 text-yellow-300 hover:bg-yellow-300/20"
            )}
          >
            <ArrowLeft size={16} />
            <span>Continue Shopping</span>
          </Button>
        </div>
        
        {items.length === 0 ? (
          <div className="p-4 text-center">
            <p className={cn(
              isHighContrast ? "text-yellow-300" : "text-gray-500",
              "mb-4"
            )}>Your cart is empty</p>
            <Button 
              variant="outline" 
              onClick={onClose}
              className={cn(
                isHighContrast && "border-yellow-300 text-yellow-300 hover:bg-yellow-300/20"
              )}
            >
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            <div className="p-4 space-y-4">
              {items.map((item) => (
                <div 
                  key={item.product.id} 
                  className={cn(
                    "p-4 shadow-sm",
                    isHighContrast 
                      ? "border border-yellow-300 rounded-lg" 
                      : "border rounded-lg"
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className={cn(
                          "w-16 h-16 object-cover mr-4",
                          isHighContrast ? "border border-yellow-300" : "rounded"
                        )}
                      />
                      <div>
                        <h3 className="font-medium">{item.product.name}</h3>
                        <p className={cn(
                          isHighContrast ? "text-yellow-300/80" : "text-gray-600",
                          "text-sm"
                        )}>${item.product.price.toFixed(2)} each</p>
                        <p className={cn(
                          isHighContrast ? "text-yellow-300" : "text-primary",
                          "font-medium"
                        )}>Total: ${(item.product.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "p-1 h-auto",
                        isHighContrast ? "text-yellow-300 hover:text-yellow-500 hover:bg-transparent" : "text-red-500 hover:text-red-700"
                      )}
                      onClick={() => handleRemoveCompleteItem(item.product)}
                      aria-label={`Remove all ${item.product.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className={cn(
                    "flex items-center justify-between pt-3",
                    isHighContrast ? "border-t border-yellow-300/50" : "border-t"
                  )}>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => handleVoiceAction('remove', item.product)}
                        className={cn(
                          "p-1 rounded-full h-8 w-8",
                          isHighContrast 
                            ? "bg-black border border-yellow-300 text-yellow-300 hover:bg-yellow-300/20" 
                            : "bg-gray-100 hover:bg-gray-200"
                        )}
                        aria-label={`Remove one ${item.product.name}`}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      
                      <span className="w-8 text-center">{item.quantity}</span>
                      
                      <Button
                        onClick={() => handleVoiceAction('add', item.product)}
                        className={cn(
                          "p-1 rounded-full h-8 w-8",
                          isHighContrast 
                            ? "bg-black border border-yellow-300 text-yellow-300 hover:bg-yellow-300/20" 
                            : "bg-gray-100 hover:bg-gray-200"
                        )}
                        aria-label={`Add one more ${item.product.name}`}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <Button
                      variant={isHighContrast ? "outline" : "secondary"}
                      size="sm"
                      onClick={() => speak(`${item.quantity} ${item.product.name} at $${item.product.price.toFixed(2)} each. Total for this item: $${(item.product.price * item.quantity).toFixed(2)} dollars.`)}
                      className={cn(
                        isHighContrast && "border-yellow-300 text-yellow-300 hover:bg-yellow-300/20"
                      )}
                    >
                      Read Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className={cn(
              "border-t p-4",
              isHighContrast ? "bg-black border-yellow-300" : "bg-gray-50"
            )}>
              <div className="space-y-3 mb-5">
                <div className="flex justify-between">
                  <span className={isHighContrast ? "text-yellow-300/80" : "text-gray-600"}>Subtotal:</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className={isHighContrast ? "text-yellow-300/80" : "text-gray-600"}>Shipping:</span>
                  <span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className={isHighContrast ? "text-yellow-300/80" : "text-gray-600"}>Estimated Tax:</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                
                <div className={cn(
                  "flex justify-between font-bold pt-2 border-t",
                  isHighContrast && "border-yellow-300/50"
                )}>
                  <span>Total:</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>
                
                <div className={cn(
                  "text-sm",
                  isHighContrast ? "text-yellow-300/70" : "text-gray-500"
                )}>
                  Estimated delivery: {formattedDeliveryDate}
                </div>
              </div>
              
              <Button 
                onClick={onCheckout} 
                className={cn(
                  "w-full",
                  isHighContrast && "bg-yellow-300 text-black hover:bg-yellow-400"
                )}
              >
                Proceed to Checkout
              </Button>
              
              <Button
                variant="outline"
                className={cn(
                  "w-full mt-2",
                  isHighContrast && "border-yellow-300 text-yellow-300 hover:bg-yellow-300/20"
                )}
                onClick={() => speak(`Your order summary:
                  Subtotal: $${totalPrice.toFixed(2)}.
                  Shipping: ${shipping === 0 ? 'free' : '$' + shipping.toFixed(2)}.
                  Tax: $${tax.toFixed(2)}.
                  Final total: $${finalTotal.toFixed(2)}.
                  Estimated delivery on ${formattedDeliveryDate}.
                  Say "checkout" to proceed with your order.`)}
              >
                Order Summary
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ShoppingCart;
