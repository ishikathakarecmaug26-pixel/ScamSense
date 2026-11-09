import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken"; // library to verify JWT tokens
import { env } from "../config/env.js";

//for ts to recognize user property
declare global {
  namespace Express {//ts construct for declaration in named scopr
    interface Request {//this says this is how obj will look like so basically shape batayga
      user?: {//? cuz we have guest user so its optional 
        id: number; // user db id
        email: string; // user email
        role: string; // user or admin
      };
    }
  }
}

//jwt payload struc
interface JwtPayload {
  id: number;
  email: string;
  role: string;
}

//authenticate middleware
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {//void cuz we are not returning vlaue to caller
  
  const token = req.cookies?.token as string | undefined;//read token from httponly cokie

  // check karege token exists or not 
  if (!token) {
    res.status(401).json({
      success: false,
      message: "Not authenticated. Please log in first.",
    });
    return;
  }
//verify token
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    //attaching user to req
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please log in again.",
    });
    return;
  }
};

//optional auth middleware so guest bhi allowed
export const optionalAuthenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const token = req.cookies?.token as string | undefined;
    //guest no return
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
  } catch (error) {
    req.user = undefined;
  }

  next();
};

//authorize middleware
export const authorize = (...roles: string[]) => {
  // Return the actual middleware function
  return (req: Request, res: Response, next: NextFunction): void => {
    //checking if user actuallu exists or not
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Not authenticated. Please log in first.",
      });
      return;
    }

    // nowuser is present so whats the roles so we can give access acc to role
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message:
          "Forbidden. You do not have permission to access this resource.",
      });
      return;
    }
    next();
  };
};
