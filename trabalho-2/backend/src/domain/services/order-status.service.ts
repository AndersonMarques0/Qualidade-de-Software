import { OrderStatus } from "../enums.js";
import { AppError } from "../errors/app-error.js";
const transitions: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.CREATED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [OrderStatus.FINISHED],
  // Pedido cancelado também termina em FINISHED (estado final do caso de uso).
  [OrderStatus.CANCELLED]: [OrderStatus.FINISHED],
  [OrderStatus.FINISHED]: [],
};
export function assertOrderTransition(
  current: OrderStatus,
  next: OrderStatus,
): void {
  if (!transitions[current].includes(next))
    throw new AppError(`Transição inválida: ${current} -> ${next}`, 409);
}
// Avanço automático. A ordem vai do estado mais avançado para o menos avançado,
// assim cada pedido anda apenas UM passo por execução da rotina.
export const AUTO_ADVANCE_STEPS: ReadonlyArray<readonly [OrderStatus, OrderStatus]> = [
  [OrderStatus.DELIVERED, OrderStatus.FINISHED],
  [OrderStatus.CANCELLED, OrderStatus.FINISHED],
  [OrderStatus.CONFIRMED, OrderStatus.DELIVERED],
];
