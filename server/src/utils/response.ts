import { Response } from "express";

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: Record<string, unknown>
) {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(meta ? { meta } : {}),
  });
}

export function sendCreated<T>(res: Response, data: T) {
  return sendSuccess(res, data, 201);
}

export function sendNoContent(res: Response) {
  return res.status(204).send();
}
