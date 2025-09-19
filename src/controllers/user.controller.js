import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudianry } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import e from "express";
import mongoose from "mongoose";
const generateaccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        // if (!user) {
        //     throw new ApiError(404, "User not found");
        // }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        //adding refreshToken to the db and Saving it
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false }); //it tells mongoose to skip the validation steps like password

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating refresh and access token"
        );
    }
};

const registerUser = asyncHandler(async (req, res) => {
    //get user data from the frontend
    //validation - not empty
    //check if user already exist (check with both username and email
    //check for images and check for the avatar
    //upload them to cloudinary, avatar
    //create user object - create entry in db
    //remove password and refresh password field from response
    //check for user creation
    //return response

    //use res.body (form express)to acces the data coming from form or json format
    //    const { fullName, email, username ,password} = req.body
    //    console.log("password",password)

    /*
if(fullname === ""){ 
    throw new ApiError(400, "fullname is required")
    }
    //if we do like this it will take to many conditional statements, so we use below one
    */

    const { fullname, email, username, password } = req.body;
    if (
        [fullname, email, username, password].some(
            (feild) => feild?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All feilds are Required");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    // const avatarLocalPath = req.files?.avatar[0]?.path; //do same for this also as done for above one

    // if (!avatarLocalPath) {
    //     throw new ApiError(400, "Avatar file is required");
    // }

    let avatarLocalPath;

    if (
        req.files &&
        Array.isArray(req.files.avatar) &&
        req.files.avatar.length > 0
    ) {
        avatarLocalPath = req.files.avatar[0].path;
    }
    let coverImageLocalPath;

    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0
    ) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    const avatar = await uploadOnCloudianry(avatarLocalPath);
    const coverImage = await uploadOnCloudianry(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );
    if (!createdUser) {
        throw new ApiError(
            500,
            "Something went wrong while registering the user"
        );
    }

    return res
        .status(200)
        .json(new ApiResponse(200, createdUser, "User created successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
    //take data from req.body
    //take input from the user
    //check if the user exists
    //check if the password is correct
    //generate access token and refresh token
    //send cookies
    //send response

    const { email, password, username } = req.body;

    // if (!username && !email) {  Or
    if (!(username || email)) {
        throw new ApiError(400, "Username or email is required");
    }

    const user = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (!user) {
        throw new ApiError(400, "User doesn't exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(400, "Password is incorrect");
    }

    const { accessToken, refreshToken } = await generateaccessAndRefreshToken(
        user._id
    );

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                "User loggedIN successfully"
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    // req.user._id
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1,
            },
        },
        {
            new: true,
        }
    );
    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out successfully")); //{} => means we are not sendin any data back
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    try {
        const incomingRefreshToken =
            req.cookies.refreshToken || req.body.refreshToken;

        if (!incomingRefreshToken) {
            throw new ApiError(401, "Unauthorized request");
        }

        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const options = {
            httpOnly: true,
            secure: true,
        };

        const { accessToken, newRefreshToken } =
            await generateaccessAndRefreshToken(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token generated successfully"
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body; //this line is to check the old password and newly entered password, and it can be done through the frontend also

    // In case of you want to check confirm password with new password also
    // const {oldPassword, newPassword, confirmpassword} = req.body

    // if(!(newPassword === confirmPassword)){
    //     throw new ApiError(400, "Password doesn't match")
    // }

    const user = await User.findById(req.user?._id);
    const isPasswordSCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordSCorrect) {
        throw new ApiError(400, "Invalid password ");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password Changed Succesfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(200, req.user, "Current User fetched successfully");
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body;

    if (!fullname || !email) {
        throw new ApiError(400, "All feildsare required");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            //here we use the mongoDB operations
            $set: {
                // fullname:fullname Or
                fullname,
                email: email,
            },
        },
        { new: true } //the updated information will be returned by setting the new: true
    ).select("-password");

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Account details updated successfully")
        );
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path; //file can be accessed because of using the multer middleware

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is not provided");
    }

    // TODO: delete old image - assaignment if you want to do it
    const avatar = await uploadOnCloudianry(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading the avatar");
    }
    const user = await User.findOneAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: avatar.url,
            },
        },
        { new: true }
    ).select("-password");
    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar Image updated successfully"));
});

const updateUserCoverImg = asyncHandler(async (req, res) => {
    const CoverImgLocalPath = req.file?.path; //file can be accessed because of using the multer middleware

    if (!CoverImgLocalPath) {
        throw new ApiError(400, "coverImg is not provided");
    }

    const coverImg = await uploadOnCloudianry(CoverImgLocalPath);

    if (!coverImg.url) {
        throw new ApiError(400, "Error while uploading the coverImg");
    }
    const user = await User.findOneAndUpdate(
        req.user._id,
        {
            $set: {
                coverImg: coverImg.url,
            },
        },
        { new: true }
    ).select("-password");
    return res
        .status(200)
        .json(new ApiResponse(200, user, "Cover Image updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
    //whenever we nedd some data from the UserProfile, we usually request via the url
    //here .params is nothing but requesting via the url
    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, "Username is issing");
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase(),
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo",
            },
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers",
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo",
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImg: 1,
                email: 1,
                createdAt: 1,
            },
        },
    ]);

    if (!channel?.length) {
        throw new ApiError(400, "Channel does not exists");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                channel[0],
                "User channel fetched successfully"
            )
        );
});

const getWatchHistory = asyncHandler(async (req, res) => {
    // Important Interview question can be asked
    // req.user._id  => here we get the i as string format, but when use that id do some DB operations, mongoose itself converts it to objectID and give desired results

    const user = await User.aggregate([
        {
            $match: {
                // _id: req.user._id  //but here it will not work because
                // this are aggregation pipeline codes, and that are send to the DB directly without any mongoose conversion
                _id: new mongoose.Types.ObjectId(
                    req.user._id
                ),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [  //these are called as sub-pipelines
                                {
                                    //  Placing the $project pipeline inside the videos lookup
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1,
                                    },
                                },
                            ],
                        },
                    },

                    //////////////
                    //These is optionall, but we  written it to make the frontend person to get data essily 
                    // by just accessing this owner and use . to extract values in it
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                    ////////////////
                ],
            },
        },
        /*{
            //TODO: Placing the $project pipeline outside the videos lookup
            $project: {
                fullname: 1,
                username: 1,
                avatar: 1,
            },
        },*/
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully")
    )
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImg,
    getUserChannelProfile,
    getWatchHistory,
};
