import { create } from "zustand";
import api from "../lib/api";

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
  fetchCoupons: () => Promise<void>;
  fetchPromotions: () => Promise<void>;
  addCoupon: (coupon: Omit<Coupon, "id">) => Promise<Coupon>;
  updateCoupon: (id: string, coupon: Partial<Coupon>) => Promise<void>;
  deleteCoupon: (id: string) => Promise<void>;
  addPromotion: (promo: Omit<Promotion, "id">) => Promise<Promotion>;
  updatePromotion: (id: string, promo: Partial<Promotion>) => Promise<void>;
  deletePromotion: (id: string) => Promise<void>;
  checkExpirations: () => void;
}

export const usePromotionStore = create<PromotionState>((set) => ({
  coupons: [],
  promotions: [],
  fetchCoupons: async () => {
    const res = await api.get("/coupons");
    set({ coupons: res.data });
  },
  fetchPromotions: async () => {
    const res = await api.get("/promotions");
    set({ promotions: res.data });
  },
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
  addCoupon: async (coupon) => {
    const res = await api.post("/coupons", coupon);
    const newCoupon = res.data;
    set((state) => ({ coupons: [...state.coupons, newCoupon] }));
    return newCoupon;
  },
  updateCoupon: async (id, updatedFields) => {
    const current = usePromotionStore.getState().coupons.find((c) => c.id === id);
    if (!current) return;
    const merged = { ...current, ...updatedFields };
    await api.put(`/coupons/${id}`, {
      code: merged.code,
      discountType: merged.discountType,
      discountValue: merged.discountValue,
      isActive: merged.isActive,
      conditionType: merged.conditionType,
      conditionValue: merged.conditionValue ?? null,
      expiresAt: merged.expiresAt ?? null,
    });
    set((state) => ({
      coupons: state.coupons.map((c) => (c.id === id ? { ...c, ...updatedFields } : c)),
    }));
  },
  deleteCoupon: async (id) => {
    await api.delete(`/coupons/${id}`);
    set((state) => ({
      coupons: state.coupons.filter((c) => c.id !== id),
    }));
  },
  addPromotion: async (promo) => {
    const res = await api.post("/promotions", promo);
    const newPromo = res.data;
    set((state) => ({ promotions: [...state.promotions, newPromo] }));
    return newPromo;
  },
  updatePromotion: async (id, updatedFields) => {
    const current = usePromotionStore.getState().promotions.find((p) => p.id === id);
    if (!current) return;
    const merged = { ...current, ...updatedFields };
    await api.put(`/promotions/${id}`, {
      name: merged.name,
      appliesTo: merged.appliesTo,
      conditionType: merged.conditionType,
      conditionValue: merged.conditionValue,
      discountType: merged.discountType,
      discountValue: merged.discountValue,
      isActive: merged.isActive,
      activeDays: merged.activeDays ?? null,
    });
    set((state) => ({
      promotions: state.promotions.map((p) => (p.id === id ? { ...p, ...updatedFields } : p)),
    }));
  },
  deletePromotion: async (id) => {
    await api.delete(`/promotions/${id}`);
    set((state) => ({
      promotions: state.promotions.filter((p) => p.id !== id),
    }));
  },
}));
