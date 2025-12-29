import { prisma } from "./prisma";
import { UserPlan } from "@prisma/client";

const PLAN_LIMITS: Record<UserPlan, number | null> = {
  FREE: 3,
  SOLO: 20,
  BUSINESS: null, // null means unlimited
};

/**
 * Get or create monthly usage record for a user
 * Returns the current month's usage record
 */
export async function getOrCreateMonthlyUsage(userId: string) {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const usage = await prisma.monthlyUsage.upsert({
    where: {
      userId_yearMonth: {
        userId,
        yearMonth,
      },
    },
    update: {},
    create: {
      userId,
      yearMonth,
      createdCount: 0,
    },
  });

  return usage;
}

/**
 * Increment the created count for the current month
 */
export async function incrementMonthlyUsage(userId: string): Promise<void> {
  const usage = await getOrCreateMonthlyUsage(userId);
  
  await prisma.monthlyUsage.update({
    where: { id: usage.id },
    data: {
      createdCount: {
        increment: 1,
      },
    },
  });
}

/**
 * Enforce plan limits before creating a new agreement
 * Throws an error if the limit would be exceeded
 */
export async function enforcePlanLimits(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const limit = PLAN_LIMITS[user.plan];

  // BUSINESS plan has unlimited usage
  if (limit === null) {
    return;
  }

  const usage = await getOrCreateMonthlyUsage(userId);

  if (usage.createdCount >= limit) {
    throw new Error(
      `Plan limit reached. ${user.plan} plan allows ${limit} agreements per month. Please upgrade your plan to create more agreements.`
    );
  }
}

/**
 * Get the current usage count for a user this month
 */
export async function getCurrentUsage(userId: string): Promise<{
  count: number;
  limit: number | null;
  plan: UserPlan;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const usage = await getOrCreateMonthlyUsage(userId);
  const limit = PLAN_LIMITS[user.plan];

  return {
    count: usage.createdCount,
    limit,
    plan: user.plan,
  };
}

