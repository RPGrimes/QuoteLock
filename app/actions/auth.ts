"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  businessName: z.string().min(1, "Business name is required").max(255).optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function signup(formData: FormData) {
  try {
    const rawData = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      businessName: formData.get("businessName") as string | null,
    };

    const validated = signupSchema.parse(rawData);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return {
        success: false,
        error: "An account with this email already exists",
      };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validated.password, 12);

    // Create user
    await prisma.user.create({
      data: {
        email: validated.email,
        passwordHash,
        businessName: validated.businessName || null,
        plan: "FREE",
      },
    });

    // Redirect to sign in page with success message
    redirect("/auth/signin?signup=success");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || "Validation error",
      };
    }
    console.error("Signup error:", error);
    return {
      success: false,
      error: "Failed to create account. Please try again.",
    };
  }
}

export async function login(formData: FormData) {
  try {
    const rawData = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    const validated = loginSchema.parse(rawData);

    // Import signIn from next-auth
    const { signIn } = await import("next-auth/react");
    
    // This will be handled client-side, so we'll return the data
    return {
      success: true,
      email: validated.email,
      password: validated.password,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || "Validation error",
      };
    }
    console.error("Login error:", error);
    return {
      success: false,
      error: "Failed to login. Please try again.",
    };
  }
}

/**
 * Dev-only: Login as a test user
 * Only works in development mode
 * Returns credentials for client-side sign in
 */
export async function devLogin() {
  if (process.env.NODE_ENV !== "development") {
    return {
      success: false,
      error: "Dev login only available in development mode",
    };
  }

  try {
    // Find or create a dev user
    let devUser = await prisma.user.findUnique({
      where: { email: "dev@quotelock.test" },
    });

    if (!devUser) {
      const passwordHash = await bcrypt.hash("dev123456", 12);
      devUser = await prisma.user.create({
        data: {
          email: "dev@quotelock.test",
          passwordHash,
          businessName: "Dev Test Business",
          plan: "BUSINESS", // Give dev user business plan for testing
        },
      });
    }

    // Return credentials for client-side sign in
    return {
      success: true,
      email: devUser.email,
      password: "dev123456",
    };
  } catch (error: any) {
    console.error("Dev login error:", error);
    
    // Check if it's a database connection error
    if (error?.code === "P1001" || error?.message?.includes("connect")) {
      return {
        success: false,
        error: "Database not connected. Please set up your DATABASE_URL in .env and run migrations.",
      };
    }
    
    // Check if tables don't exist
    if (error?.code === "P2021" || error?.message?.includes("does not exist")) {
      return {
        success: false,
        error: "Database tables not found. Please run: npx prisma migrate dev",
      };
    }

    return {
      success: false,
      error: error?.message || "Failed to create dev user. Check database connection.",
    };
  }
}

