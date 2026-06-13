import { create } from "zustand";

export type DiscountType = "percentage" | "fixed";
export type ConditionType = "min_qty" | "min_amount" | "none";
export type AppliesTo = "product" | "order";

export type Coupon = {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  isActive: boolean;
  conditionType: ConditionType;
  conditionValue?: number;
  expiresAt?: string;
};

export type Promotion = {
  id: string;
  name: string;
  appliesTo: AppliesTo;
  conditionType: ConditionType;
  conditionValue: number;
  discountType: DiscountType;
  discountValue: number;
  isActive: boolean;
  activeDays?: number[];
};

interface PromotionState {
  coupons: Coupon[];
  promotions: Promotion[];
  addCoupon: (coupon: Omit<Coupon, "id">) => Coupon;
  updateCoupon: (id: string, coupon: Partial<Coupon>) => void;
  deleteCoupon: (id: string) => void;
  addPromotion: (promo: Omit<Promotion, "id">) => Promotion;
  updatePromotion: (id: string, promo: Partial<Promotion>) => void;
  deletePromotion: (id: string) => void;
  checkExpirations: () => void;
}

const initialCoupons: Coupon[] = [
  { id: "1", code: "WELCOME10", discountType: "percentage", discountValue: 10, isActive: true, conditionType: "none" },
  { id: "2", code: "SAVE50", discountType: "fixed", discountValue: 50, isActive: true, conditionType: "min_amount", conditionValue: 500, expiresAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16) },
];

const initialPromotions: Promotion[] = [
  { id: "1", name: "Weekend Special", appliesTo: "order", conditionType: "min_amount", conditionValue: 499, discountType: "percentage", discountValue: 10, isActive: true },
];

export const usePromotionStore = create<PromotionState>((set) => ({
  coupons: initialCoupons,
  promotions: initialPromotions,
  checkExpirations: () => {
    set((state) => {
      const now = new Date();
      const currentDay = now.getDay();
      let changed = false;
      const newCoupons = state.coupons.map(c => {
        if (c.isActive && c.expiresAt && new Date(c.expiresAt) < now) {
          changed = true;
          return { ...c, isActive: false };
        }
        return c;
      });
      const newPromotions = state.promotions.map(p => {
        if (p.activeDays && p.activeDays.length > 0) {
          const shouldBeActive = p.activeDays.includes(currentDay);
          if (p.isActive !== shouldBeActive) {
            changed = true;
            return { ...p, isActive: shouldBeActive };
          }
        }
        return p;
      });
      if (changed) {
        return { coupons: newCoupons, promotions: newPromotions };
      }
      return state;
    });
  },
  addCoupon: (coupon) => {
    const newCoupon = { ...coupon, id: Math.random().toString(36).substring(2, 9) };
    set((state) => ({ coupons: [...state.coupons, newCoupon] }));
    return newCoupon;
  },
  updateCoupon: (id, updatedFields) => {
    set((state) => ({
      coupons: state.coupons.map((c) => (c.id === id ? { ...c, ...updatedFields } : c)),
    }));
  },
  deleteCoupon: (id) => {
    set((state) => ({
      coupons: state.coupons.filter((c) => c.id !== id),
    }));
  },
  addPromotion: (promo) => {
    const newPromo = { ...promo, id: Math.random().toString(36).substring(2, 9) };
    set((state) => ({ promotions: [...state.promotions, newPromo] }));
    return newPromo;
  },
  updatePromotion: (id, updatedFields) => {
    set((state) => ({
      promotions: state.promotions.map((p) => (p.id === id ? { ...p, ...updatedFields } : p)),
    }));
  },
  deletePromotion: (id) => {
    set((state) => ({
      promotions: state.promotions.filter((p) => p.id !== id),
    }));
  },
}));
