import app, { initializeServices } from '../src/index';
import type { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
  await initializeServices();
  return app(req, res);
}
