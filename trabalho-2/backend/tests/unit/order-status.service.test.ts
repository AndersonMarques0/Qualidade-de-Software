import {describe,expect,it} from "vitest";
import {assertOrderTransition} from "../../src/domain/services/order-status.service.js";
import {OrderStatus} from "../../src/domain/enums.js";
describe("RN04 - transições de status",()=>{
 it("permite criado para processamento",()=>expect(()=>assertOrderTransition(OrderStatus.CREATED,OrderStatus.PROCESSING)).not.toThrow());
 it("permite entregue para finalizado",()=>expect(()=>assertOrderTransition(OrderStatus.DELIVERED,OrderStatus.FINISHED)).not.toThrow());
 it("impede reativar pedido cancelado",()=>expect(()=>assertOrderTransition(OrderStatus.CANCELLED,OrderStatus.CONFIRMED)).toThrow());
});
