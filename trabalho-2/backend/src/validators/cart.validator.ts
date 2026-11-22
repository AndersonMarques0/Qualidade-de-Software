import { z } from "zod";
export const addCartItemSchema=z.object({bookId:z.string().min(1),quantity:z.number().int().positive()});
export const updateCartItemSchema=z.object({quantity:z.number().int().positive()});
