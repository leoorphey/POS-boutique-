import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { createInvoice } from "@/services/paydunya.client";

vi.mock("axios", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

const mockedAxios = vi.mocked(axios, true);

describe("paydunya.client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("envoie la clé master et lève une erreur quand PayDunya retourne un échec", async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        response_code: "4000",
        response_text: "Your request was malformed. MASTER_KEY, PRIVATE_KEY or TOKEN is missing.",
      },
    });

    await expect(
      createInvoice({
        amount: 1000,
        description: "Test",
        callbackUrl: "https://example.com/callback",
        cancelUrl: "https://example.com/cancel",
        returnUrl: "https://example.com/success",
      })
    ).rejects.toThrow(/PayDunya/i);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining("/checkout-invoice/create"),
      expect.objectContaining({
        invoice: expect.objectContaining({
          total_amount: 1000,
        }),
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "PAYDUNYA-MASTER-KEY": expect.any(String),
        }),
      })
    );
  });
});
