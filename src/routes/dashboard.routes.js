import { Router } from 'express';
import {
    getChannelStats,
    getChannelVideos,
    getWatchHistory,
    removeFromWatchHistory
} from "../controllers/dashboard.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

router.use(verifyJWT); 

router.route("/stats").get(getChannelStats);
router.route("/videos").get(getChannelVideos);
router.route("/watch-history").get(getWatchHistory);
router.route("/watch-history/:videoId").delete(removeFromWatchHistory);

export default router;