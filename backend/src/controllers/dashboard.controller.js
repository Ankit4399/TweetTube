import { Video, Subscription, Like } from "../models/index.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
    const userId = req.user?.id;

    // Get total subscribers
    const totalSubscribers = await Subscription.count({
        where: { channelId: userId }
    });

    // Get videos with likes
    const videos = await Video.findAll({
        where: { ownerId: userId },
        include: [
            {
                model: Like,
                as: 'likes',
                attributes: ['id']
            }
        ]
    });

    const totalVideos = videos.length;
    const totalViews = videos.reduce((sum, video) => sum + (video.views || 0), 0);
    const totalLikes = videos.reduce((sum, video) => sum + (video.likes?.length || 0), 0);

    const channelStats = {
        totalSubscribers,
        totalLikes,
        totalViews,
        totalVideos
    };

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                channelStats,
                "channel stats fetched successfully"
            )
        );
});

const getChannelVideos = asyncHandler(async (req, res) => {
    const userId = req.user?.id;

    const videos = await Video.findAll({
        where: { ownerId: userId },
        include: [
            {
                model: Like,
                as: 'likes',
                attributes: ['id']
            }
        ],
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'videoFile', 'thumbnail', 'title', 'description', 'createdAt', 'isPublished']
    });

    const formattedVideos = videos.map(video => {
        const videoData = video.toJSON();
        const likesCount = video.likes ? video.likes.length : 0;
        const createdAt = new Date(videoData.createdAt);
        
        return {
            id: videoData.id,
            videoFile: videoData.videoFile,
            thumbnail: videoData.thumbnail,
            title: videoData.title,
            description: videoData.description,
            createdAt: {
                year: createdAt.getFullYear(),
                month: createdAt.getMonth() + 1,
                day: createdAt.getDate()
            },
            isPublished: videoData.isPublished,
            likesCount
        };
    });

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            formattedVideos,
            "channel videos fetched successfully"
        )
    );
});

export { getChannelStats, getChannelVideos };
