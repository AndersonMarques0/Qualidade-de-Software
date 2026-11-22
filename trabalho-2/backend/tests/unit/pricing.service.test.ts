import {describe,expect,it} from "vitest";
import {calculatePricing,getCustomerProfile} from "../../src/domain/services/pricing.service.js";
import {CustomerProfile,Region} from "../../src/domain/enums.js";
describe("RN01 - perfil do cliente",()=>{
 it("não dá desconto antes de 1 ano",()=>expect(getCustomerProfile(.9)).toEqual({profile:CustomerProfile.NONE,discountRate:0}));
 it("aplica bronze entre 1 e menos de 3 anos",()=>expect(getCustomerProfile(2)).toEqual({profile:CustomerProfile.BRONZE,discountRate:.03}));
 it("aplica prata de 3 até 5 anos",()=>expect(getCustomerProfile(3)).toEqual({profile:CustomerProfile.SILVER,discountRate:.05}));
 it("aplica ouro acima de 5 anos",()=>expect(getCustomerProfile(5.1)).toEqual({profile:CustomerProfile.GOLD,discountRate:.10}));
});
describe("RN01 e RN02 - cálculo de valores",()=>{
 it("calcula desconto e frete do Sudeste",()=>expect(calculatePricing({subtotal:100,yearsAsCustomer:2,region:Region.SOUTHEAST})).toMatchObject({discount:3,shipping:5,total:102}));
 it("calcula desconto prata e frete de outras regiões",()=>expect(calculatePricing({subtotal:200,yearsAsCustomer:4,region:Region.OTHER})).toMatchObject({discount:10,shipping:20,total:210}));
 it("rejeita subtotal negativo",()=>expect(()=>calculatePricing({subtotal:-1,yearsAsCustomer:2,region:Region.OTHER})).toThrow());
});
