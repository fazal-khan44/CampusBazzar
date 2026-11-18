const Product = require('../models/Product');
const { isValidCampus, isValidHostel } = require('../utils/nitpLocations');

// @desc    Get all products (with search, location filtering & relevance sorting)
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    const {
      keyword,
      category,
      condition,
      minPrice,
      maxPrice,
      status,
      campus,
      hostel,
      buyerCampus,
      buyerHostel,
      quickFilter,
    } = req.query;

    let query = {};

    if (keyword) {
      query.$text = { $search: keyword };
    }

    if (category && category !== 'All') {
      // Support matching clean modern categories with legacy aliases
      if (category === 'Bottles' || category === 'Bottles & Sippers') {
        query.category = { $in: ['Bottles', 'Bottles & Sippers'] };
      } else if (category === 'Food & Snacks' || category === 'Food & Munchies' || category === 'Food & Snack') {
        query.category = { $in: ['Food & Snacks', 'Food & Munchies', 'Food & Snack'] };
      } else if (category === 'Stationery' || category === 'Stationery & Accessories' || category === 'Stationery & Small Accessories') {
        query.category = { $in: ['Stationery', 'Stationery & Accessories', 'Stationery & Small Accessories'] };
      } else if (category === 'Electronics' || category === 'Electronics & Cables') {
        query.category = { $in: ['Electronics', 'Electronics & Cables'] };
      } else if (category === 'Appliances' || category === 'Hostel Appliances') {
        query.category = { $in: ['Appliances', 'Hostel Appliances'] };
      } else if (category === 'Cycles' || category === 'Cycles & Mobility') {
        query.category = { $in: ['Cycles', 'Cycles & Mobility'] };
      } else if (category === 'Clothing' || category === 'Clothing & Lab Coats') {
        query.category = { $in: ['Clothing', 'Clothing & Lab Coats'] };
      } else if (category === 'Notes' || category === 'Notes & Study Material') {
        query.category = { $in: ['Notes', 'Notes & Study Material'] };
      } else if (category === 'Sports & Gym Accessories' || category === 'Sports & Gym' || category === 'Sports') {
        query.category = { $in: ['Sports & Gym Accessories', 'Sports & Gym', 'Sports', 'Gym Accessories'] };
      } else if (category === 'Others') {
        const standardCategories = [
          'Books',
          'Notes',
          'Notes & Study Material',
          'Food & Snacks',
          'Food & Munchies',
          'Food & Snack',
          'Bottles',
          'Bottles & Sippers',
          'Electronics',
          'Electronics & Cables',
          'Stationery',
          'Stationery & Accessories',
          'Stationery & Small Accessories',
          'Sports & Gym Accessories',
          'Sports & Gym',
          'Sports',
          'Gym Accessories',
          'Appliances',
          'Hostel Appliances',
          'Cycles',
          'Cycles & Mobility',
          'Clothing',
          'Clothing & Lab Coats',
        ];
        query.category = { $nin: standardCategories };
      } else {
        query.category = category;
      }
    }

    if (condition && condition !== 'All') {
      query.condition = condition;
    }

    if (status) {
      query.status = status;
    } else {
      query.status = { $ne: 'Sold' };
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Quick filter handling: 'my-hostel', 'my-campus', 'other-hostels', 'all'
    if (quickFilter === 'my-hostel' && buyerHostel) {
      query.$or = [{ hostel: buyerHostel }, { hostelName: buyerHostel }];
    } else if (quickFilter === 'my-campus' && buyerCampus) {
      query.campus = buyerCampus;
    } else if (quickFilter === 'other-hostels' && buyerHostel) {
      query.$and = [
        { hostel: { $ne: buyerHostel } },
        { hostelName: { $ne: buyerHostel } },
      ];
    } else {
      // Standard dropdown filters
      if (campus && campus !== 'All') {
        query.campus = campus;
      }

      if (hostel && hostel !== 'All') {
        query.$or = [{ hostel: hostel }, { hostelName: hostel }];
      }
    }

    let products = await Product.find(query)
      .populate('seller', 'name campus hostel hostelName roomNumber avatar phoneNumber email')
      .sort({ createdAt: -1 });

    // Location-based relevance sorting if buyer's location is known
    // 1. Products available in buyer's own hostel
    // 2. Products available in other hostels of buyer's campus
    // 3. Products in other campus
    if (buyerHostel || buyerCampus) {
      products = products.sort((a, b) => {
        const aHostel = a.hostel || a.hostelName;
        const bHostel = b.hostel || b.hostelName;
        const aCampus = a.campus;
        const bCampus = b.campus;

        const getScore = (itemCampus, itemHostel) => {
          if (buyerHostel && itemHostel === buyerHostel) return 1; // Top priority
          if (buyerCampus && itemCampus === buyerCampus) return 2; // Same campus
          return 3; // Other campus
        };

        const scoreA = getScore(aCampus, aHostel);
        const scoreB = getScore(bCampus, bHostel);

        if (scoreA !== scoreB) {
          return scoreA - scoreB;
        }

        // Maintain newest secondary order
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    }

    res.json(products);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      'seller',
      'name campus hostel hostelName roomNumber avatar phoneNumber email isEmailVerified isPhoneVerified'
    );

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Create a product listing
// @route   POST /api/products
// @access  Private
const createProduct = async (req, res, next) => {
  try {
    const {
      title,
      description,
      price,
      category,
      condition,
      images,
      campus,
      hostel,
      hostelName,
      roomNumber,
      contactNumber,
      pickupLocation,
    } = req.body;

    if (!title || !description || price === undefined || !category) {
      return res.status(400).json({ message: 'Title, description, price and category are required' });
    }

    const resolvedCampus = campus || req.user.campus || 'Patna Campus';
    const resolvedHostel = hostel || hostelName || req.user.hostel || req.user.hostelName;
    const resolvedRoomNumber = roomNumber || req.user.roomNumber;
    const resolvedContactNumber = contactNumber || req.user.phoneNumber;

    if (!resolvedCampus || !resolvedHostel) {
      return res.status(400).json({ message: 'Campus and Hostel are required' });
    }

    // Backend location mapping validation
    if (!isValidCampus(resolvedCampus)) {
      return res.status(400).json({ message: 'Invalid campus selected' });
    }

    if (!isValidHostel(resolvedCampus, resolvedHostel)) {
      return res.status(400).json({
        message: `Invalid hostel "${resolvedHostel}" for ${resolvedCampus}`,
      });
    }

    if (!resolvedRoomNumber || !resolvedContactNumber) {
      return res.status(400).json({
        message: 'Room number and contact number are required',
      });
    }

    const product = new Product({
      title,
      description,
      price,
      category,
      condition: condition || 'Gently Used',
      images: images || [],
      campus: resolvedCampus,
      hostel: resolvedHostel,
      hostelName: resolvedHostel,
      roomNumber: resolvedRoomNumber,
      contactNumber: resolvedContactNumber,
      pickupLocation: pickupLocation || `${resolvedCampus} • ${resolvedHostel} - Rm ${resolvedRoomNumber}`,
      seller: req.user._id,
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a product listing
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Verify ownership
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to modify this listing' });
    }

    const {
      title,
      description,
      price,
      category,
      condition,
      images,
      campus,
      hostel,
      hostelName,
      roomNumber,
      contactNumber,
      pickupLocation,
      status,
    } = req.body;

    const targetCampus = campus || product.campus;
    const targetHostel = hostel || hostelName || product.hostel || product.hostelName;

    if (targetCampus && !isValidCampus(targetCampus)) {
      return res.status(400).json({ message: 'Invalid campus specified' });
    }

    if (targetCampus && targetHostel && !isValidHostel(targetCampus, targetHostel)) {
      return res.status(400).json({
        message: `Hostel "${targetHostel}" does not belong to ${targetCampus}`,
      });
    }

    if (title) product.title = title;
    if (description) product.description = description;
    if (price !== undefined) product.price = price;
    if (category) product.category = category;
    if (condition) product.condition = condition;
    if (images) product.images = images;
    if (targetCampus) product.campus = targetCampus;
    if (targetHostel) {
      product.hostel = targetHostel;
      product.hostelName = targetHostel;
    }
    if (roomNumber) product.roomNumber = roomNumber;
    if (contactNumber) product.contactNumber = contactNumber;
    if (pickupLocation !== undefined) product.pickupLocation = pickupLocation;
    if (status) product.status = status;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a product listing
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this listing' });
    }

    await Product.deleteOne({ _id: req.params.id });
    res.json({ message: 'Listing removed successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get listings by current logged-in user
// @route   GET /api/products/my-listings
// @access  Private
const getMyListings = async (req, res, next) => {
  try {
    const products = await Product.find({ seller: req.user._id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyListings,
};
