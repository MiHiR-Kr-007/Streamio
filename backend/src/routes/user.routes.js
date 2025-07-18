import {Router} from "express";
import 
{ 
    userRegister, 
    userLogin, 
    userLogout, 
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getChannelInfo,
    getWatchHistory,
    getUserById
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();


router.route("/register").post(
    upload.fields([
        {
            name : "avatar",
            maxCount : 1
        },
        {
            name : "coverImage",
            maxCount : 1
        }   
    ]),
    userRegister
);

router.route("/login").post(userLogin);

// secured routes
router.route("/logout").post(verifyJWT, userLogout)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changePassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
// router.route("/update-name").patch(verifyJWT, updateAccountDetails)
// router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
// router.route("/update-coverImage").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)
router.route("/c/:username").get(verifyJWT, getChannelInfo)
router.route("/watchHistory").get(verifyJWT, getWatchHistory)
router.route("/:userId").get(verifyJWT, getUserById)

export default router;