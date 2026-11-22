import type {Request,Response,NextFunction} from "express";
import {ZodError} from "zod";
import {AppError} from "../domain/errors/app-error.js";
export function errorHandler(error:unknown,_req:Request,res:Response,_next:NextFunction):void{
 if(error instanceof ZodError){res.status(400).json({message:"Dados inválidos.",errors:error.issues.map(i=>({field:i.path.join("."),message:i.message}))});return;}
 if(error instanceof AppError){res.status(error.statusCode).json({message:error.message});return;}
 if(error&&typeof error==="object"&&"code" in error&&error.code===11000){res.status(409).json({message:"Registro já cadastrado."});return;}
 console.error(error);res.status(500).json({message:"Erro interno do servidor."});
}
