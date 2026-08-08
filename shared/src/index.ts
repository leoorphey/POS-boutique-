// Point d'entrée du package @pos/shared
// Les schémas Zod et types seront ajoutés progressivement
// au fil des phases (Produits, Catégories, Ventes, Paiements, Auth)

import enums = require("./types/enums");
import categorySchema = require("./schemas/category.schema");
import authSchema = require("./schemas/auth.schema");
import productSchema = require("./schemas/product.schema");
import saleSchema = require("./schemas/sale.schema");

export const Role = enums.Role;
export const PaymentMethod = enums.PaymentMethod;
export const SaleStatus = enums.SaleStatus;
export const StockMovementType = enums.StockMovementType;

export const createCategorySchema = categorySchema.createCategorySchema;
export const updateCategorySchema = categorySchema.updateCategorySchema;
export const categoryIdParamSchema = categorySchema.categoryIdParamSchema;
export type CreateCategoryInput = categorySchema.CreateCategoryInput;
export type UpdateCategoryInput = categorySchema.UpdateCategoryInput;

export const loginSchema = authSchema.loginSchema;
export const refreshSchema = authSchema.refreshSchema;
export const forgotPasswordSchema = authSchema.forgotPasswordSchema;
export const resetPasswordTokenSchema = authSchema.resetPasswordTokenSchema;
export const resetPasswordSchema = authSchema.resetPasswordSchema;
export const createUserSchema = authSchema.createUserSchema;
export const updateUserSchema = authSchema.updateUserSchema;
export type LoginInput = authSchema.LoginInput;
export type RefreshInput = authSchema.RefreshInput;
export type ForgotPasswordInput = authSchema.ForgotPasswordInput;
export type ResetPasswordInput = authSchema.ResetPasswordInput;
export type CreateUserInput = authSchema.CreateUserInput;
export type UpdateUserInput = authSchema.UpdateUserInput;

export const createProductSchema = productSchema.createProductSchema;
export const updateProductSchema = productSchema.updateProductSchema;
export const productQuerySchema = productSchema.productQuerySchema;
export const productIdParamSchema = productSchema.productIdParamSchema;
export type CreateProductInput = productSchema.CreateProductInput;
export type UpdateProductInput = productSchema.UpdateProductInput;
export type ProductQueryInput = productSchema.ProductQueryInput;

export const saleItemInputSchema = saleSchema.saleItemInputSchema;
export const createSaleBaseSchema = saleSchema.createSaleBaseSchema;
export const createCashSaleSchema = saleSchema.createCashSaleSchema;
export const createNegotiatedSaleSchema = saleSchema.createNegotiatedSaleSchema;
export const createPaydunyaSaleSchema = saleSchema.createPaydunyaSaleSchema;
export const createSaleSchema = saleSchema.createSaleSchema;
export const waveWebhookSchema = saleSchema.waveWebhookSchema;
export const saleIdParamSchema = saleSchema.saleIdParamSchema;
export type SaleItemInput = saleSchema.SaleItemInput;
export type CreateSaleInput = saleSchema.CreateSaleInput;
export type WaveWebhookInput = saleSchema.WaveWebhookInput;
