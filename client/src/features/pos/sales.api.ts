import { apiClient } from "@/api/client";
import { ApiSuccessResponse } from "@/types/api";
import { CreateSaleInput } from "@pos/shared";

export interface SaleItemResult {
  id: string;
  productName: string;
  productBrand: string;
  imei: string | null;
  serialNumber: string | null;
  quantity: number;
  unitPrice: string;
  total: string;
}

export interface SaleResult {
  id: string;
  reference: string;
  customerName: string | null;
  paymentMethod: "PAYDUNYA" | "ESPECES" | "NEGOCIE";
  subtotal: string;
  discount: string;
  total: string;
  montantRecu: string | null;
  monnaieARendre: string | null;
  prixOriginal: string | null;
  prixNegocie: string | null;
  paydunyaInvoiceUrl?: string | null;
  paydunyaQrCodeData?: string | null;
  paydunyaReference?: string | null;
  negotiatedPaymentMethod?: "ESPECES" | "PAYDUNYA" | null;
  status: "PENDING" | "PAID" | "FAILED" | "CANCELLED";
  createdAt: string;
  items: SaleItemResult[];
}

export const salesApi = {
  async create(input: CreateSaleInput): Promise<SaleResult> {
    const { data } = await apiClient.post<ApiSuccessResponse<SaleResult>>("/sales", input);
    return data.data;
  },

  async getById(id: string): Promise<SaleResult> {
    const { data } = await apiClient.get<ApiSuccessResponse<SaleResult>>(`/sales/${id}`);
    return data.data;
  },

  async list(): Promise<SaleResult[]> {
    const { data } = await apiClient.get<ApiSuccessResponse<SaleResult[]>>("/sales");
    return data.data;
  },
};
