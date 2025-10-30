import { Router, Request, Response } from 'express';
import { loadConfig, getDefaultConfig } from '../../../core/config';
import { logger } from '../../../core/utils/logger';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const config = loadConfig();
    const safeConfig = {
      ...config,
      ai: { ...config.ai, apiKey: undefined }
    };
    res.json(safeConfig);
  } catch (error: any) {
    logger.error('Config fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
});

router.get('/default', async (req: Request, res: Response) => {
  try {
    const config = getDefaultConfig();
    res.json(config);
  } catch (error: any) {
    logger.error('Default config error:', error);
    res.status(500).json({ error: 'Failed to fetch default configuration' });
  }
});

export const configRouter = router;
