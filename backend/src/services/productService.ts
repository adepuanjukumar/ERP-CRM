import {
  createProduct,
  findProductById,
  findProductBySku,
  findProducts,
  updateProduct,
  FindProductsResult,
} from '../models/productModel';
import {
  Product,
  CreateProductInput,
  UpdateProductInput,
  ProductQueryParams,
} from '../types';

export const addProductService = async (input: CreateProductInput): Promise<Product> => {
  // Check unique SKU constraint
  const existingSku = await findProductBySku(input.sku);
  if (existingSku) {
    const error: any = new Error(`DUPLICATE_SKU: A product with SKU '${input.sku.toUpperCase()}' already exists.`);
    error.statusCode = 409;
    throw error;
  }

  return await createProduct(input);
};

export const getProductByIdService = async (id: string): Promise<Product> => {
  const product = await findProductById(id);
  if (!product) {
    const error: any = new Error(`PRODUCT_NOT_FOUND: Product with ID '${id}' was not found.`);
    error.statusCode = 404;
    throw error;
  }
  return product;
};

export const getProductsService = async (
  params: ProductQueryParams
): Promise<FindProductsResult> => {
  return await findProducts(params);
};

export const updateProductService = async (
  id: string,
  input: UpdateProductInput
): Promise<Product> => {
  // If SKU is being updated, check for SKU collision
  if (input.sku) {
    const existingSku = await findProductBySku(input.sku);
    if (existingSku && existingSku.id !== id) {
      const error: any = new Error(`DUPLICATE_SKU: Another product already uses SKU '${input.sku.toUpperCase()}'.`);
      error.statusCode = 409;
      throw error;
    }
  }

  const updatedProduct = await updateProduct(id, input);
  if (!updatedProduct) {
    const error: any = new Error(`PRODUCT_NOT_FOUND: Product with ID '${id}' was not found.`);
    error.statusCode = 404;
    throw error;
  }

  return updatedProduct;
};
