import { Router } from 'express';
import { getListings, createListing, updateListing, deleteListing } from '../controllers/listing.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', getListings);
router.post('/', authenticate, createListing);
router.put('/:id', authenticate, updateListing);
router.delete('/:id', authenticate, deleteListing);

export default router;
