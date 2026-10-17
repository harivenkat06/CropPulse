import { Router } from 'express';
import { getPrediction, getPredictionCatalog, triggerTraining } from '../controllers/prediction.controller';

const router = Router();

router.get('/', getPrediction);
router.get('/catalog', getPredictionCatalog);
router.post('/train', triggerTraining);

export default router;
