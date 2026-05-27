import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatRupee } from "../../utils/formatCurrency";

interface Product {
  _id: string;
  name: string;
  price?: { sellingPrice: number };
  sellingPrice?: number;
  stock?: number;
  unit?: string;
}

interface ProductsGridProps {
  products: Product[];
  onProductPress: (product: Product) => void;
  onSearchPress: () => void;
  onAddProductPress: () => void;
}

export default function ProductsGrid({
  products,
  onProductPress,
  onSearchPress,
  onAddProductPress,
}: ProductsGridProps) {
  return (
    <View style={styles.productsSection}>
      <TouchableOpacity
        style={styles.searchProductBtn}
        onPress={onSearchPress}
      >
        <Text style={styles.searchProductBtnText}>Add Products +</Text>
      </TouchableOpacity>
      
      <ScrollView 
        style={styles.productsGrid}
        showsVerticalScrollIndicator={false}
      >
        {products.length === 0 ? (
          <View style={styles.emptyProducts}>
            <Ionicons name="cube-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyProductsText}>No products available</Text>
            <TouchableOpacity
              style={styles.addProductBtn}
              onPress={onAddProductPress}
            >
              <Text style={styles.addProductBtnText}>Add Product</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.productsGridContainer}>
            {products.map((product) => (
              <TouchableOpacity
                key={product._id}
                style={styles.productCard}
                onPress={() => onProductPress(product)}
              >
                <View style={styles.productCardContent}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <Text style={styles.productPrice}>
                    {formatRupee(product.price?.sellingPrice || product.sellingPrice || 0)}
                  </Text>
                  {product.stock !== undefined && (
                    <Text style={styles.productStock}>
                      Stock: {product.stock} {product.unit || 'units'}
                    </Text>
                  )}
                </View>
                <View style={styles.addIconBadge}>
                  <Ionicons name="add" size={16} color="#fff" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  productsSection: {
    maxHeight: '35%',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
    alignItems: 'center',
  },
  productsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    display: 'none',
  },
  productsSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    display: 'none',
  },
  searchProductBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 4,
    width: '90%',
    marginHorizontal: 12,
    marginVertical: 12,
  },
  searchProductBtnText: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  productsGrid: {
    flex: 1,
  },
  productsGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 10,
  },
  productCard: {
    width: '31%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    position: 'relative',
    minHeight: 100,
  },
  productCardContent: {
    flex: 1,
  },
  productName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
    minHeight: 32,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563eb',
    marginBottom: 4,
  },
  productStock: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '600',
  },
  addIconBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyProducts: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyProductsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 12,
    marginBottom: 16,
  },
  addProductBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addProductBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
