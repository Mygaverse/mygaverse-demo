import { db } from '@/lib/bqool/firebase';
import { collection, doc, writeBatch, getDoc, getDocs, query, where } from 'firebase/firestore';
import { UnifiedCampaign, UnifiedAdGroup, UnifiedProductAd, UnifiedTargeting, UnifiedSearchTerm, UnifiedGoal, DailyStat, BaseMetrics } from '@/components/bqool/ad-manager/data/unifiedAdManagerData';

// --- 1. THEME DEFINITIONS ---

interface ProductTemplate {
    name: string;
    img: string; // Real Unsplash URL
    asin: string;
    sku: string;
    price: number;
}

interface Theme {
    products: ProductTemplate[];
    campaignNames: string[];
    keywords: string[];
}

const THEMES: Record<string, Theme> = {
    // 🇺🇸 US: Tech & Phone Accessories
    'US': {
        products: [
            { name: 'Heavy Duty Phone Lanyard', img: 'https://images.unsplash.com/photo-1616400620252-f478335b7e88?auto=format&fit=crop&w=300&h=300', asin: 'B00US12345', sku: 'US-LAN-001', price: 12.99 },
            { name: 'Clear Shockproof Case', img: 'https://images.unsplash.com/photo-1601598539443-41a043c72778?auto=format&fit=crop&w=300&h=300', asin: 'B00US67890', sku: 'US-CAS-002', price: 15.99 },
            { name: 'Tempered Glass Screen Protector', img: 'https://images.unsplash.com/photo-1632517594539-7817e743dc3d?auto=format&fit=crop&w=300&h=300', asin: 'B00US54321', sku: 'US-GLS-003', price: 9.99 },
            { name: 'USB-C Fast Charger', img: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=300&h=300', asin: 'B00US09876', sku: 'US-CHG-004', price: 19.99 },
            { name: 'Wireless Charging Pad', img: 'https://images.unsplash.com/photo-1625243169389-1383842883dc?auto=format&fit=crop&w=300&h=300', asin: 'B00US11223', sku: 'US-WRL-005', price: 24.99 },
        ],
        campaignNames: ['Tech Accessories', 'Phone Protection', 'Charging Essentials', 'Q4 Promo', 'Brand Defense'],
        keywords: ['phone case', 'lanyard', 'charger', 'iphone accessories', 'fast charging']
    },
    // 🇨🇦 CA: Winter Clothing
    'CA': {
        products: [
            { name: 'Thermal Winter Parka', img: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=300&h=300', asin: 'B0CA123456', sku: 'CA-PRK-001', price: 120.00 },
            { name: 'Merino Wool Beanie', img: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&w=300&h=300', asin: 'B0CA654321', sku: 'CA-HAT-002', price: 25.50 },
            { name: 'Waterproof Snow Boots', img: 'https://images.unsplash.com/photo-1542840410-3092f48dfc11?auto=format&fit=crop&w=300&h=300', asin: 'B0CA987654', sku: 'CA-BOT-003', price: 89.99 },
            { name: 'Touchscreen Gloves', img: 'https://images.unsplash.com/photo-1547638427-bc223253b236?auto=format&fit=crop&w=300&h=300', asin: 'B0CA456789', sku: 'CA-GLV-004', price: 18.99 },
            { name: 'Fleece Lined Leggings', img: 'https://images.unsplash.com/photo-1506619216599-9d16d0903dfd?auto=format&fit=crop&w=300&h=300', asin: 'B0CA112233', sku: 'CA-LEG-005', price: 35.00 },
        ],
        campaignNames: ['Winter Essentials', 'Outerwear', 'Cold Weather Gear', 'Holiday Sale', 'Ski Trip'],
        keywords: ['winter jacket', 'snow boots', 'warm gloves', 'beanie', 'thermal wear']
    },
    // 🇪🇸 ES: Arts & Home Decor
    'ES': {
        products: [
            { name: 'Modern Canvas Art Abstract', img: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=300&h=300', asin: 'B0ES123456', sku: 'ES-ART-001', price: 45.00 },
            { name: 'Ceramic Flower Vase', img: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=300&h=300', asin: 'B0ES654321', sku: 'ES-VAS-002', price: 22.50 },
            { name: 'Boho Wall Mirror', img: 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=300&h=300', asin: 'B0ES987654', sku: 'ES-MIR-003', price: 55.00 },
            { name: 'Geometric Throw Pillows', img: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e6?auto=format&fit=crop&w=300&h=300', asin: 'B0ES456789', sku: 'ES-PIL-004', price: 18.99 },
            { name: 'Rustic Wooden Shelf', img: 'https://images.unsplash.com/photo-1594040291689-d4d0ee37a673?auto=format&fit=crop&w=300&h=300', asin: 'B0ES112233', sku: 'ES-SHL-005', price: 32.00 },
        ],
        campaignNames: ['Home Decor', 'Living Room Update', 'Art & Wall', 'Interior Design', 'Spring Refresh'],
        keywords: ['decoracion pared', 'jarron', 'espejo', 'cojines', 'estanteria']
    },
    // 🇲🇽 MX: Snacks & Nachos
    'MX': {
        products: [
            { name: 'Spicy Nacho Chips Family Pack', img: 'https://images.unsplash.com/photo-1600959907703-125ba1374a12?auto=format&fit=crop&w=300&h=300', asin: 'B0MX123456', sku: 'MX-NCH-001', price: 45.00 },
            { name: 'Authentic Salsa Verde', img: 'https://images.unsplash.com/photo-1572449043416-55f4685c9bb7?auto=format&fit=crop&w=300&h=300', asin: 'B0MX654321', sku: 'MX-SAL-002', price: 35.50 },
            { name: 'Jalapeño Cheese Dip', img: 'https://images.unsplash.com/photo-1598215439218-f6d1949174da?auto=format&fit=crop&w=300&h=300', asin: 'B0MX987654', sku: 'MX-DIP-003', price: 55.00 },
            { name: 'Chili Lime Seasoning', img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=300&h=300', asin: 'B0MX456789', sku: 'MX-SPC-004', price: 25.00 },
            { name: 'Tortilla Press Cast Iron', img: 'https://images.unsplash.com/photo-1571939228310-74358a939791?auto=format&fit=crop&w=300&h=300', asin: 'B0MX112233', sku: 'MX-PRS-005', price: 450.00 },
        ],
        campaignNames: ['Fiesta Snacks', 'Salsas y Dips', 'Authentic Flavors', 'Party Pack', 'Cooking Essentials'],
        keywords: ['nachos', 'salsa verde', 'queso', 'botanas', 'tortillas']
    },
    // 🇯🇵 JP: Anime & Manga
    'JP': {
        products: [
            { name: 'Shonen Manga Vol. 1', img: 'https://images.unsplash.com/photo-1614583224978-f05ce51ef5fa?auto=format&fit=crop&w=300&h=300', asin: 'B0JP123456', sku: 'JP-BK-001', price: 550 },
            { name: 'Action Figure Hero', img: 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?auto=format&fit=crop&w=300&h=300', asin: 'B0JP654321', sku: 'JP-FIG-002', price: 3500 },
            { name: 'Cosplay Wig Blue', img: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=300&h=300', asin: 'B0JP987654', sku: 'JP-WIG-003', price: 2200 },
            { name: 'Anime Poster Set', img: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=300&h=300', asin: 'B0JP456789', sku: 'JP-ART-004', price: 1200 },
            { name: 'Collectible Keychains', img: 'https://images.unsplash.com/photo-1599696773356-f834d8cc382d?auto=format&fit=crop&w=300&h=300', asin: 'B0JP112233', sku: 'JP-KEY-005', price: 800 },
        ],
        campaignNames: ['Manga New Releases', 'Figure Collection', 'Cosplay Gear', 'Otaku Essentials', 'Limited Edition'],
        keywords: ['manga', 'anime figure', 'cosplay', 'poster', 'keychain']
    }
};

// --- HELPERS ---
const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);
const randomFloat = (min: number, max: number) => Math.random() * (max - min) + min;
const randomBool = (probability = 0.5) => Math.random() < probability;
const addDays = (date: Date, days: number) => { const result = new Date(date); result.setDate(result.getDate() + days); return result; };

class SmartBatchWriter {
    private batch = writeBatch(db);
    private count = 0;

    async set(ref: any, data: any) {
        this.batch.set(ref, data);
        this.count++;
        if (this.count >= 400) {
            await this.batch.commit();
            this.batch = writeBatch(db);
            this.count = 0;
        }
    }

    async finalize() {
        if (this.count > 0) await this.batch.commit();
    }
}

// --- UTILS FOR MATH ---
function finalizeMetrics(m: BaseMetrics) {
    m.sales = parseFloat(m.sales.toFixed(2));
    m.spend = parseFloat(m.spend.toFixed(2));
    m.acos = m.sales > 0 ? parseFloat(((m.spend / m.sales) * 100).toFixed(2)) : 0;
    m.roas = m.spend > 0 ? parseFloat((m.sales / m.spend).toFixed(2)) : 0;
    m.cpc = m.clicks > 0 ? parseFloat((m.spend / m.clicks).toFixed(2)) : 0;
    m.ctr = m.impressions > 0 ? parseFloat(((m.clicks / m.impressions) * 100).toFixed(2)) : 0;
    m.cvr = m.clicks > 0 ? parseFloat(((m.orders / m.clicks) * 100).toFixed(2)) : 0;
}

function accumulateMetrics(target: BaseMetrics, source: BaseMetrics) {
    target.impressions += source.impressions;
    target.clicks += source.clicks;
    target.spend += source.spend;
    target.sales += source.sales;
    target.orders += source.orders;
    target.units += source.units;
}

// --- CLEAR DATA FUNCTION (Restored) ---
export const clearStoreData = async (storeId: string) => {
    console.log(`Clearing data for store: ${storeId}`);
    const collections = ['search_terms', 'targeting', 'product_ads', 'ad_groups', 'campaigns', 'goals', 'products'];

    for (const colName of collections) {
        const q = query(collection(db, colName), where('storeId', '==', storeId));
        const snapshot = await getDocs(q);

        // Chunk deletions to avoid 500 ops limit
        const chunkArray = (array: any[], size: number) => {
            const result = [];
            for (let i = 0; i < array.length; i += size) {
                result.push(array.slice(i, i + size));
            }
            return result;
        };

        const chunks = chunkArray(snapshot.docs, 400);
        for (const chunk of chunks) {
            const batch = writeBatch(db);
            chunk.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
        }
    }
    console.log("Store data cleared.");
};

// --- MAIN POPULATOR ---

export const populateStoreData = async (storeId: string) => {
    // 0. Clear existing data first
    await clearStoreData(storeId);

    // 1. Fetch Store to determine Marketplace/Theme
    const storeSnap = await getDoc(doc(db, 'stores', storeId));
    if (!storeSnap.exists()) throw new Error("Store not found");

    const storeData = storeSnap.data();
    const marketplace = storeData.marketplace || 'US';
    const storeName = storeData.name || 'Demo Store';

    // Select Theme (Fallback to US if unknown)
    const theme = THEMES[marketplace] || THEMES['US'];
    const flagCode = marketplace.toLowerCase();

    console.log(`🚀 Populating ${storeId} [${marketplace}] with theme: ${theme.campaignNames[0]}`);

    const writer = new SmartBatchWriter();
    const today = new Date();
    const startDate = addDays(today, -30);

    // 2. Create Products Collection
    for (const prod of theme.products) {
        const pRef = doc(collection(db, 'products'), prod.sku);
        await writer.set(pRef, {
            id: prod.sku, storeId, ...prod,
            status: 'Active',
            inventory: random(50, 500)
        });
    }

    // 3. Goals Setup (STRATEGY ALIGNED & VOLUME SAFE)
    // We create exactly 3 Goals to satisfy the core strategies for the demo.
    // 1 Goal per Ad Type/Strategy combo prevents explosion of data.
    const strategyGoals = [
        { name: 'Launch Strategy', type: 'Brand-Based', adType: 'SP' }, // 4 Campaigns
        { name: 'Aggressive Growth', type: 'Advanced', adType: 'SB' },    // 3 Campaigns
        { name: 'Retargeting Push', type: 'Basic', adType: 'SD' }        // 2 Campaigns
    ];

    const goalMap: Record<string, UnifiedGoal> = {};

    // Initialize Goals with "System" ownership
    strategyGoals.forEach(t => {
        goalMap[t.name] = {
            id: `GOAL-${t.name.replace(/\s+/g, '-').toUpperCase()}`,
            storeId, name: t.name, goalType: t.type as any, targetAcos: random(20, 35), status: 'Active',
            campaignCount: 0, adCount: 0,
            sales: 0, spend: 0, impressions: 0, clicks: 0, orders: 0, units: 0, acos: 0, roas: 0, ctr: 0, cvr: 0, cpc: 0,
            createdBy: 'system', creatorName: 'System Demo',
            createdAt: new Date().toISOString()
        };
    });

    // 4. Hierarchy Generation (STRATEGY BASED)
    const PORTFOLIOS = ['Q1 Strategy', 'Core Products', 'Defensive', 'Discovery'];

    for (const template of strategyGoals) {
        const currentGoal = goalMap[template.name];
        const type = template.adType;

        // Define specific campaign topologies based on Strategy
        let campaignConfigs: { suffix: string, targeting: string, matchType?: string, targetType?: string }[] = [];

        if (template.type === 'Brand-Based' && type === 'SP') {
            // SP: Brand-Based = 4 Campaigns
            campaignConfigs = [
                { suffix: 'Auto', targeting: 'Auto' },
                { suffix: 'Manual Phrase', targeting: 'Manual', matchType: 'Phrase' },
                { suffix: 'Manual Exact', targeting: 'Manual', matchType: 'Exact' },
                { suffix: 'PAT', targeting: 'Manual', targetType: 'Product' }
            ];
        } else if (template.type === 'Advanced' && type === 'SB') {
            // SB: Advanced = 3 Campaigns (Simplified for mock: 3 distinct manuals)
            campaignConfigs = [
                { suffix: 'Product Collection', targeting: 'Manual', matchType: 'Broad' }, // Broad for discovery
                { suffix: 'Video', targeting: 'Manual', matchType: 'Phrase' },
                { suffix: 'Store Spotlight', targeting: 'Manual', matchType: 'Exact' }
            ];
        } else {
            // SD: Basic = 2 Campaigns
            campaignConfigs = [
                { suffix: 'Contextual', targeting: 'Manual', targetType: 'Contextual' },
                { suffix: 'Audiences', targeting: 'Manual', targetType: 'Audience' }
            ];
        }

        let cIndex = 0;
        for (const config of campaignConfigs) {
            cIndex++;
            currentGoal.campaignCount++;

            const campNameBase = theme.campaignNames[(cIndex - 1) % theme.campaignNames.length];
            const isHighPerformer = Math.random() < 0.3;

            const campId = `${type}-CAMP-${template.type.toUpperCase()}-${cIndex}-${random(1000, 9999)}`;
            const campName = `${type} | ${campNameBase} | ${config.suffix}`;
            const campRef = doc(collection(db, 'campaigns'), campId);

            const campMetrics: BaseMetrics = { impressions: 0, clicks: 0, spend: 0, sales: 0, orders: 0, units: 0, acos: 0, roas: 0, ctr: 0, cvr: 0, cpc: 0 };

            // Ad Groups per Campaign (1-2)
            const agCount = random(1, 2);
            for (let g = 1; g <= agCount; g++) {
                currentGoal.adCount++;
                const agId = `${campId}-AG-${g}`;
                const agRef = doc(collection(db, 'ad_groups'), agId);
                const agName = `AG ${g} - ${config.targeting === 'Auto' ? 'Auto' : (config.matchType || config.targetType)}`;

                const agMetrics: BaseMetrics = { impressions: 0, clicks: 0, spend: 0, sales: 0, orders: 0, units: 0, acos: 0, roas: 0, ctr: 0, cvr: 0, cpc: 0 };

                // Helper to distribute metrics
                for (let d = 0; d < 30; d++) {
                    const dailyImps = isHighPerformer ? random(100, 1000) : random(20, 200);
                    const dailyClicks = Math.floor(dailyImps * randomFloat(0.005, 0.03));
                    const dailySpend = parseFloat((dailyClicks * randomFloat(0.5, 2.5)).toFixed(2));
                    const dailyOrders = Math.floor(dailyClicks * randomFloat(0.05, 0.15));
                    const dailySales = parseFloat((dailyOrders * randomFloat(15, 60)).toFixed(2));
                    const dailyUnits = dailyOrders;

                    agMetrics.impressions += dailyImps;
                    agMetrics.clicks += dailyClicks;
                    agMetrics.spend += dailySpend;
                    agMetrics.sales += dailySales;
                    agMetrics.orders += dailyOrders;
                    agMetrics.units += dailyUnits;
                }
                finalizeMetrics(agMetrics);

                // --- PRODUCT ADS ---
                const adItems = theme.products.sort(() => 0.5 - Math.random()).slice(0, random(1, 3));
                const perAdMetrics = {
                    impressions: Math.floor(agMetrics.impressions / adItems.length),
                    clicks: Math.floor(agMetrics.clicks / adItems.length),
                    spend: agMetrics.spend / adItems.length,
                    sales: agMetrics.sales / adItems.length,
                    orders: Math.floor(agMetrics.orders / adItems.length),
                    units: Math.floor(agMetrics.units / adItems.length),
                    acos: 0, roas: 0, ctr: 0, cvr: 0, cpc: 0
                };
                finalizeMetrics(perAdMetrics);

                for (const item of adItems) {
                    const padId = `${agId}-AD-${item.sku}`;
                    const padRef = doc(collection(db, 'product_ads'), padId);
                    let padDoc: UnifiedProductAd;

                    const commonAdProps = {
                        id: padId, storeId, enabled: true,
                        adGroupId: agId, adGroupName: agName, adGroupStatus: 'Enabled',
                        campaignId: campId, campaignName: campName, campaignType: type as any, campaignStatus: 'Enabled',
                        storeName: storeName, flag: flagCode, goalName: currentGoal.name, goalStatus: currentGoal.goalType,
                        createdBy: 'system', creatorName: 'System Demo',
                        ...perAdMetrics
                    };

                    if (type === 'SB') {
                        padDoc = {
                            ...commonAdProps,
                            sbAdText: `${item.name} Collection`, adFormat: config.suffix === 'Video' ? 'Video' : 'Product Collection'
                        };
                    } else {
                        padDoc = {
                            ...commonAdProps,
                            productName: item.name, productImage: item.img, asin: item.asin, sku: item.sku
                        };
                    }
                    await writer.set(padRef, padDoc);
                }

                // --- TARGETING ---
                const kwCount = random(3, 5);
                const perKwMetrics = { ...perAdMetrics };
                finalizeMetrics(perKwMetrics);

                // Use the strategy-defined match type or target type
                const targetTextBase = config.targetType === 'Product' ? 'asin=' : (config.targetType === 'Audience' ? 'audience=' : '');

                for (let k = 0; k < kwCount; k++) {
                    const kwId = `${agId}-KW-${k}`;
                    const kwText = targetTextBase + (theme.keywords[k % theme.keywords.length] || `keyword ${k}`);
                    const isEnabled = randomBool(0.9); // Define isEnabled

                    const targetDoc: UnifiedTargeting = {
                        id: kwId, storeId, enabled: isEnabled, status: isEnabled ? 'ENABLED' : 'PAUSED', // Added Status
                        targetingText: kwText,
                        // Ensure match type comes from Strategy Config if SP/SB Manual
                        ...(config.matchType ? { matchType: config.matchType } : (config.targeting === 'Auto' ? { matchType: 'Auto' } : {})),
                        ...(config.targetType ? { targetType: config.targetType } : {}),

                        bid: randomFloat(0.5, 3.0),
                        minBid: randomBool() ? randomFloat(0.1, 0.5) : null,
                        maxBid: randomBool() ? randomFloat(3.0, 5.0) : null,

                        adGroupId: agId, adGroupName: agName, adGroupStatus: 'Enabled',
                        campaignId: campId, campaignName: campName, campaignType: type as any, campaignStatus: 'Enabled',
                        storeName: storeName, flag: flagCode, goalName: currentGoal.name, goalStatus: currentGoal.goalType,
                        isAutoHarvested: randomBool(0.2),
                        createdBy: 'system', creatorName: 'System Demo',
                        ...perKwMetrics
                    };
                    await writer.set(doc(collection(db, 'targeting'), kwId), targetDoc);
                }

                // --- SEARCH TERMS ---
                if (type !== 'SD') {
                    const stCount = random(2, 4);
                    for (let s = 0; s < stCount; s++) {
                        const stId = `${agId}-ST-${s}`;
                        const isAsin = randomBool(0.3);
                        const term = isAsin ? `B0${random(100000, 999999)}` : `${theme.keywords[random(0, theme.keywords.length - 1)]} cheap`;

                        const stDoc: UnifiedSearchTerm = {
                            id: stId, storeId, searchTerm: term,
                            adGroupId: agId, adGroupName: agName, adGroupStatus: 'Enabled',
                            campaignId: campId, campaignName: campName, campaignType: type as any, campaignStatus: 'Enabled',
                            targetingText: theme.keywords[0], targetingType: config.matchType || 'Broad', targetingBid: 1.5, targetingStatus: 'Enabled',
                            addedAsTypes: [], isAutoHarvested: false,
                            storeName: storeName, flag: flagCode, goalName: currentGoal.name, goalStatus: currentGoal.goalType,
                            createdBy: 'system', creatorName: 'System Demo',
                            ...perKwMetrics
                        };
                        await writer.set(doc(collection(db, 'search_terms'), stId), stDoc);
                    }
                }

                // Write Ad Group
                const isAgEnabled = true;
                const agDoc: UnifiedAdGroup = {
                    id: agId, storeId, name: agName, enabled: isAgEnabled, status: isAgEnabled ? 'ENABLED' : 'PAUSED', // Added Status
                    campaignId: campId, campaignName: campName, type: type as any,
                    defaultBid: randomFloat(0.5, 2.0), aiBiddingEnabled: randomBool(0.4),
                    storeName: storeName, flag: flagCode, goalName: currentGoal.name, goalType: currentGoal.goalType,
                    // Fix: Use spread for optional fields to avoid undefined
                    ...(type === 'SB' ? { adFormat: (config.suffix === 'Video' ? 'Video' : 'Product Collection') } : {}),
                    ...(config.targetType ? { targetingType: config.targetType } : {}),

                    // ADDED ownership
                    createdBy: 'system', creatorName: 'System Demo',
                    ...agMetrics
                };
                await writer.set(agRef, agDoc);
                accumulateMetrics(campMetrics, agMetrics);
            } // End Ad Group Loop

            finalizeMetrics(campMetrics);
            accumulateMetrics(currentGoal, campMetrics);

            const isCampEnabled = true;
            const campDoc: UnifiedCampaign = {
                id: campId, storeId, name: campName, type: type as any, enabled: isCampEnabled, status: isCampEnabled ? 'ENABLED' : 'PAUSED', // Added Status
                storeName: storeName, flag: flagCode,
                budget: random(50, 300), autoBudget: randomBool(), portfolio: PORTFOLIOS[random(0, 2)],
                goalName: currentGoal.name, goalStatus: currentGoal.goalType,
                // ADDED ownership
                createdBy: 'system', creatorName: 'System Demo',
                createdAt: new Date().toISOString(),
                ...campMetrics
            };
            await writer.set(campRef, campDoc);

        } // End Campaign Loop
    } // End Goal Loop

    // Write Goals
    for (const g of Object.values(goalMap)) {
        finalizeMetrics(g);
        await writer.set(doc(collection(db, 'goals'), g.id), g);
    }

    await writer.finalize();
};