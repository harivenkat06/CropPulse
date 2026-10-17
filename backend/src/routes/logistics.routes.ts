import { Router } from 'express';
import {
  createLogisticsRequest,
  getLogisticsRequests,
  findMatches,
  acceptMatch,
  updateLogisticsStatus,
  joinLogisticsRequest,
  respondToJoinRequest,
  getLogisticsMessages,
  sendLogisticsMessage,
} from '../controllers/logistics.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/requests', authenticate, createLogisticsRequest);
router.get('/requests', authenticate, getLogisticsRequests);
router.get('/requests/:id/matches', authenticate, findMatches);
router.post('/requests/:id/join', authenticate, joinLogisticsRequest);
router.patch('/join-requests/:id', authenticate, respondToJoinRequest);
router.get('/requests/:id/messages', authenticate, getLogisticsMessages);
router.post('/requests/:id/messages', authenticate, sendLogisticsMessage);
router.post('/matches/accept', authenticate, acceptMatch);
router.patch('/requests/:id/status', authenticate, updateLogisticsStatus);

export default router;
