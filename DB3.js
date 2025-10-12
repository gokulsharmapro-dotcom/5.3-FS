const mongoose = require('mongoose');
const express = require('express');

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ecommerceDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected Successfully'))
.catch(err => console.error('❌ Database connection error:', err));

// Product Schema with Nested Variants
const variantSchema = new mongoose.Schema({
    color: {
        type: String,
        required: [true, 'Variant color is required'],
        trim: true
    },
    size: {
        type: String,
        required: [true, 'Variant size is required'],
        trim: true
    },
    stock: {
        type: Number,
        required: [true, 'Stock quantity is required'],
        min: [0, 'Stock cannot be negative']
    },
    sku: {
        type: String,
        required: [true, 'SKU is required'],
        unique: true,
        trim: true
    },
    priceModifier: {
        type: Number,
        default: 0,
        min: [-1000, 'Price modifier too low'],
        max: [1000, 'Price modifier too high']
    },
    images: [{
        type: String,
        trim: true
    }]
}, { _id: true });

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        maxlength: [100, 'Product name cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Product description is required'],
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    basePrice: {
        type: Number,
        required: [true, 'Product base price is required'],
        min: [0, 'Price cannot be negative']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: {
            values: ['Electronics', 'Clothing', 'Books', 'Home & Kitchen', 'Sports', 'Beauty', 'Toys'],
            message: '{VALUE} is not a valid category'
        }
    },
    brand: {
        type: String,
        required: [true, 'Brand is required'],
        trim: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    variants: [variantSchema],
    isActive: {
        type: Boolean,
        default: true
    },
    rating: {
        average: {
            type: Number,
            default: 0,
            min: [0, 'Rating cannot be less than 0'],
            max: [5, 'Rating cannot exceed 5']
        },
        count: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true
});

// Create indexes for better query performance
productSchema.index({ category: 1, brand: 1 });
productSchema.index({ 'variants.stock': 1 });
productSchema.index({ tags: 1 });

// Virtual for total stock across all variants
productSchema.virtual('totalStock').get(function() {
    return this.variants.reduce((total, variant) => total + variant.stock, 0);
});

// Method to check if product has stock
productSchema.methods.hasStock = function() {
    return this.variants.some(variant => variant.stock > 0);
};

// Static method to find products by category
productSchema.statics.findByCategory = function(category) {
    return this.find({ category, isActive: true });
};

// Static method to find low stock products
productSchema.statics.findLowStock = function(threshold = 5) {
    return this.find({ 
        'variants.stock': { $lte: threshold },
        isActive: true 
    });
};

const Product = mongoose.model('Product', productSchema);

// ==================== SAMPLE DATA INSERTION ====================

const insertSampleData = async () => {
    try {
        // Clear existing data
        await Product.deleteMany({});
        
        // Sample products with nested variants
        const sampleProducts = [
            {
                name: "iPhone 15 Pro",
                description: "Latest iPhone with advanced camera system and A17 Pro chip",
                basePrice: 999,
                category: "Electronics",
                brand: "Apple",
                tags: ["smartphone", "premium", "5g"],
                variants: [
                    {
                        color: "Titanium Black",
                        size: "128GB",
                        stock: 25,
                        sku: "IP15P-BLK-128",
                        priceModifier: 0,
                        images: ["iphone_black_1.jpg", "iphone_black_2.jpg"]
                    },
                    {
                        color: "Titanium White",
                        size: "256GB",
                        stock: 15,
                        sku: "IP15P-WHT-256",
                        priceModifier: 100,
                        images: ["iphone_white_1.jpg", "iphone_white_2.jpg"]
                    },
                    {
                        color: "Titanium Blue",
                        size: "512GB",
                        stock: 8,
                        sku: "IP15P-BLU-512",
                        priceModifier: 200,
                        images: ["iphone_blue_1.jpg", "iphone_blue_2.jpg"]
                    }
                ],
                rating: {
                    average: 4.8,
                    count: 342
                }
            },
            {
                name: "Nike Air Max 270",
                description: "Comfortable running shoes with Air Max cushioning",
                basePrice: 150,
                category: "Sports",
                brand: "Nike",
                tags: ["shoes", "running", "athletic"],
                variants: [
                    {
                        color: "Black/White",
                        size: "US 9",
                        stock: 45,
                        sku: "NIKE-AM270-BW-9",
                        priceModifier: 0,
                        images: ["nike_black_1.jpg"]
                    },
                    {
                        color: "Red/Black",
                        size: "US 10",
                        stock: 32,
                        sku: "NIKE-AM270-RB-10",
                        priceModifier: 0,
                        images: ["nike_red_1.jpg"]
                    },
                    {
                        color: "Blue/White",
                        size: "US 11",
                        stock: 18,
                        sku: "NIKE-AM270-BW-11",
                        priceModifier: 0,
                        images: ["nike_blue_1.jpg"]
                    },
                    {
                        color: "Black/White",
                        size: "US 12",
                        stock: 0,
                        sku: "NIKE-AM270-BW-12",
                        priceModifier: 0,
                        images: ["nike_black_1.jpg"]
                    }
                ],
                rating: {
                    average: 4.5,
                    count: 189
                }
            },
            {
                name: "The Great Gatsby",
                description: "Classic novel by F. Scott Fitzgerald",
                basePrice: 12.99,
                category: "Books",
                brand: "Penguin Classics",
                tags: ["fiction", "classic", "literature"],
                variants: [
                    {
                        color: "Paperback",
                        size: "Standard",
                        stock: 120,
                        sku: "BOOK-GG-PB-STD",
                        priceModifier: 0,
                        images: ["gatsby_paperback.jpg"]
                    },
                    {
                        color: "Hardcover",
                        size: "Standard",
                        stock: 45,
                        sku: "BOOK-GG-HC-STD",
                        priceModifier: 8,
                        images: ["gatsby_hardcover.jpg"]
                    },
                    {
                        color: "Collector's Edition",
                        size: "Large",
                        stock: 15,
                        sku: "BOOK-GG-CE-LRG",
                        priceModifier: 15,
                        images: ["gatsby_collector.jpg"]
                    }
                ],
                rating: {
                    average: 4.7,
                    count: 567
                }
            },
            {
                name: "Stainless Steel Cookware Set",
                description: "10-piece stainless steel cookware set for professional cooking",
                basePrice: 299.99,
                category: "Home & Kitchen",
                brand: "KitchenMaster",
                tags: ["cookware", "stainless steel", "kitchen"],
                variants: [
                    {
                        color: "Silver",
                        size: "10-Piece",
                        stock: 28,
                        sku: "KITCHEN-SET-SIL-10",
                        priceModifier: 0,
                        images: ["cookware_silver_1.jpg", "cookware_silver_2.jpg"]
                    },
                    {
                        color: "Black",
                        size: "10-Piece",
                        stock: 15,
                        sku: "KITCHEN-SET-BLK-10",
                        priceModifier: 20,
                        images: ["cookware_black_1.jpg", "cookware_black_2.jpg"]
                    }
                ],
                rating: {
                    average: 4.3,
                    count: 234
                }
            }
        ];

        await Product.insertMany(sampleProducts);
        console.log('✅ Sample data inserted successfully');
    } catch (error) {
        console.error('❌ Error inserting sample data:', error);
    }
};

// ==================== QUERY EXAMPLES ====================

const runQueries = async () => {
    console.log('\n📊 RUNNING E-COMMERCE QUERIES:\n');

    // 1. Get all products
    console.log('1. ALL PRODUCTS:');
    const allProducts = await Product.find({});
    console.log(`Total products: ${allProducts.length}`);

    // 2. Get products by category
    console.log('\n2. ELECTRONICS PRODUCTS:');
    const electronics = await Product.findByCategory('Electronics');
    electronics.forEach(p => console.log(`- ${p.name} (${p.brand}) - $${p.basePrice}`));

    // 3. Get products with low stock
    console.log('\n3. LOW STOCK PRODUCTS (≤ 10 units):');
    const lowStock = await Product.findLowStock(10);
    lowStock.forEach(p => {
        const lowVariants = p.variants.filter(v => v.stock <= 10);
        console.log(`- ${p.name}: ${lowVariants.map(v => `${v.color} ${v.size} (${v.stock})`).join(', ')}`);
    });

    // 4. Get products with specific variant details
    console.log('\n4. PRODUCTS WITH VARIANT DETAILS (Projection):');
    const productsWithVariants = await Product.find(
        { category: 'Sports' },
        { 
            name: 1, 
            'variants.color': 1, 
            'variants.size': 1, 
            'variants.stock': 1,
            'variants.sku': 1
        }
    );
    productsWithVariants.forEach(p => {
        console.log(`- ${p.name}:`);
        p.variants.forEach(v => {
            console.log(`  * ${v.color} ${v.size} - Stock: ${v.stock} (SKU: ${v.sku})`);
        });
    });

    // 5. Find products with specific variant color
    console.log('\n5. PRODUCTS WITH BLACK VARIANTS:');
    const blackVariants = await Product.find({
        'variants.color': /black/i,
        'variants.stock': { $gt: 0 }
    });
    blackVariants.forEach(p => {
        const blackStock = p.variants
            .filter(v => v.color.toLowerCase().includes('black') && v.stock > 0)
            .map(v => `${v.size} (${v.stock})`)
            .join(', ');
        console.log(`- ${p.name}: ${blackStock}`);
    });

    // 6. Aggregate: Average price by category
    console.log('\n6. AVERAGE PRICE BY CATEGORY:');
    const avgPriceByCategory = await Product.aggregate([
        { $group: { 
            _id: '$category', 
            avgPrice: { $avg: '$basePrice' },
            productCount: { $sum: 1 }
        }},
        { $sort: { avgPrice: -1 } }
    ]);
    avgPriceByCategory.forEach(cat => {
        console.log(`- ${cat._id}: $${cat.avgPrice.toFixed(2)} (${cat.productCount} products)`);
    });

    // 7. Find products with total stock > 50
    console.log('\n7. PRODUCTS WITH HIGH TOTAL STOCK (> 50 units):');
    const highStockProducts = await Product.aggregate([
        {
            $addFields: {
                totalStock: { $sum: '$variants.stock' }
            }
        },
        {
            $match: {
                totalStock: { $gt: 50 }
            }
        },
        {
            $project: {
                name: 1,
                category: 1,
                totalStock: 1,
                variants: {
                    $filter: {
                        input: '$variants',
                        as: 'variant',
                        cond: { $gt: ['$$variant.stock', 0] }
                    }
                }
            }
        }
    ]);
    highStockProducts.forEach(p => {
        console.log(`- ${p.name} (${p.category}): ${p.totalStock} total units`);
    });

    // 8. Update variant stock
    console.log('\n8. UPDATING STOCK FOR A VARIANT:');
    const updateResult = await Product.updateOne(
        { 'variants.sku': 'NIKE-AM270-BW-9' },
        { $set: { 'variants.$.stock': 40 } }
    );
    console.log(`Stock updated: ${updateResult.modifiedCount} document(s)`);

    // 9. Using virtual field
    console.log('\n9. PRODUCTS WITH VIRTUAL TOTAL STOCK:');
    const productsWithVirtualStock = await Product.find({}).limit(3);
    productsWithVirtualStock.forEach(p => {
        console.log(`- ${p.name}: ${p.totalStock} total units across ${p.variants.length} variants`);
    });
};

// ==================== EXPRESS ROUTES ====================

// Get all products
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find({});
        res.json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching products',
            error: error.message
        });
    }
});

// Get products by category
app.get('/api/products/category/:category', async (req, res) => {
    try {
        const products = await Product.findByCategory(req.params.category);
        res.json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching products by category',
            error: error.message
        });
    }
});

// Get product by ID with variants
app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching product',
            error: error.message
        });
    }
});

// Get low stock products
app.get('/api/products/alert/low-stock', async (req, res) => {
    try {
        const threshold = parseInt(req.query.threshold) || 10;
        const products = await Product.findLowStock(threshold);
        res.json({
            success: true,
            threshold,
            count: products.length,
            data: products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching low stock products',
            error: error.message
        });
    }
});

// Home route
app.get('/', (req, res) => {
    res.json({
        message: '🛍️ E-commerce Catalog API',
        endpoints: {
            'GET /api/products': 'Get all products',
            'GET /api/products/category/:category': 'Get products by category',
            'GET /api/products/:id': 'Get product by ID',
            'GET /api/products/alert/low-stock': 'Get low stock products'
        },
        features: 'Nested document structure with variants, stock management, and advanced queries'
    });
});

// ==================== START SERVER ====================

const PORT = 3000;

app.listen(PORT, async () => {
    console.log(`🚀 E-commerce Server running on port ${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}`);
    
    // Insert sample data and run queries
    await insertSampleData();
    await runQueries();
});

module.exports = { Product, variantSchema };