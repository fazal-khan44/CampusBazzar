export const PRESET_CATEGORIES = [
  { id: 'Books', name: 'Books', icon: 'BookOpen', description: 'Novels, text books, competitive exams' },
  { id: 'Notes', name: 'Notes', icon: 'FileText', description: 'Handwritten notes, PYQs, lab manuals' },
  { id: 'Food & Snacks', name: 'Food & Snacks', icon: 'UtensilsCrossed', description: 'Instant noodles, snacks, tea, beverage mix' },
  { id: 'Bottles', name: 'Bottles', icon: 'CupSoda', description: 'Insulated flasks, water bottles, shakers' },
  { id: 'Electronics', name: 'Electronics', icon: 'Smartphone', description: 'Chargers, extensions, headphones, adapters' },
  { id: 'Stationery', name: 'Stationery', icon: 'Scissors', description: 'Pens, calculators, notebooks, geometry kits' },
  { id: 'Sports & Gym Accessories', name: 'Sports & Gym', icon: 'Dumbbell', description: 'Dumbbells, badminton, cricket, football, yoga mats' },
  { id: 'Appliances', name: 'Appliances', icon: 'Zap', description: 'Electric kettles, iron, immersion rods' },
  { id: 'Cycles', name: 'Cycles', icon: 'Bike', description: 'Campus bicycles, locks, pumps' },
  { id: 'Clothing', name: 'Clothing', icon: 'Shirt', description: 'Aprons, lab coats, hoodies' },
  { id: 'Others', name: 'Others', icon: 'MoreHorizontal', description: 'Miscellaneous, other campus essentials' },
];

export const normalizeCategory = (category) => {
  if (!category) return 'Others';
  const presetIds = PRESET_CATEGORIES.map((c) => c.id);
  if (presetIds.includes(category)) return category;
  if (category === 'Food & Munchies' || category === 'Food & Snack') return 'Food & Snacks';
  if (category === 'Bottles & Sippers') return 'Bottles';
  if (category === 'Hostel Appliances') return 'Appliances';
  if (category === 'Electronics & Cables') return 'Electronics';
  if (category === 'Cycles & Mobility') return 'Cycles';
  if (category === 'Clothing & Lab Coats') return 'Clothing';
  if (category === 'Notes & Study Material') return 'Notes';
  if (category === 'Stationery & Accessories' || category === 'Stationery & Small Accessories') return 'Stationery';
  if (category === 'Sports & Gym' || category === 'Sports' || category === 'Gym Accessories') return 'Sports & Gym Accessories';
  return 'Others';
};
