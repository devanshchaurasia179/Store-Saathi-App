export const formatRupee = (amount = 0) => {
  return `₹${amount.toLocaleString("en-IN")}`;
};
