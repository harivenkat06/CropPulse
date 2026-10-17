import prisma from '../src/utils/db';

const CROPS = [
  { name: 'Wheat', icon: '🌾' },
  { name: 'Rice (Paddy)', icon: '🌾' },
  { name: 'Tomato', icon: '🍅' },
  { name: 'Onion', icon: '🧅' },
  { name: 'Cotton', icon: '☁️' },
  { name: 'Turmeric', icon: '🟡' },
  { name: 'Sugarcane', icon: '🎋' },
  { name: 'Banana', icon: '🍌' },
  { name: 'Chilli', icon: '🌶️' },
  { name: 'Groundnut', icon: '🥜' },
  { name: 'Maize', icon: '🌽' },
];

const MARKETS = [
  { name: 'Coimbatore Mandi', district: 'Coimbatore', state: 'Tamil Nadu', latitude: 11.0168, longitude: 76.9558 },
  { name: 'Salem Market', district: 'Salem', state: 'Tamil Nadu', latitude: 11.6643, longitude: 78.1460 },
  { name: 'Erode Mandi', district: 'Erode', state: 'Tamil Nadu', latitude: 11.3410, longitude: 77.7172 },
  { name: 'Thanjavur Mandi', district: 'Thanjavur', state: 'Tamil Nadu', latitude: 10.7870, longitude: 79.1378 },
  { name: 'Ooty Market', district: 'Nilgiris', state: 'Tamil Nadu', latitude: 11.4102, longitude: 76.6950 },
];

async function main() {
  console.log('Seeding database...');

  // 1. Clean old data
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationMember.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.logisticsMatch.deleteMany();
  await prisma.logisticsRequest.deleteMany();
  await prisma.logisticsProvider.deleteMany();
  await prisma.order.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.marketPrice.deleteMany();
  await prisma.market.deleteMany();
  await prisma.crop.deleteMany();
  await prisma.farmerProfile.deleteMany();
  await prisma.buyerProfile.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Crops
  const createdCrops = [];
  for (const c of CROPS) {
    const crop = await prisma.crop.create({ data: c });
    createdCrops.push(crop);
  }
  console.log(`Seeded ${createdCrops.length} crops.`);

  // 3. Create Markets
  const createdMarkets = [];
  for (const m of MARKETS) {
    const market = await prisma.market.create({ data: m });
    createdMarkets.push(market);
  }
  console.log(`Seeded ${createdMarkets.length} markets.`);

  // 4. Seed Historical Market Prices (180 days) for time-series forecasting
  console.log('Generating 180 days of historical prices for model training...');
  const basePrices: Record<string, number> = {
    'Tomato': 1500,
    'Onion': 1800,
    'Rice (Paddy)': 2100,
    'Wheat': 2300,
    'Cotton': 6500,
    'Turmeric': 8000,
    'Sugarcane': 300,
    'Banana': 2000,
    'Chilli': 15000,
    'Groundnut': 5500,
    'Maize': 2000
  };

  const today = new Date();
  const pricesToInsert = [];

  for (const crop of createdCrops) {
    const basePrice = basePrices[crop.name] || 2000;
    
    for (const market of createdMarkets) {
      // Seed daily prices
      for (let i = 180; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
        // Add random walk with weekly seasonality & slight upward trend
        const seedValue = Math.sin((i / 7) * 2 * Math.PI) * 0.05; // Weekly seasonality
        const trendValue = (180 - i) * 0.001; // Upward trend
        const randomFactor = (Math.random() - 0.5) * 0.03; // Daily noise
        const pctChange = seedValue + trendValue + randomFactor;
        
        const modalPrice = Math.round(basePrice * (1 + pctChange));
        const minPrice = Math.round(modalPrice * 0.9);
        const maxPrice = Math.round(modalPrice * 1.15);
        const arrivalQty = Math.round(50 + Math.random() * 200);

        pricesToInsert.push({
          cropId: crop.id,
          marketId: market.id,
          variety: 'Local',
          minPrice,
          maxPrice,
          modalPrice,
          unit: 'quintal',
          arrivalQty,
          date,
          source: 'Agmarknet API',
        });
      }
    }
  }

  // Batch insert prices to speed up
  // SQLite doesn't support massive batch inserts in prisma in a single statement, so chunk it
  const chunkSize = 500;
  for (let i = 0; i < pricesToInsert.length; i += chunkSize) {
    const chunk = pricesToInsert.slice(i, i + chunkSize);
    await prisma.marketPrice.createMany({ data: chunk });
  }

  console.log(`Seeded ${pricesToInsert.length} historical price entries.`);
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
