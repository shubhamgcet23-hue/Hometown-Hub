import { Response } from "express";

export function success(res: Response, data: unknown = {}, message = "Operation successful", status = 200) {
  return res.status(status).json({ success: true, message, data });
}

export function failure(res: Response, message = "Something went wrong", status = 400, data: unknown = null) {
  return res.status(status).json({ success: false, message, data });
}
