import { PaymentMethod,PaymentStatus } from "../domain/enums.js";
import { BankService } from "./bank.service.js";
const bank=new BankService();
export interface PaymentInput {method:PaymentMethod;amount:number;customerId:string;cardId?:string}
export class PaymentService {
 // Simulação acadêmica: Pix é sempre aprovado; cartão é autorizado pelo banco emissor.
 async pay(input:PaymentInput):Promise<{status:PaymentStatus;reference:string}>{
  if(input.method===PaymentMethod.CREDIT_CARD)return bank.authorize(input.customerId,input.cardId!,input.amount);
  return {status:PaymentStatus.APPROVED,reference:`fake_${Date.now()}`};
 }
}
