import Product from "../models/Product.js";
import MasterProduct from "../models/MasterProduct.js";

/**
 * CREATE PRODUCT (MANUAL / QUICK ADD)
 */
/**
 * CREATE PRODUCT (MANUAL / QUICK ADD)
 */
export async function createProduct(req, res) {
  try {
    const shopId = req.user._id;

    let {
      name,
      barcode,
      category,
      size,
      price,
      quantity,
      expiryDate,
      isBarcodeListed = true,
    } = req.body;

    // 🔴 REQUIRED FIELDS
    if (!name || !price?.sellingPrice) {
      return res.status(400).json({
        message: "Product name and selling price are required",
      });
    }

    // 🔴 BARCODE REQUIRED (NEW)
    if (!barcode || typeof barcode !== "string" || barcode.trim() === "") {
      return res.status(400).json({
        message: "Barcode is required",
      });
    }

    const product = await Product.create({
      shopId,
      name,
      barcode: barcode.trim(), // ✅ store clean barcode
      isBarcodeListed,
      category,
      size,
      price,
      quantity,
      expiryDate,
      isFromMaster: false,
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    console.error("Create Product Error:", error);

    // duplicate barcode protection
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Product with this barcode already exists",
      });
    }

    res.status(500).json({ message: "Internal Server Error" });
  }
}

/**
 * GET ALL PRODUCTS
 */
export async function getProducts(req, res) {
  try {
    const shopId = req.user._id;

    const products = await Product.find({
      shopId,
      isActive: true,
    }).sort({ updatedAt: -1 });

    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error("Get Products Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

/**
 * 🔥 GET PRODUCT BY BARCODE (SMART SCAN)
 * Barcode items ONLY
 */
export async function getProductByBarcode(req, res) {
  try {
    const shopId = req.user._id;
    const { barcode } = req.params;

    if (!barcode) {
      return res.status(400).json({
        message: "Barcode is required",
      });
    }

    // 1️⃣ Check shop products first
    let product = await Product.findOne({
      shopId,
      barcode,
      isBarcodeListed: true,
      isActive: true,
    });

    if (product) {
      return res.status(200).json({
        success: true,
        product,
        source: "SHOP",
      });
    }

    // 2️⃣ Check master catalog
    const masterProduct = await MasterProduct.findOne({ barcode });

    if (!masterProduct) {
      return res.status(404).json({
        message: "Product not found",
        source: "NONE",
      });
    }

    // 3️⃣ Auto-create shop product from master
    product = await Product.create({
      shopId,
      name: masterProduct.name,
      barcode: masterProduct.barcode,
      isBarcodeListed: true,
      category: masterProduct.category,
      size: masterProduct.size,
      price: {
        sellingPrice: masterProduct.mrp,
        mrp: masterProduct.mrp,
      },
      quantity: 0,
      expiryDate: null,
      isFromMaster: true,
    });

    return res.status(200).json({
      success: true,
      product,
      source: "MASTER",
    });
  } catch (error) {
    console.error("Barcode Lookup Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

/**
 * GET PRODUCT BY ID
 */
export async function getProductById(req, res) {
  try {
    const shopId = req.user._id;
    const { productId } = req.params;

    const product = await Product.findOne({
      _id: productId,
      shopId,
      isActive: true,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error("Get Product Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

/**
 * UPDATE PRODUCT
 */
export async function updateProduct(req, res) {
  try {
    const shopId = req.user._id;
    const { productId } = req.params;

    const updateData = { ...req.body };

    // 🔒 BARCODE VALIDATION (IMPORTANT)
    if ("barcode" in updateData) {
      if (
        typeof updateData.barcode !== "string" ||
        updateData.barcode.trim() === ""
      ) {
        return res.status(400).json({
          message: "Barcode is required and cannot be removed",
        });
      }

      // clean barcode
      updateData.barcode = updateData.barcode.trim();
    }

    const product = await Product.findOneAndUpdate(
      { _id: productId, shopId },
      updateData,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error("Update Product Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Product with this barcode already exists",
      });
    }

    res.status(500).json({ message: "Internal Server Error" });
  }
}


/**
 * DELETE PRODUCT (HARD DELETE)
 */
export async function deleteProduct(req, res) {
  try {
    const shopId = req.user._id;
    const { productId } = req.params;

    const product = await Product.findOneAndDelete({
      _id: productId,
      shopId,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      success: true,
      message: "Product permanently deleted",
    });
  } catch (error) {
    console.error("Delete Product Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
