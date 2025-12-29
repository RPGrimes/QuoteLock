"use server";

import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSettingsSchema = z.object({
  businessName: z.string().min(1, "Business name is required").max(255).optional(),
  country: z.string().max(100).optional(),
  defaultCurrency: z.string().length(3, "Currency must be 3 characters").optional(),
  defaultBankDetails: z.string().max(5000).optional(),
});

export async function updateSettings(formData: FormData) {
  try {
    const user = await requireAuth();

    const rawData = {
      businessName: formData.get("businessName") as string | null,
      country: formData.get("country") as string | null,
      defaultCurrency: formData.get("defaultCurrency") as string | null,
      defaultBankDetails: formData.get("defaultBankDetails") as string | null,
    };

    // Validate
    const validated = updateSettingsSchema.parse({
      businessName: rawData.businessName || undefined,
      country: rawData.country || undefined,
      defaultCurrency: rawData.defaultCurrency || undefined,
      defaultBankDetails: rawData.defaultBankDetails || undefined,
    });

    // Update user settings
    await prisma.user.update({
      where: { id: user.id },
      data: {
        businessName: validated.businessName || null,
        country: validated.country || null,
        defaultCurrency: validated.defaultCurrency || null,
        defaultBankDetails: validated.defaultBankDetails || null,
      },
    });

    return {
      success: true,
      message: "Settings updated successfully",
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || "Validation error",
      };
    }
    console.error("Settings update error:", error);
    return {
      success: false,
      error: "Failed to update settings. Please try again.",
    };
  }
}

