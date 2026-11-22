import { OrderModel } from "../models/order.model.js";
import { OrderStatus,PaymentStatus } from "../domain/enums.js";
export class OrderRepository {
 create(data:any){return OrderModel.create(data);}
 findByCustomer(customerId:string){return OrderModel.find({customerId}).sort({createdAt:-1});}
 findByIdForCustomer(orderId:string,customerId:string){return OrderModel.findOne({_id:orderId,customerId});}
 updatePayment(orderId:string,data:Record<string,unknown>){return OrderModel.findByIdAndUpdate(orderId,data,{new:true});}
 findExpired(){return OrderModel.find({status:OrderStatus.PROCESSING,paymentStatus:PaymentStatus.DECLINED,cancellationDueAt:{$lte:new Date()}});}
 cancelOneIfExpired(orderId:string){
  return OrderModel.findOneAndUpdate(
   {_id:orderId,status:OrderStatus.PROCESSING,paymentStatus:PaymentStatus.DECLINED,cancellationDueAt:{$lte:new Date()}},
   {$set:{status:OrderStatus.CANCELLED}},
   {new:true}
  );
 }
}
