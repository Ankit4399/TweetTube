import { Like, Video, User } from "../models/index.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { isValidUUID } from "../utils/uuidValidator.js";
import { Op } from "sequelize";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidUUID(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const likedAlready = await Like.findOne({
        where: {
            videoId: videoId,
            likedById: req.user?.id,
        }
    });

    if (likedAlready) {
        await likedAlready.destroy();
        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: false }));
    }

    await Like.create({
        videoId: videoId,
        likedById: req.user?.id,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, { isLiked: true }));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!isValidUUID(commentId)) {
        throw new ApiError(400, "Invalid commentId");
    }

    const likedAlready = await Like.findOne({
        where: {
            commentId: commentId,
            likedById: req.user?.id,
        }
    });

    if (likedAlready) {
        await likedAlready.destroy();
        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: false }));
    }

    await Like.create({
        commentId: commentId,
        likedById: req.user?.id,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, { isLiked: true }));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!isValidUUID(tweetId)) {
        throw new ApiError(400, "Invalid tweetId");
    }

    const likedAlready = await Like.findOne({
        where: {
            tweetId: tweetId,
            likedById: req.user?.id,
        }
    });

    if (likedAlready) {
        await likedAlready.destroy();
        return res
            .status(200)
            .json(new ApiResponse(200, { tweetId, isLiked: false }));
    }

    await Like.create({
        tweetId: tweetId,
        likedById: req.user?.id,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, { isLiked: true }));
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const likes = await Like.findAll({
        where: {
            likedById: req.user?.id,
            videoId: { [Op.ne]: null }
        },
        include: [
            {
                model: Video,
                as: 'video',
                where: { isPublished: true },
                include: [
                    {
                        model: User,
                        as: 'owner',
                        attributes: ['id', 'username', 'fullName', 'avatar']
                    }
                ]
            }
        ],
        order: [['createdAt', 'DESC']]
    });

    const formattedLikes = likes
        .filter(like => like.video) // Filter out null videos
        .map(like => {
            const likeData = like.toJSON();
            return {
                likedVideo: {
                    id: likeData.video?.id,
                    videoFile: likeData.video?.videoFile,
                    thumbnail: likeData.video?.thumbnail,
                    ownerId: likeData.video?.ownerId,
                    title: likeData.video?.title,
                    description: likeData.video?.description,
                    views: likeData.video?.views,
                    duration: likeData.video?.duration,
                    createdAt: likeData.video?.createdAt,
                    isPublished: likeData.video?.isPublished,
                    ownerDetails: {
                        id: likeData.video?.owner?.id,
                        username: likeData.video?.owner?.username,
                        fullName: likeData.video?.owner?.fullName,
                        avatar: likeData.video?.owner?.avatar
                    }
                }
            };
        });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                formattedLikes,
                "liked videos fetched successfully"
            )
        );
});

export { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos };
