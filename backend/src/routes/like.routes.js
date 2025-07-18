import { Router } from 'express';
import {
    getLikedVideos,
    getLikeStatus,
    toggleCommentLike,
    toggleVideoLike,
    toggleTweetLike,
} from "../controllers/like.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT);

router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/toggle/c/:commentId").post(toggleCommentLike);
router.route("/toggle/t/:tweetId").post(toggleTweetLike);
router.route("/videos").get(getLikedVideos);
router.route("/status/:contentType/:contentId").get(getLikeStatus);

export default router;