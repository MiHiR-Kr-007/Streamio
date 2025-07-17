import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishVideo,
    togglePublishStatus,
    updateVideo,
    incrementVideoViews
} from "../controllers/video.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"

const router = Router();

// Protected routes
router.use(verifyJWT);

router.get('/', getAllVideos);
router.get('/:videoId', getVideoById);

router.post(
    '/',
    upload.fields([
        { name: 'videoFile', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 },
    ]),
    publishVideo
);

router.delete('/:videoId', deleteVideo);
router.patch('/:videoId', upload.single('thumbnail'), updateVideo);
router.patch('/toggle/publish/:videoId', togglePublishStatus);
router.post('/:videoId/view', incrementVideoViews);

export default router;