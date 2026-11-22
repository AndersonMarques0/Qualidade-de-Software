import { CustomerProfile, Region } from "../enums.js";
export interface PricingInput {subtotal:number;yearsAsCustomer:number;region:Region}
export interface PricingResult {profile:CustomerProfile;discountRate:number;discount:number;shippingRate:number;shipping:number;total:number}
const money=(value:number)=>Math.round((value+Number.EPSILON)*100)/100;
export function getCustomerProfile(years:number):{profile:CustomerProfile;discountRate:number}{
 if(!Number.isFinite(years)||years<0)throw new Error("Tempo de vínculo inválido.");
 if(years<1)return {profile:CustomerProfile.NONE,discountRate:0};
 if(years<3)return {profile:CustomerProfile.BRONZE,discountRate:.03};
 if(years<=5)return {profile:CustomerProfile.SILVER,discountRate:.05};
 return {profile:CustomerProfile.GOLD,discountRate:.10};
}
export function calculatePricing(input:PricingInput):PricingResult{
 if(!Number.isFinite(input.subtotal)||input.subtotal<0)throw new Error("Subtotal inválido.");
 const {profile,discountRate}=getCustomerProfile(input.yearsAsCustomer);
 const shippingRate=input.region===Region.SOUTHEAST?.05:.10;
 const discount=money(input.subtotal*discountRate);
 const shipping=money(input.subtotal*shippingRate);
 return {profile,discountRate,discount,shippingRate,shipping,total:money(input.subtotal-discount+shipping)};
}
