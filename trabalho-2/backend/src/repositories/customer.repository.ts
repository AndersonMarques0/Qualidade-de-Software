import { CustomerModel } from "../models/customer.model.js";
export class CustomerRepository {
 findByEmail(email:string){return CustomerModel.findOne({email}).select("+passwordHash");}
 findById(id:string){return CustomerModel.findById(id);}
 create(data:{name:string;email:string;passwordHash:string}){return CustomerModel.create(data);}
}
