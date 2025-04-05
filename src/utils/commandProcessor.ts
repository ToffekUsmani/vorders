
import { findProductsByName, findProductsByCategory } from '../data/products';
import { Product } from '../components/ProductCard';

export interface CommandResult {
  command: string;
  action: 'search' | 'add' | 'remove' | 'checkout' | 'help' | 'unknown';
  data?: {
    query?: string;
    product?: Product;
    quantity?: number;
    category?: string;
  };
  response: string;
}

export const processCommand = (
  command: string,
  products: Product[]
): CommandResult => {
  const normalizedCommand = command.toLowerCase().trim();

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

  // Add to cart commands
  if (normalizedCommand.includes('add') && 
     (normalizedCommand.includes('cart') || normalizedCommand.includes('basket'))) {
    
    // Try to extract product name and quantity
    const productInfo = extractProductInfo(normalizedCommand, products);
    
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
     (normalizedCommand.includes('cart') || normalizedCommand.includes('basket'))) {
    
    const productInfo = extractProductInfo(normalizedCommand, products);
    
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

  // Help commands
  if (normalizedCommand.includes('help') || normalizedCommand.includes('what can you do')) {
    return {
      command: normalizedCommand,
      action: 'help',
      response: `You can say things like: 
        "Search for apples", 
        "Show me dairy products", 
        "Add milk to my cart", 
        "Remove bananas from my cart", or 
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

function extractProductInfo(command: string, availableProducts: Product[]): { product?: Product, quantity?: number } {
  // Common words to filter out
  const fillerWords = ['to', 'from', 'the', 'my', 'cart', 'basket', 'add', 'remove', 'delete', 'please'];
  
  // Extract quantity
  const quantityMatch = command.match(/(\d+)/);
  const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
  
  // Clean up command to extract product name
  let cleanedCommand = command.toLowerCase();
  fillerWords.forEach(word => {
    cleanedCommand = cleanedCommand.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
  });
  
  cleanedCommand = cleanedCommand.replace(/\d+/, '').trim();
  
  // Check for a match with available products
  for (const product of availableProducts) {
    const productName = product.name.toLowerCase();
    // Check for exact product name or if the command contains the product name
    if (cleanedCommand.includes(productName) || 
        product.category.toLowerCase().includes(cleanedCommand) ||
        // Handle plurals and singulars
        (productName.endsWith('s') && cleanedCommand.includes(productName.slice(0, -1))) ||
        (cleanedCommand.includes(productName + 's'))) {
      return { product, quantity };
    }
  }
  
  return {};
}
