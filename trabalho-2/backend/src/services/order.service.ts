import mongoose from "mongoose";
import { OrderStatus,PaymentMethod,PaymentStatus,Region } from "../domain/enums.js";
import { AppError } from "../domain/errors/app-error.js";
import { calculatePricing } from "../domain/services/pricing.service.js";
import { BookRepository } from "../repositories/book.repository.js";
import { CartRepository } from "../repositories/cart.repository.js";
import { CustomerRepository } from "../repositories/customer.repository.js";
import { OrderRepository } from "../repositories/order.repository.js";
import { PaymentService } from "./payment.service.js";
import { CardService } from "./card.service.js";
const books=new BookRepository(),carts=new CartRepository(),customers=new CustomerRepository(),orders=new OrderRepository(),payments=new PaymentService(),cardsService=new CardService();
export interface CheckoutInput {
 region:Region;paymentMethod:PaymentMethod;cardId?:string;
 deliveryAddress:{postalCode:string;street:string;number:string;complement?:string;neighborhood:string;city:string;state:string};
}
export class OrderService {
 async preview(customerId:string,region:Region){
  const customer=await customers.findById(customerId);if(!customer)throw new AppError("Cliente não encontrado.",404);
  const cart=await carts.findByCustomer(customerId);if(!cart||cart.items.length===0)throw new AppError("Não é possível prosseguir com carrinho vazio.");
  const items=cart.items.map((entry:any)=>{const book=entry.bookId;if(!book)throw new AppError("Livro indisponível no carrinho.",409);return {bookId:book._id.toString(),title:book.title,unitPrice:book.price,quantity:entry.quantity,lineTotal:Number((book.price*entry.quantity).toFixed(2))};});
  const subtotal=Number(items.reduce((sum,item)=>sum+item.lineTotal,0).toFixed(2));
  const years=(Date.now()-customer.createdAt.getTime())/(365.25*24*60*60*1000);
  return {items,subtotal,...calculatePricing({subtotal,yearsAsCustomer:years,region})};
 }
 async checkout(customerId:string,input:CheckoutInput){
  if(input.paymentMethod===PaymentMethod.CREDIT_CARD){
   if(!input.cardId)throw new AppError("Informe o cartão (cardId).");
   await cardsService.assertOwned(customerId,input.cardId); // valida antes de baixar estoque
  }
  const preview=await this.preview(customerId,input.region);
  const cart=await carts.findRawByCustomer(customerId);if(!cart||cart.items.length===0)throw new AppError("Carrinho vazio.");
  // Valida e baixa estoque com atualização condicional para impedir estoque negativo.
  const decremented:string[]=[];
  for(const item of cart.items){
   const id=item.bookId.toString();
   if(!await books.decreaseStock(id,item.quantity)){
    // Compensa as baixas anteriores se algum item não puder ser reservado.
    for(const restoredId of decremented)await (await import("../models/book.model.js")).BookModel.updateOne({_id:restoredId},{$inc:{stock:cart.items.find(x=>x.bookId.toString()===restoredId)!.quantity}});
    throw new AppError("Estoque insuficiente para um ou mais livros.",409);
   }
   decremented.push(id);
  }
  const customer=await customers.findById(customerId);
  if(!customer)throw new AppError("Cliente não encontrado.",404);
  const order=await orders.create({
   customerId,items:preview.items.map(item=>({bookId:new mongoose.Types.ObjectId(item.bookId),title:item.title,unitPrice:item.unitPrice,quantity:item.quantity})),
   region:input.region,customerProfile:preview.profile,subtotal:preview.subtotal,discount:preview.discount,shipping:preview.shipping,total:preview.total,
   paymentMethod:input.paymentMethod,cardId:input.cardId,paymentStatus:PaymentStatus.PENDING,status:OrderStatus.CREATED,deliveryAddress:input.deliveryAddress
  });
  await orders.updatePayment(order.id,{status:OrderStatus.PROCESSING});
  const payment=await payments.pay({method:input.paymentMethod,amount:preview.total,customerId,cardId:input.cardId});
  const cancellationDueAt=payment.status===PaymentStatus.DECLINED?new Date(Date.now()+2*24*60*60*1000):undefined;
  const updated=await orders.updatePayment(order.id,{
   paymentStatus:payment.status,status:payment.status===PaymentStatus.APPROVED?OrderStatus.CONFIRMED:OrderStatus.PROCESSING,
   paymentReference:payment.reference,...(cancellationDueAt?{cancellationDueAt}:{})
  });
  await carts.clear(customerId);
  return {order:updated,message:payment.status===PaymentStatus.APPROVED?"Pedido confirmado com sucesso.":"Pagamento não autorizado. O pedido poderá ser cancelado após 2 dias."};
 }
 list(customerId:string){return orders.findByCustomer(customerId);}
 async get(customerId:string,id:string){
  if(!mongoose.isValidObjectId(id))throw new AppError("ID de pedido inválido.");
  const order=await orders.findByIdForCustomer(id,customerId);if(!order)throw new AppError("Pedido não encontrado.",404);return order;
 }
 async cancelExpired():Promise<number>{
  const expired=await orders.findExpired();
  let cancelled=0;
  for(const candidate of expired){
   // A atualização condicional impede que dois ciclos do job devolvam o mesmo estoque duas vezes.
   const order=await orders.cancelOneIfExpired(candidate.id);
   if(!order)continue;
   for(const item of order.items){
    await books.increaseStock(item.bookId.toString(),item.quantity);
   }
   cancelled++;
  }
  return cancelled;
 }
}
