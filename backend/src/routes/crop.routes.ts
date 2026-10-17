import { Router } from 'express';
import {
  getCrops,
  getMarkets,
  getNearbyMarkets,
  getLatestPrices,
  getPriceHistory,
  recommendMarkets,
} from '../controllers/crop.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/crops', getCrops);
router.get('/markets', getMarkets);
router.get('/markets/nearby', getNearbyMarkets);
router.get('/markets/recommend', recommendMarkets);
router.get('/prices/latest', getLatestPrices);
router.get('/prices/history', getPriceHistory);

export default router;
