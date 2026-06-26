import type { Restaurant, MenuItem, MenuCategory, Order, Reservation, Promotion } from '../types';

export const RESTAURANTS: Restaurant[] = [
  {
    id: '1', slug: 'savora-bandra',
    name: 'Savora Bandra', cuisine: 'Contemporary European',
    rating: 4.8, reviewCount: 342, priceRange: '₹₹₹₹',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80',
    coverImage: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80',
    tags: ['Fine Dining', 'European', 'Bar'],
    isOpen: true, isFavorite: true,
    distance: '1.2 km', eta: '20–30 min',
    address: '14 Hill Road, Bandra West, Mumbai 400050',
    lat: 19.0596, lng: 72.8295,
  },
  {
    id: '2', slug: 'savora-colaba',
    name: 'Savora Colaba', cuisine: 'Modern Indian',
    rating: 4.7, reviewCount: 218, priceRange: '₹₹₹₹',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80',
    coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80',
    tags: ['Heritage', 'Tasting Menu', 'Cocktails'],
    isOpen: true, isFavorite: false,
    distance: '4.8 km', eta: '35–45 min',
    address: '7 Colaba Causeway, Colaba, Mumbai 400001',
    lat: 18.9220, lng: 72.8347,
  },
  {
    id: '3', slug: 'savora-worli',
    name: 'Savora Worli', cuisine: 'Mediterranean',
    rating: 4.6, reviewCount: 189, priceRange: '₹₹₹',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80',
    coverImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80',
    tags: ['Sea View', 'Brunch', 'Wine Bar'],
    isOpen: true, isFavorite: true,
    distance: '3.1 km', eta: '30–40 min',
    address: 'Worli Sea Face, Worli, Mumbai 400030',
    lat: 19.0118, lng: 72.8160,
  },
  {
    id: '4', slug: 'savora-lower-parel',
    name: 'Savora Lower Parel', cuisine: 'Pan-Asian',
    rating: 4.5, reviewCount: 127, priceRange: '₹₹₹',
    image: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600&q=80',
    coverImage: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=1200&q=80',
    tags: ['Rooftop', 'Fusion', 'DJ Nights'],
    isOpen: false, isFavorite: false,
    distance: '5.5 km', eta: '40–50 min',
    address: 'Palladium Mall, Lower Parel, Mumbai 400013',
    lat: 18.9920, lng: 72.8277,
  },
];

export const MENU_CATEGORIES: MenuCategory[] = [
  { id: 'starters', name: 'Starters', emoji: '🥗' },
  { id: 'mains', name: 'Mains', emoji: '🍽️' },
  { id: 'pasta', name: 'Pasta & Risotto', emoji: '🍝' },
  { id: 'desserts', name: 'Desserts', emoji: '🍮' },
  { id: 'cocktails', name: 'Cocktails', emoji: '🍸' },
  { id: 'wines', name: 'Wines', emoji: '🍷' },
];

export const MENU_ITEMS: MenuItem[] = [
  // Starters
  { id: 's1', name: 'Burrata Caprese', description: 'Fresh burrata, heirloom tomatoes, basil oil, aged balsamic', price: 950, image: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=400&q=80', category: 'starters', isVeg: true, isBestSeller: true, calories: 380 },
  { id: 's2', name: 'Truffle Arancini', description: 'Black truffle risotto balls, parmesan crisp, romesco sauce', price: 795, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80', category: 'starters', isVeg: true, isBestSeller: false, calories: 420 },
  { id: 's3', name: 'Seared Scallops', description: 'Pan-seared king scallops, cauliflower purée, crispy capers, lemon beurre blanc', price: 1295, image: 'https://images.unsplash.com/photo-1559410545-0bdcd187e0a6?w=400&q=80', category: 'starters', isVeg: false, isBestSeller: true, calories: 310 },
  // Mains
  { id: 'm1', name: 'Saffron Risotto', description: 'Carnaroli rice, wild mushrooms, parmesan foam, white truffle oil', price: 1240, image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&q=80', category: 'mains', isVeg: true, isBestSeller: true, calories: 680 },
  { id: 'm2', name: 'Pan-Seared Duck Breast', description: 'French duck breast, cherry jus, dauphinoise potato, wilted spinach', price: 1680, image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80', category: 'mains', isVeg: false, isBestSeller: true, calories: 720 },
  { id: 'm3', name: 'Grilled Sea Bass', description: 'Mediterranean sea bass, fennel confit, saffron velouté, samphire', price: 1920, image: 'https://images.unsplash.com/photo-1519984388953-d2406bc725e1?w=400&q=80', category: 'mains', isVeg: false, isBestSeller: false, calories: 540 },
  { id: 'm4', name: 'Mushroom Wellington', description: 'Mixed mushroom duxelles, puff pastry, truffle jus, asparagus', price: 1350, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80', category: 'mains', isVeg: true, isBestSeller: false, calories: 760 },
  // Pasta
  { id: 'p1', name: 'Lobster Linguine', description: 'Fresh linguine, half lobster, cherry tomato bisque, tarragon', price: 2100, image: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=400&q=80', category: 'pasta', isVeg: false, isBestSeller: true, calories: 780 },
  { id: 'p2', name: 'Cacio e Pepe', description: 'Tonnarelli pasta, aged pecorino, tellicherry black pepper', price: 895, image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&q=80', category: 'pasta', isVeg: true, isBestSeller: false, calories: 620 },
  // Desserts
  { id: 'd1', name: 'Chocolate Fondant', description: 'Valrhona dark chocolate, salted caramel core, vanilla ice cream', price: 680, image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80', category: 'desserts', isVeg: true, isBestSeller: true, calories: 480 },
  { id: 'd2', name: 'Panna Cotta', description: 'Madagascan vanilla, passionfruit coulis, tuile biscuit', price: 520, image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80', category: 'desserts', isVeg: true, isBestSeller: false, calories: 320 },
  { id: 'd3', name: 'Crème Brûlée', description: 'Classic French custard, caramelised sugar, fresh berries', price: 590, image: 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=400&q=80', category: 'desserts', isVeg: true, isBestSeller: false, calories: 360 },
  // Cocktails
  { id: 'c1', name: 'Elderflower Spritz', description: 'Hendrick\'s gin, elderflower cordial, fever-tree tonic, cucumber', price: 695, image: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&q=80', category: 'cocktails', isVeg: true, isBestSeller: true, calories: 180 },
  { id: 'c2', name: 'Savora Negroni', description: 'Campari, sweet vermouth, Tanqueray gin, orange bitters', price: 750, image: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400&q=80', category: 'cocktails', isVeg: true, isBestSeller: false, calories: 220 },
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-2024-001', restaurantId: '1', restaurantName: 'Savora Bandra',
    restaurantImage: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&q=80',
    items: [
      { id: 'm1', name: 'Saffron Risotto', qty: 2, price: 1240 },
      { id: 'd1', name: 'Chocolate Fondant', qty: 2, price: 680 },
    ],
    subtotal: 3840, tax: 192, serviceCharge: 384, total: 4416,
    status: 'delivered', type: 'dine-in', createdAt: '2024-06-20T20:30:00Z',
    tableNumber: 12,
  },
  {
    id: 'ORD-2024-002', restaurantId: '2', restaurantName: 'Savora Colaba',
    restaurantImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&q=80',
    items: [
      { id: 's1', name: 'Burrata Caprese', qty: 1, price: 950 },
      { id: 'm2', name: 'Pan-Seared Duck Breast', qty: 1, price: 1680 },
      { id: 'c1', name: 'Elderflower Spritz', qty: 2, price: 695 },
    ],
    subtotal: 4020, tax: 201, serviceCharge: 402, total: 4623,
    status: 'preparing', type: 'dine-in', createdAt: '2024-06-23T19:15:00Z',
    tableNumber: 5, estimatedTime: '25 min',
  },
];

export const MOCK_RESERVATIONS: Reservation[] = [
  {
    id: 'RES-2024-001', restaurantId: '1', restaurantName: 'Savora Bandra',
    restaurantImage: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&q=80',
    date: '2024-06-28', time: '20:00', guests: 4,
    status: 'confirmed', tableNumber: 8, occasion: 'Anniversary',
    specialRequest: 'Window table preferred. Vegetarian options required.',
  },
  {
    id: 'RES-2024-002', restaurantId: '3', restaurantName: 'Savora Worli',
    restaurantImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&q=80',
    date: '2024-07-05', time: '13:00', guests: 2,
    status: 'pending', occasion: 'Birthday',
  },
];

export const PROMOTIONS: Promotion[] = [
  { id: '1', title: 'Date Night Special', subtitle: '3-course dinner for two', discount: '₹1,200 off', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80', bgColor: '#260B10', restaurantSlug: 'savora-bandra' },
  { id: '2', title: 'Sunday Brunch', subtitle: 'All-inclusive dining experience', discount: '20% off', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80', bgColor: '#1a3a2a', restaurantSlug: 'savora-worli' },
  { id: '3', title: 'Truffle Season', subtitle: 'Exclusive 5-course tasting menu', discount: 'Limited seats', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80', bgColor: '#1a1a3a', restaurantSlug: 'savora-colaba' },
];
