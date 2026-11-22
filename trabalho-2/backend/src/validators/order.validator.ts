import { z } from "zod";
import { PaymentMethod,Region } from "../domain/enums.js";
export const previewOrderSchema=z.object({region:z.enum(Region)});
export const checkoutSchema=z.object({
 region:z.enum(Region),paymentMethod:z.enum(PaymentMethod),cardId:z.string().optional(),
 deliveryAddress:z.object({postalCode:z.string().min(8).max(9),street:z.string().min(2),number:z.string().min(1),complement:z.string().optional(),neighborhood:z.string().min(2),city:z.string().min(2),state:z.string().length(2)})
});
