import  { Router } from "express";
import {
    loginUser,
    logoutUser,
    registerUser,
    refreshAccessToken,
    getUserChannelProfile,
    updateAccountDetails,
    getCurrentUser,
    changeCurrentPassword,
    updateUserAvatar,
    updateUserCoverImg,
    getWatchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { get } from "mongoose";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount: 1,
        },
    ]),

    registerUser
);

router.route("/login").post(loginUser);

//securedroutes
router.route("/logout").post(verifyJWT, logoutUser);

router.route("/refresh-token").post(refreshAccessToken);

router.route("/change-password").post(verifyJWT, changeCurrentPassword);

router.route("/current-user").get(verifyJWT, getCurrentUser);

//it is patch here not post because we are updating existing data
router.route("/update-account").patch(verifyJWT, updateAccountDetails);

router
    .route("/avatar")
    .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

router
    .route("/coverImage")
    .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImg);

// router.route("/c/:username")  Or  this route is related to the url or
// the req.params we used in our getUserChannelProfile controller
//To handle the data from the url
router.route("/channel/:username").get(verifyJWT, getUserChannelProfile);

router.route("/history").get(verifyJWT, getWatchHistory);
export default router;
