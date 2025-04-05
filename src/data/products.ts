
import { Product } from '../components/ProductCard';

export const products: Product[] = [
  {
    id: 1,
    name: 'Fresh Organic Apples',
    price: 2.99,
    image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce',
    category: 'fruits',
    description: 'Sweet and crisp organic apples, perfect for snacking or baking.'
  },
  {
    id: 2,
    name: 'Whole Wheat Bread',
    price: 3.49,
    image: 'https://images.unsplash.com/photo-1565711561500-49678a10a63f',
    category: 'bakery',
    description: 'Hearty whole wheat bread made with organic flour.'
  },
  {
    id: 3,
    name: 'Free Range Eggs',
    price: 4.99,
    image: 'https://images.unsplash.com/photo-1518569656558-1f25e69d93d7',
    category: 'dairy',
    description: 'Farm fresh free-range eggs from happy chickens.'
  },
  {
    id: 4,
    name: 'Organic Milk',
    price: 3.79,
    image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b',
    category: 'dairy',
    description: 'Creamy organic milk from grass-fed cows.'
  },
  {
    id: 5,
    name: 'Ripe Bananas',
    price: 1.99,
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e',
    category: 'fruits',
    description: 'Sweet and ripe bananas, perfect for smoothies or snacking.'
  },
  {
    id: 6,
    name: 'Fresh Tomatoes',
    price: 2.49,
    image: 'https://images.unsplash.com/photo-1518977822534-7049a61ee0c2',
    category: 'vegetables',
    description: 'Juicy red tomatoes perfect for salads and sauces.'
  },
  {
    id: 7,
    name: 'Greek Yogurt',
    price: 5.99,
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777',
    category: 'dairy',
    description: 'Creamy authentic Greek yogurt, high in protein.'
  },
  {
    id: 8,
    name: 'Organic Chicken Breast',
    price: 9.99,
    image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791',
    category: 'meat',
    description: 'Free-range organic chicken breast, perfect for healthy meals.'
  },
  {
    id: 9,
    name: 'Fresh Atlantic Salmon',
    price: 12.99,
    image: 'https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6',
    category: 'seafood',
    description: 'Wild-caught Atlantic salmon, rich in omega-3.'
  },
  {
    id: 10,
    name: 'Baby Spinach',
    price: 3.29,
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb',
    category: 'vegetables',
    description: 'Fresh and tender baby spinach, perfect for salads and cooking.'
  },
  {
    id: 11,
    name: 'Sweet Potatoes',
    price: 2.79,
    image: 'https://images.unsplash.com/photo-1596097757671-9e8b4e8c6ca4',
    category: 'vegetables',
    description: 'Nutritious sweet potatoes great for roasting or mashing.'
  },
  {
    id: 12,
    name: 'Avocados',
    price: 4.49,
    image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578',
    category: 'fruits',
    description: 'Ripe and creamy avocados, perfect for toast or guacamole.'
  },
  {
    id: 13,
    name: 'Brown Rice',
    price: 3.99,
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c',
    category: 'grains',
    description: 'Nutritious whole grain brown rice, high in fiber.'
  },
  {
    id: 14,
    name: 'Ground Beef',
    price: 7.99,
    image: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976',
    category: 'meat',
    description: 'Lean ground beef perfect for burgers, meatballs, and more.'
  },
  {
    id: 15,
    name: 'Carrots',
    price: 1.99,
    image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37',
    category: 'vegetables',
    description: 'Fresh crisp carrots ideal for snacking, cooking, or juicing.'
  },
  {
    id: 16,
    name: 'Pasta',
    price: 2.49,
    image: 'https://images.unsplash.com/photo-1626078436898-7c7f689b8be9',
    category: 'grains',
    description: 'Italian semolina pasta, perfect for your favorite sauce.'
  },
  {
    id: 17,
    name: 'Onions',
    price: 1.49,
    image: 'https://images.unsplash.com/photo-1618512496248-a3472b67e42f',
    category: 'vegetables',
    description: 'Sweet yellow onions essential for cooking and flavor.'
  },
  {
    id: 18,
    name: 'Cheddar Cheese',
    price: 5.99,
    image: 'https://images.unsplash.com/photo-1618164436241-4473940d1f5c',
    category: 'dairy',
    description: 'Sharp cheddar cheese perfect for sandwiches, burgers, or snacking.'
  },
  {
    id: 19,
    name: 'Broccoli',
    price: 2.99,
    image: 'https://images.unsplash.com/photo-1615485500704-8e990f9309a5',
    category: 'vegetables',
    description: 'Fresh broccoli florets packed with vitamins and nutrients.'
  },
  {
    id: 20,
    name: 'Strawberries',
    price: 4.99,
    image: 'https://images.unsplash.com/photo-1543528176-61b239494933',
    category: 'fruits',
    description: 'Sweet juicy strawberries, perfect for desserts or smoothies.'
  }
];

export const categories = [
  { id: 'all', name: 'All Products' },
  { id: 'fruits', name: 'Fruits' },
  { id: 'vegetables', name: 'Vegetables' },
  { id: 'dairy', name: 'Dairy & Eggs' },
  { id: 'bakery', name: 'Bakery' },
  { id: 'meat', name: 'Meat' },
  { id: 'seafood', name: 'Seafood' },
  { id: 'grains', name: 'Grains & Pasta' }
];

export const findProductsByName = (query: string): Product[] => {
  const lowerQuery = query.toLowerCase();
  return products.filter(product => 
    product.name.toLowerCase().includes(lowerQuery) || 
    product.category.toLowerCase().includes(lowerQuery) ||
    product.description.toLowerCase().includes(lowerQuery)
  );
};

export const findProductsByCategory = (categoryId: string): Product[] => {
  if (categoryId === 'all') return products;
  return products.filter(product => product.category === categoryId);
};
