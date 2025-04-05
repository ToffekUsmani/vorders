
import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
}

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
  onRemove: (productId: number) => void;
  quantity: number;
  focused: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAdd,
  onRemove,
  quantity = 0,
  focused = false,
}) => {
  return (
    <div 
      className={cn(
        "product-card flex flex-col h-full",
        focused && "ring-2 ring-primary ring-offset-2"
      )}
      tabIndex={focused ? 0 : -1}
      aria-selected={focused}
    >
      <div className="relative pb-[75%] overflow-hidden">
        <img 
          src={product.image} 
          alt={product.name} 
          className="absolute top-0 left-0 w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-primary px-2 py-1 rounded-md">
          <span className="font-bold">${product.price.toFixed(2)}</span>
        </div>
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-bold text-lg mb-1">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-4 flex-grow">{product.description.substring(0, 60)}...</p>
        
        <div className="flex items-center justify-between mt-auto">
          {quantity > 0 ? (
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => onRemove(product.id)}
                className="h-8 w-8 rounded-md"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="font-medium text-lg">{quantity}</span>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => onAdd(product)}
                className="h-8 w-8 rounded-md"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button 
              onClick={() => onAdd(product)}
              className="w-full"
            >
              Add to Cart
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
