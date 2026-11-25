import { env } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import app from "./app.js";
import { OrderService } from "./services/order.service.js";
async function bootstrap() {
  await connectDatabase();
  const server = app.listen(env.PORT, () =>
    console.log(`API em http://localhost:${env.PORT}/api`),
  );
  const service = new OrderService();
  let running = false;
  const job = setInterval(() => {
    if (running) return;
    running = true;
    service
      .processOrders()
      .catch((err) => console.error("Falha na rotina de pedidos:", err))
      .finally(() => {
        running = false;
      });
  }, env.ORDER_JOB_INTERVAL_MS);
  const shutdown = () => {
    clearInterval(job);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
bootstrap().catch((err) => {
  console.error("Falha ao iniciar:", err);
  process.exit(1);
});
