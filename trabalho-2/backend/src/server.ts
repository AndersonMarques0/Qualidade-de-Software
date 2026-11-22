import {env} from "./config/env.js";
import {connectDatabase,disconnectDatabase} from "./config/database.js";
import app from "./app.js";
import {OrderService} from "./services/order.service.js";
async function bootstrap(){
 await connectDatabase();
 const server=app.listen(env.PORT,()=>console.log(`API em http://localhost:${env.PORT}/api`));
 const service=new OrderService();
 const job=setInterval(()=>{void service.cancelExpired().catch(err=>console.error("Falha no cancelamento automático:",err));},60_000);
 const shutdown=()=>{clearInterval(job);server.close(async()=>{await disconnectDatabase();process.exit(0);});};
 process.on("SIGINT",shutdown);process.on("SIGTERM",shutdown);
}
bootstrap().catch(err=>{console.error("Falha ao iniciar:",err);process.exit(1);});
