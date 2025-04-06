
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
  console.log("Processing command:", normalizedCommand);

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
    console.log("Quantity match found:", quantity, productNameHint);
  }

  // Add to cart commands - simplified pattern matching
  if (normalizedCommand.includes('add')) {
    console.log("Add command detected");
    
    // Direct add command parsing: "add [product]" or "add [quantity] [product]"
    const productInfo = extractProductInfo(normalizedCommand, products, productNameHint, quantity);
    console.log("Product info extracted:", productInfo);
    
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
  console.log("Extracting product info from:", command);
  console.log("Hint:", productNameHint, "Quantity:", detectedQuantity);
  
  // Common words to filter out
  const fillerWords = ['to', 'from', 'the', 'my', 'cart', 'basket', 'add', 'remove', 'delete', 'please'];
  
  // Extract quantity if not already provided
  let quantity = detectedQuantity;
  if (quantity === 1) {
    const quantityMatch = command.match(/(\d+)/);
    if (quantityMatch) {
      quantity = parseInt(quantityMatch[1], 10);
      console.log("Extracted quantity:", quantity);
    }
  }
  
  // Clean up command to extract product name
  let cleanedCommand = command.toLowerCase();
  fillerWords.forEach(word => {
    cleanedCommand = cleanedCommand.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
  });
  
  // Remove numbers
  cleanedCommand = cleanedCommand.replace(/\d+/, '').trim();
  console.log("Cleaned command:", cleanedCommand);
  
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
        console.log("Found product by hint:", product.name);
        return { product, quantity };
      }
    }
  }
  
  // Direct matching - check for each product name in the command
  for (const product of availableProducts) {
    const productName = product.name.toLowerCase();
    const singularName = productName.endsWith('s') ? productName.slice(0, -1) : productName;
    
    // If product name is directly in the command
    if (cleanedCommand.includes(productName) || cleanedCommand.includes(singularName)) {
      console.log("Found product by direct match:", product.name);
      return { product, quantity };
    }
  }
  
  // Fuzzy matching - if no direct match found
  if (cleanedCommand.length > 0) {
    // Try to match any product that has at least part of its name in the command
    for (const product of availableProducts) {
      const productName = product.name.toLowerCase();
      
      // Handle common food items that might be referred to differently
      const nameVariations = [
        productName,
        productName.endsWith('s') ? productName.slice(0, -1) : productName + 's', // Handle plural/singular
        productName === 'apples' ? 'apple' : (productName === 'apple' ? 'apples' : productName),
        productName === 'bananas' ? 'banana' : (productName === 'banana' ? 'bananas' : productName),
      ];
      
      // Check if any variation of the product name is similar to parts of the cleaned command
      for (const variation of nameVariations) {
        if (cleanedCommand.includes(variation) || 
            variation.includes(cleanedCommand) || 
            levenshteinDistance(cleanedCommand, variation) <= 2) {
          console.log("Found product by fuzzy match:", product.name);
          return { product, quantity };
        }
      }
      
      // Also check if category is mentioned (e.g., "add fruit")
      if (product.category.toLowerCase() === cleanedCommand.trim() ||
          cleanedCommand.includes(product.category.toLowerCase())) {
        console.log("Found product by category:", product.name);
        return { product, quantity };
      }
    }
    
    // Last resort - find the closest match
    let bestMatch = null;
    let bestDistance = Infinity;
    
    for (const product of availableProducts) {
      const productName = product.name.toLowerCase();
      const distance = levenshteinDistance(cleanedCommand, productName);
      
      if (distance < bestDistance && distance <= 4) {
        bestDistance = distance;
        bestMatch = product;
      }
    }
    
    if (bestMatch) {
      console.log("Found product by best match:", bestMatch.name);
      return { product: bestMatch, quantity };
    }
  }
  
  console.log("No product found");
  return {};
}

// Helper function for fuzzy matching
function levenshteinDistance(a: string, b: string): number {
  const matrix = [];
  
  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}
