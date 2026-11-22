import { OrderStatus } from "../enums.js";
import { AppError } from "../errors/app-error.js";
const transitions: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.CREATED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [OrderStatus.FINISHED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.FINISHED]: [],
};
export function assertOrderTransition(
  current: OrderStatus,
  next: OrderStatus,
): void {
  if (!transitions[current].includes(next))
    throw new AppError(`Transição inválida: ${current} -> ${next}`, 409);
}
