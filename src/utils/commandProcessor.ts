
import { findProductsByName, findProductsByCategory } from '../data/products';
import { Product } from '../components/ProductCard';

export interface CommandResult {
  command: string;
  action: 'search' | 'add' | 'remove' | 'checkout' | 'help' | 'unknown' | 'contrast' | 'describe' | 'emergency' | 'cart';
  data?: {
    query?: string;
    product?: Product;
    quantity?: number;
    category?: string;
    contrastMode?: boolean;
    description?: Product;
  };
  response: string;
}

export const processCommand = (
  command: string,
  products: Product[]
): CommandResult => {
  const normalizedCommand = command.toLowerCase().trim();
  console.log("Processing command:", normalizedCommand);

  // Emergency helpline handling
  if (normalizedCommand.includes('emergency')) {
    return {
      command: normalizedCommand,
      action: 'emergency',
      response: "Calling helpline number. Please stay on the line for immediate assistance."
    };
  }

  // Cart command
  if (normalizedCommand.includes('cart') || 
      normalizedCommand.includes('basket') ||
      normalizedCommand.includes('shopping bag') ||
      normalizedCommand.match(/show (my )?(cart|basket)/i) ||
      normalizedCommand.match(/open (my )?(cart|basket)/i) ||
      normalizedCommand.match(/go to (my )?(cart|basket)/i)) {
    
    return {
      command: normalizedCommand,
      action: 'cart',
      response: "Opening your shopping cart."
    };
  }

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

  // Product description requests
  if (normalizedCommand.includes('describe') || 
      normalizedCommand.includes('tell me about') || 
      normalizedCommand.includes('what is') || 
      normalizedCommand.includes('details of')) {
    
    // Extract potential product name from the command
    let productName = extractProductNameFromCommand(normalizedCommand);
    console.log("Looking for product description:", productName);
    
    if (productName) {
      // Find the product in our available products
      const targetProduct = findBestMatchingProduct(productName, products);
      
      if (targetProduct) {
        return {
          command: normalizedCommand,
          action: 'describe',
          data: { description: targetProduct },
          response: `${targetProduct.name}: ${targetProduct.description} Price: $${targetProduct.price}.`
        };
      }
    }
    
    // If we got here, we couldn't find the product
    return {
      command: normalizedCommand,
      action: 'unknown',
      response: "I couldn't find information about that product. Try searching for it first."
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

  // Help commands - enhanced with new features
  if (normalizedCommand.includes('help')) {
    return {
      command: normalizedCommand,
      action: 'help',
      response: `You can say things like: 
        "Search for apples", 
        "Show me dairy products", 
        "Describe apples" to hear product details,
        "Add 3 apples to my cart", 
        "Remove bananas from my cart",
        "Go to cart" to open your shopping cart,
        "Toggle high contrast mode" for better visibility,
        "Emergency" to call our helpline immediately, or
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

// Helper function to extract product name from description commands
function extractProductNameFromCommand(command: string): string {
  const patterns = [
    /describe\s+(?:the\s+)?(.+?)(?:\s+to me|\s+for me|$)/i,
    /tell me about\s+(?:the\s+)?(.+?)(?:\s+please|\s+now|\?|$)/i,
    /what is\s+(?:a\s+)?(?:the\s+)?(.+?)(?:\?|$)/i,
    /details of\s+(?:the\s+)?(.+?)(?:\s+please|\s+now|\?|$)/i
  ];
  
  for (const pattern of patterns) {
    const match = command.match(pattern);
    if (match && match[1]) {
      // Clean up the product name by removing common filler words
      let name = match[1].trim();
      const fillerWords = ['a', 'an', 'the', 'this', 'these', 'those', 'please', 'some'];
      fillerWords.forEach(word => {
        name = name.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
      });
      return name.trim();
    }
  }
  
  // If no specific pattern matched, extract the part after the key phrases
  const keyPhrases = ['describe', 'tell me about', 'what is', 'details of'];
  for (const phrase of keyPhrases) {
    if (command.includes(phrase)) {
      const afterPhrase = command.substring(command.indexOf(phrase) + phrase.length);
      return afterPhrase.trim();
    }
  }
  
  return '';
}

// Improved function to find the best matching product for description
function findBestMatchingProduct(productName: string, products: Product[]): Product | undefined {
  // Direct case-insensitive match
  const directMatch = products.find(p => 
    p.name.toLowerCase() === productName.toLowerCase()
  );
  
  if (directMatch) return directMatch;
  
  // Partial match
  const partialMatch = products.find(p => 
    p.name.toLowerCase().includes(productName.toLowerCase()) || 
    productName.toLowerCase().includes(p.name.toLowerCase())
  );
  
  if (partialMatch) return partialMatch;
  
  // Fuzzy match using Levenshtein distance
  let bestMatch = null;
  let bestScore = Number.MAX_SAFE_INTEGER;
  
  for (const product of products) {
    const distance = levenshteinDistance(product.name.toLowerCase(), productName.toLowerCase());
    if (distance < bestScore && distance < 5) { // Maximum tolerance of 5 edits
      bestScore = distance;
      bestMatch = product;
    }
  }
  
  return bestMatch || undefined;
}

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
  
  // Fuzzy matching for apple and other products with generic names
  if (cleanedCommand.length > 0) {
    // Priority for common items with simple names
    const commonItems = ["apple", "banana", "milk", "bread", "egg", "cheese", "yogurt"];
    for (const item of commonItems) {
      if (cleanedCommand.includes(item)) {
        const foundProduct = availableProducts.find(p => 
          p.name.toLowerCase() === item || 
          p.name.toLowerCase() === item + "s" ||
          p.name.toLowerCase().includes(item)
        );
        if (foundProduct) {
          console.log("Found common product:", foundProduct.name);
          return { product: foundProduct, quantity };
        }
      }
    }
  
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
