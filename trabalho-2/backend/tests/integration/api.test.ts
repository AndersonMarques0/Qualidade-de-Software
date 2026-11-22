import {afterAll,beforeAll,describe,expect,it} from "vitest";
import mongoose from "mongoose";
import {MongoMemoryServer} from "mongodb-memory-server";
import request from "supertest";
import app from "../../src/app.js";
let mongo:MongoMemoryServer;
beforeAll(async()=>{mongo=await MongoMemoryServer.create();await mongoose.connect(mongo.getUri());});
afterAll(async()=>{await mongoose.disconnect();await mongo.stop();});
describe("API",()=>{
 it("retorna health check",async()=>{const r=await request(app).get("/api/health");expect(r.status).toBe(200);expect(r.body.status).toBe("ok");});
 it("cadastra e autentica cliente",async()=>{
  const email=`test-${Date.now()}@example.com`;
  const created=await request(app).post("/api/auth/register").send({name:"Teste Cliente",email,password:"senha12345"});
  expect(created.status).toBe(201);
  const login=await request(app).post("/api/auth/login").send({email,password:"senha12345"});
  expect(login.status).toBe(200);expect(login.body.token).toBeTypeOf("string");
 });
 it("protege carrinho contra acesso sem token",async()=>{const r=await request(app).get("/api/cart");expect(r.status).toBe(401);});
});
