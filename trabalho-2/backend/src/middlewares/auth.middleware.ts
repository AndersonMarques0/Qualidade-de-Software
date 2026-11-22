import type {Request,Response,NextFunction} from "express";
import jwt from "jsonwebtoken";
import {env} from "../config/env.js";
import {AppError} from "../domain/errors/app-error.js";
declare global {namespace Express {interface Request {customerId?:string}}}
export function authenticate(req:Request,_res:Response,next:NextFunction):void{
 const header=req.headers.authorization;
 if(!header?.startsWith("Bearer "))return next(new AppError("Token não informado.",401));
 try{const payload=jwt.verify(header.slice(7),env.JWT_SECRET) as jwt.JwtPayload;if(typeof payload.sub!=="string")throw new Error();req.customerId=payload.sub;next();}
 catch{next(new AppError("Token inválido ou expirado.",401));}
}
