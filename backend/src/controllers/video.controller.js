import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import { Video, User, Comment, Like, Subscription, WatchHistory } from "../models/index.js";
import {
    uploadOnCloudinary,
    deleteOnCloudinary
} from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import { isValidUUID } from "../utils/uuidValidator.js";
import { Op } from "sequelize";

// get all videos based on query, sort, pagination
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    const whereClause = { isPublished: true };

    if (userId) {
        if (!isValidUUID(userId)) {
            throw new ApiError(400, "Invalid userId");
        }
        whereClause.ownerId = userId;
    }

    // Full-text search using PostgreSQL ILIKE (case-insensitive)
    if (query) {
        whereClause[Op.or] = [
            { title: { [Op.iLike]: `%${query}%` } },
            { description: { [Op.iLike]: `%${query}%` } }
        ];
    }

    // Determine sort order
    let orderBy = [['createdAt', 'DESC']];
    if (sortBy && sortType) {
        const direction = sortType === "asc" ? "ASC" : "DESC";
        orderBy = [[sortBy, direction]];
    }

    const { count, rows: videos } = await Video.findAndCountAll({
        where: whereClause,
        include: [
            {
                model: User,
                as: 'owner',
                attributes: ['id', 'username', 'avatar']
            }
        ],
        order: orderBy,
        limit: limitNum,
        offset: offset
    });

    const formattedVideos = videos.map(video => {
        const videoData = video.toJSON();
        return {
            ...videoData,
            ownerDetails: {
                id: videoData.owner?.id,
                username: videoData.owner?.username,
                avatar: videoData.owner?.avatar
            }
        };
    });

    const paginatedResult = {
        docs: formattedVideos,
        totalDocs: count,
        limit: limitNum,
        page: pageNum,
        totalPages: Math.ceil(count / limitNum),
        hasNextPage: pageNum < Math.ceil(count / limitNum),
        hasPrevPage: pageNum > 1,
        nextPage: pageNum < Math.ceil(count / limitNum) ? pageNum + 1 : null,
        prevPage: pageNum > 1 ? pageNum - 1 : null
    };

    return res
        .status(200)
        .json(new ApiResponse(200, paginatedResult, "Videos fetched successfully"));
});

// get video, upload to cloudinary, create video
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    
    if ([title, description].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const videoFileLocalPath = req.files?.videoFile[0].path;
    const thumbnailLocalPath = req.files?.thumbnail[0].path;

    if (!videoFileLocalPath) {
        throw new ApiError(400, "videoFileLocalPath is required");
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "thumbnailLocalPath is required");
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!videoFile) {
        throw new ApiError(400, "Video file not found");
    }

    if (!thumbnail) {
        throw new ApiError(400, "Thumbnail not found");
    }

    const video = await Video.create({
        title,
        description,
        duration: videoFile.duration,
        videoFile: {
            url: videoFile.url,
            public_id: videoFile.public_id
        },
        thumbnail: {
            url: thumbnail.url,
            public_id: thumbnail.public_id
        },
        ownerId: req.user?.id,
        isPublished: false
    });

    const videoUploaded = await Video.findByPk(video.id);

    if (!videoUploaded) {
        throw new ApiError(500, "videoUpload failed please try again !!!");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video uploaded successfully"));
});

// get video by id
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    
    if (!isValidUUID(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    if (!isValidUUID(req.user?.id)) {
        throw new ApiError(400, "Invalid userId");
    }

    const video = await Video.findByPk(videoId, {
        include: [
            {
                model: Like,
                as: 'likes',
                attributes: ['id', 'likedById']
            },
            {
                model: User,
                as: 'owner',
                attributes: ['id', 'username', 'avatar'],
                include: [
                    {
                        model: Subscription,
                        as: 'subscribers',
                        attributes: ['id', 'subscriberId']
                    }
                ]
            }
        ]
    });

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Get subscriber count and check if user is subscribed
    const subscribersCount = await Subscription.count({
        where: { channelId: video.ownerId }
    });

    const isSubscribed = await Subscription.findOne({
        where: {
            channelId: video.ownerId,
            subscriberId: req.user?.id
        }
    });

    // Increment views
    await Video.increment('views', { where: { id: videoId } });
    await video.reload();

    // Add to watch history
    await WatchHistory.findOrCreate({
        where: { userId: req.user?.id, videoId },
        defaults: { userId: req.user?.id, videoId }
    });

    const videoData = video.toJSON();
    const likesCount = video.likes ? video.likes.length : 0;
    const isLiked = video.likes?.some(like => like.likedById === req.user?.id) || false;

    const formattedVideo = {
        id: videoData.id,
        videoFile: videoData.videoFile,
        title: videoData.title,
        description: videoData.description,
        views: videoData.views + 1, // Incremented
        createdAt: videoData.createdAt,
        duration: videoData.duration,
        owner: {
            id: videoData.owner?.id,
            username: videoData.owner?.username,
            avatar: videoData.owner?.avatar,
            subscribersCount,
            isSubscribed: !!isSubscribed
        },
        likesCount,
        isLiked
    };

    return res
        .status(200)
        .json(
            new ApiResponse(200, formattedVideo, "video details fetched successfully")
        );
});

// update video details like title, description, thumbnail
const updateVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    const { videoId } = req.params;

    if (!isValidUUID(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    if (!(title && description)) {
        throw new ApiError(400, "title and description are required");
    }

    const video = await Video.findByPk(videoId);

    if (!video) {
        throw new ApiError(404, "No video found");
    }

    if (video?.ownerId !== req.user?.id) {
        throw new ApiError(
            400,
            "You can't edit this video as you are not the owner"
        );
    }

    //deleting old thumbnail and updating with new one
    const thumbnailToDelete = video.thumbnail?.public_id;

    const thumbnailLocalPath = req.file?.path;

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "thumbnail is required");
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnail) {
        throw new ApiError(400, "thumbnail not found");
    }

    await video.update({
        title,
        description,
        thumbnail: {
            public_id: thumbnail.public_id,
            url: thumbnail.url
        }
    });
    await video.reload();

    if (thumbnailToDelete) {
        await deleteOnCloudinary(thumbnailToDelete);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video updated successfully"));
});

// delete video
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidUUID(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const video = await Video.findByPk(videoId);

    if (!video) {
        throw new ApiError(404, "No video found");
    }

    if (video?.ownerId !== req.user?.id) {
        throw new ApiError(
            400,
            "You can't delete this video as you are not the owner"
        );
    }

    await deleteOnCloudinary(video.thumbnail?.public_id);
    await deleteOnCloudinary(video.videoFile?.public_id, "video");

    // delete video likes
    await Like.destroy({
        where: { videoId: videoId }
    });

    // delete video comments
    await Comment.destroy({
        where: { videoId: videoId }
    });

    // delete from watch history
    await WatchHistory.destroy({
        where: { videoId: videoId }
    });

    await video.destroy();
    
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video deleted successfully"));
});

// toggle publish status of a video
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidUUID(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const video = await Video.findByPk(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video?.ownerId !== req.user?.id) {
        throw new ApiError(
            400,
            "You can't toogle publish status as you are not the owner"
        );
    }

    await video.update({ isPublished: !video.isPublished });
    await video.reload();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { isPublished: video.isPublished },
                "Video publish toggled successfully"
            )
        );
});

export {
    publishAVideo,
    updateVideo,
    deleteVideo,
    getAllVideos,
    getVideoById,
    togglePublishStatus,
};
