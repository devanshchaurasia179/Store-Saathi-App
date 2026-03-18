import Member from "../models/Member.js";
import Subscription from "../models/Subscription.js";

/* ================= CREATE CUSTOMER ================= */
export async function createCustomer(req, res) {
  try {
    const { name, phone, email, address } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Name required",
      });
    }

    // ✅ Prevent duplicate
    const existing = await Member.findOne({ phone });
    if (existing) {
      return res.status(400).json({
        message: "Member already exists with this phone",
      });
    }

    const member = await Member.create({
      name,
      phone,
      email,
      address,
    });

    res.status(201).json({ success: true, member });

  } catch (error) {
    console.error("Create Member Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

/* ================= GET ALL CUSTOMERS ================= */
export async function getAllCustomers(req, res) {
  try {
    const members = await Member.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      members,
    });

  } catch (error) {
    res.status(500).json({ message: "Failed to fetch customers" });
  }
}

/* ================= GET SINGLE CUSTOMER ================= */
export async function getCustomer(req, res) {
  try {
    const { id } = req.params;

    const member = await Member.findById(id);

    if (!member) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // ✅ FIXED
    res.status(200).json({ success: true, member });

  } catch (error) {
    res.status(500).json({ message: "Failed to fetch customer" });
  }
}

/* ================= UPDATE CUSTOMER ================= */
export async function updateCustomer(req, res) {
  try {
    const { id } = req.params;

    const updated = await Member.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json({ success: true, member: updated });

  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
}

/* ================= DELETE CUSTOMER (HARD DELETE) ================= */
export async function deleteCustomer(req, res) {
  try {
    const { id } = req.params;

    // ✅ Check if customer exists
    const member = await Member.findById(id);
    if (!member) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // ✅ Delete all related subscriptions first
    await Subscription.deleteMany({ member: id });

    // ✅ FIXED: use Member model
    await Member.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Customer and related subscriptions deleted permanently",
    });

  } catch (error) {
    console.error("Delete Customer Error:", error);
    res.status(500).json({ message: "Delete failed" });
  }
}