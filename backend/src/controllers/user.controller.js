import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/apiError.js"
import { User, Subscription, Video, WatchHistory } from "../models/index.js"
import {uploadOnCloudinary, deleteOnCloudinary} from "../utils/cloudinary.js"
import ApiResponse from "../utils/ApiResponse.js"
import JWT from "jsonwebtoken"
import { Op } from "sequelize"

const generateAccessAndRefreshToken = async(userId) => {
    
    try {
        const user = await User.findByPk(userId);
        
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save();

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token.");
    }
};

const registerUser = asyncHandler( async(req, res) => {
    // get user details from frontend
    // validation - not empty etc...
    // check if user already exists: username, email
    // check for images, avatar
    // upload to cloudinary, avatar check
    // create user object - create entry in db
    // remove password and refresh token from response
    // check for user creation
    // return response

    const {username, email, fullName, password} = req.body

    if ([username, email, fullName, password].some(
        (field) => ( field?.trim() === "" )
    )) {
        throw new ApiError(400, "All fields are required")
    }

    const userExists = await User.findOne({
        where: {
            [Op.or]: [{ username }, { email }]
        }
    })

    if (userExists) throw new ApiError(409, "user with username or email already exists")

    // console.log("req.files", req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path
    // console.log("avatarLocalPath", avatarLocalPath);

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) throw new ApiError(400, "Avatar file is required")

    const avatar = await uploadOnCloudinary(avatarLocalPath).catch((error) => console.log(error))
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    // console.log(avatar);null
    if (!avatar) throw new ApiError(400, "Avatar file is required!!!.")

    const user = await User.create({
        fullName,
        avatar: {
            public_id: avatar.public_id,
            url: avatar.secure_url
        },
        coverImage: {
            public_id: coverImage?.public_id || "",
            url: coverImage?.secure_url || ""
        },
        username: username.toLowerCase(),
        email,
        password
    })

    const createdUser = await User.findByPk(user.id, {
        attributes: { exclude: ['password', 'refreshToken'] }
    })

    if (!createdUser) throw new ApiError(500, "user registration failed, please try again")

    return res.status(201).json(
        new ApiResponse(200, createdUser, "user registered successfully")
    )

});

const loginUser = asyncHandler(async(req, res) => {
    // req body -> data
    // username or email
    // find the user
    // password check
    // access and refresh token
    // send tokens in cookies

    const {email, username, password} = req.body;

    if (!(username || email)) {
        throw new ApiError(400, "username or email is required.");
    }

    const user = await User.findOne({
        where: {
            [Op.or]: [{ email }, { username }]
        }
    });

    if (!user) {
        throw new ApiError(404, "User doesnot exist.");
    }

    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid user credentials.");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user.id);

    const loggedInUser = await User.findByPk(user.id, {
        attributes: { exclude: ['password', 'refreshToken'] }
    });

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "None"
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged in successfully !!!."
            )
        );

});

const logoutUser = asyncHandler(async(req, res) => {
    await User.update(
        { refreshToken: null },
        { where: { id: req.user.id } }
    );

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "None"
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(
                200,
                {},
                "User logout successfull !!!."
            )
        );
});

const refreshAccessToken = asyncHandler(async(req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request");
    }

    const user = await User.findOne({
        refreshToken: incomingRefreshToken
    });

    if (!user) {
        throw new ApiError(401, "Invalid refresh token");
    }

    const { accessToken , refreshToken } = await generateAccessAndRefreshToken(user.id);

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "None"
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken
                },
                "Access token refreshed"
            )
        )

});

const changeCurrentPassword = asyncHandler(async(req, res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findByPk(req.user?.id);

    const isOldPasswordCorrect = await user.comparePassword(oldPassword);

    if (!isOldPasswordCorrect) {
        throw new ApiError(400, "Incorrect old password");
    }

    user.password = newPassword;
    await user.save();

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Password updated successfully")
        )
});

const getCurrentUser = asyncHandler(async(req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(200, req.user, "current user fetched successfully")
        )
});

const updateUserDetails = asyncHandler(async(req, res) => {
    const {fullName, email} = req.body;

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required");
    }

    await User.update(
        { fullName, email },
        { where: { id: req.user?.id } }
    );
    
    const user = await User.findByPk(req.user?.id, {
        attributes: { exclude: ['password', 'refreshToken'] }
    });

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Account details updated successfully")
        )
});

const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading avatar");
    }

    const user = await User.findByPk(req.user.id, {
        attributes: ['id', 'avatar']
    });

    const avatarToDelete = user.avatar.public_id;

    await User.update(
        {
            avatar: {
                public_id: avatar.public_id,
                url: avatar.secure_url
            }
        },
        { where: { id: req.user?.id } }
    );
    
    const updatedUser = await User.findByPk(req.user?.id, {
        attributes: { exclude: ['password'] }
    });

    if (avatarToDelete && updatedUser.avatar.public_id) {
        await deleteOnCloudinary(avatarToDelete);
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedUser, "Avatar update successfull")
        )
});

const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(400, "coverImage file is missing");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading coverImage");
    }

    const user = await User.findByPk(req.user.id, {
        attributes: ['id', 'coverImage']
    });

    const coverImageToDelete = user.coverImage.public_id;

    await User.update(
        {
            coverImage: {
                public_id: coverImage.public_id,
                url: coverImage.secure_url
            }
        },
        { where: { id: req.user?.id } }
    );
    
    const updatedUser = await User.findByPk(req.user?.id, {
        attributes: { exclude: ['password'] }
    });

    if (coverImageToDelete && updatedUser.coverImage.public_id) {
        await deleteOnCloudinary(coverImageToDelete);
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedUser, "coverImage update successfull")
        )
});

const getUserChannelProfile = asyncHandler(async(req, res) => {
    const {username} = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing");
    }

    const channel = await User.findOne({
        where: { username: username?.toLowerCase() },
        attributes: ['id', 'fullName', 'username', 'email', 'avatar', 'coverImage']
    });

    if (!channel) {
        throw new ApiError(404, "channel doesnot exist");
    }

    const subscribersCount = await Subscription.count({
        where: { channelId: channel.id }
    });

    const channelsSubscribedToCount = await Subscription.count({
        where: { subscriberId: channel.id }
    });

    const isSubscribed = req.user?.id ? await Subscription.findOne({
        where: {
            channelId: channel.id,
            subscriberId: req.user.id
        }
    }) : null;

    const channelData = channel.toJSON();
    const formattedChannel = {
        ...channelData,
        subcribersCount: subscribersCount,
        channelsSubscribedToCount,
        isSubscribed: !!isSubscribed
    };

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                formattedChannel,
                "User channel fetced successfully"
            )
        )
});

const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.findByPk(req.user.id, {
        include: [
            {
                model: Video,
                as: 'watchHistory',
                include: [
                    {
                        model: User,
                        as: 'owner',
                        attributes: ['id', 'username', 'fullName', 'avatar']
                    }
                ],
                through: {
                    attributes: ['createdAt']
                }
            }
        ]
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const videos = user.watchHistory || [];
    const formattedHistory = videos.map(video => {
        const videoData = video.toJSON();
        return {
            id: videoData.id,
            videoFile: videoData.videoFile,
            thumbnail: videoData.thumbnail,
            title: videoData.title,
            description: videoData.description,
            duration: videoData.duration,
            views: videoData.views,
            createdAt: videoData.WatchHistory?.createdAt || videoData.createdAt,
            owner: {
                id: videoData.owner?.id,
                username: videoData.owner?.username,
                fullName: videoData.owner?.fullName,
                avatar: videoData.owner?.avatar
            }
        };
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                formattedHistory,
                "Watch history fetched successfully"
            )
        )
});



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUserDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}