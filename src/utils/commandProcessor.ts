
import { findProductsByName, findProductsByCategory } from '../data/products';
import { Product } from '../components/ProductCard';

export interface CommandResult {
  command: string;
  action: 'search' | 'add' | 'remove' | 'checkout' | 'help' | 'unknown' | 'contrast';
  data?: {
    query?: string;
    product?: Product;
    quantity?: number;
    category?: string;
    contrastMode?: boolean;
  };
  response: string;
}

export const processCommand = (
  command: string,
  products: Product[]
): CommandResult => {
  const normalizedCommand = command.toLowerCase().trim();

  // Contrast mode toggle
  if (normalizedCommand.includes('high contrast') || 
      normalizedCommand.includes('contrast mode') || 
      normalizedCommand.includes('toggle contrast')) {
    
    const enableContrast = !normalizedCommand.includes('off') && 
                           !normalizedCommand.includes('disable') && 
                           !normalizedCommand.includes('remove');
    
    return {
      command: normalizedCommand,
      action: 'contrast',
      data: { contrastMode: enableContrast },
      response: enableContrast ? "High contrast mode enabled." : "High contrast mode disabled."
    };
  }

  // Search commands
  if (normalizedCommand.includes('search for') || normalizedCommand.includes('find') || normalizedCommand.includes('look for')) {
    const searchTerms = extractSearchQuery(normalizedCommand);
    if (searchTerms) {
      const results = findProductsByName(searchTerms);
      return {
        command: normalizedCommand,
        action: 'search',
        data: { query: searchTerms },
        response: results.length > 0 
          ? `I found ${results.length} products matching "${searchTerms}".` 
          : `Sorry, I couldn't find any products matching "${searchTerms}".`
      };
    }
  }

  // Category browsing
  const categoryMatch = normalizedCommand.match(/show me (.*?)( products)?$/) || 
                       normalizedCommand.match(/show (.*?)( products)?$/);
  if (categoryMatch) {
    const category = categoryMatch[1].trim();
    if (category === 'all' || category === 'all products' || category === 'everything') {
      return {
        command: normalizedCommand,
        action: 'search',
        data: { category: 'all' },
        response: `Showing all products.`
      };
    } else {
      return {
        command: normalizedCommand,
        action: 'search',
        data: { category },
        response: `Showing ${category} products.`
      };
    }
  }

  // Extract quantity and product name more effectively
  const quantityMatch = normalizedCommand.match(/(\d+)\s+([a-z\s]+)(?:s|\b)/i);
  let quantity = 1;
  let productNameHint = '';
  
  if (quantityMatch) {
    quantity = parseInt(quantityMatch[1], 10);
    productNameHint = quantityMatch[2].trim();
  }

  // Add to cart commands
  if (normalizedCommand.includes('add') && 
     (normalizedCommand.includes('cart') || normalizedCommand.includes('basket') || 
      !normalizedCommand.includes('cart') && !normalizedCommand.includes('basket'))) {
    
    // Try to extract product name and quantity
    const productInfo = extractProductInfo(normalizedCommand, products, productNameHint, quantity);
    
    if (productInfo.product) {
      return {
        command: normalizedCommand,
        action: 'add',
        data: { 
          product: productInfo.product,
          quantity: productInfo.quantity || 1
        },
        response: `Added ${productInfo.quantity || 1} ${productInfo.product.name} to your cart.`
      };
    } else {
      // If no specific product was found, check if they're referring to search results
      const generalAdd = normalizedCommand.match(/add (this|these|it|them)/i);
      if (generalAdd) {
        return {
          command: normalizedCommand,
          action: 'add',
          response: `Please select a specific product to add to your cart.`
        };
      }
    }
  }

  // Remove from cart commands
  if ((normalizedCommand.includes('remove') || normalizedCommand.includes('delete')) && 
     (normalizedCommand.includes('cart') || normalizedCommand.includes('basket') || 
      !normalizedCommand.includes('cart') && !normalizedCommand.includes('basket'))) {
    
    const productInfo = extractProductInfo(normalizedCommand, products, productNameHint, quantity);
    
    if (productInfo.product) {
      return {
        command: normalizedCommand,
        action: 'remove',
        data: { 
          product: productInfo.product,
          quantity: productInfo.quantity || 1
        },
        response: `Removed ${productInfo.product.name} from your cart.`
      };
    }
  }

  // Checkout commands
  if (normalizedCommand.includes('checkout') || 
      normalizedCommand.includes('pay') || 
      normalizedCommand.includes('purchase') ||
      normalizedCommand.includes('buy')) {
    return {
      command: normalizedCommand,
      action: 'checkout',
      response: 'Taking you to checkout.'
    };
  }

  // Help commands - simplified to just "help"
  if (normalizedCommand.includes('help')) {
    return {
      command: normalizedCommand,
      action: 'help',
      response: `You can say things like: 
        "Search for apples", 
        "Show me dairy products", 
        "Add 3 apples to my cart", 
        "Remove bananas from my cart",
        "Toggle high contrast mode", or
        "Checkout" to complete your purchase.`
    };
  }

  // Default unknown command
  return {
    command: normalizedCommand,
    action: 'unknown',
    response: "I didn't understand that command. Try saying 'help' to see what I can do."
  };
};

function extractSearchQuery(command: string): string | null {
  const searchPatterns = [
    /search for (.*?)( in| from| please| now|\?|$)/i,
    /find (.*?)( in| from| please| now|\?|$)/i,
    /look for (.*?)( in| from| please| now|\?|$)/i,
    /show me (.*?)( please| now|\?|$)/i
  ];
  
  for (const pattern of searchPatterns) {
    const match = command.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return null;
}

function extractProductInfo(
  command: string, 
  availableProducts: Product[], 
  productNameHint: string = '',
  detectedQuantity: number = 1
): { product?: Product, quantity?: number } {
  // Common words to filter out
  const fillerWords = ['to', 'from', 'the', 'my', 'cart', 'basket', 'add', 'remove', 'delete', 'please'];
  
  // Extract quantity if not already provided
  let quantity = detectedQuantity;
  if (quantity === 1) {
    const quantityMatch = command.match(/(\d+)/);
    if (quantityMatch) {
      quantity = parseInt(quantityMatch[1], 10);
    }
  }
  
  // Clean up command to extract product name
  let cleanedCommand = command.toLowerCase();
  fillerWords.forEach(word => {
    cleanedCommand = cleanedCommand.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
  });
  
  // Remove numbers
  cleanedCommand = cleanedCommand.replace(/\d+/, '').trim();
  
  // If we have a product name hint, try to use that first
  if (productNameHint) {
    const singularName = productNameHint.endsWith('s') 
      ? productNameHint.slice(0, -1) 
      : productNameHint;
    
    // Try to find product by name hint first
    for (const product of availableProducts) {
      const productName = product.name.toLowerCase();
      
      if (productName === productNameHint || 
          productName === singularName || 
          productName.includes(productNameHint) || 
          productName.includes(singularName)) {
        return { product, quantity };
      }
    }
  }
  
  // Check for fruit/vegetable singular/plural matching
  for (const product of availableProducts) {
    const productName = product.name.toLowerCase();
    
    // Handle common food items that might be referred to differently
    const nameVariations = [
      productName,
      productName.endsWith('s') ? productName.slice(0, -1) : productName + 's', // Handle plural/singular
      productName === 'apples' ? 'apple' : (productName === 'apple' ? 'apples' : productName),
      productName === 'bananas' ? 'banana' : (productName === 'banana' ? 'bananas' : productName),
      productName === 'oranges' ? 'orange' : (productName === 'orange' ? 'oranges' : productName),
    ];
    
    // Check if any variation of the product name is in the cleaned command
    for (const variation of nameVariations) {
      if (cleanedCommand.includes(variation)) {
        return { product, quantity };
      }
    }
    
    // Also check if category is mentioned (e.g., "add fruit")
    if (product.category.toLowerCase() === cleanedCommand.trim() ||
        cleanedCommand.includes(product.category.toLowerCase())) {
      return { product, quantity };
    }
  }
  
  return {};
}
