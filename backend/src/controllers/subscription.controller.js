import { Subscription, User, Video } from "../models/index.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { isValidUUID } from "../utils/uuidValidator.js";
import { Op } from "sequelize";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidUUID(channelId)) {
        throw new ApiError(400, "Invalid channelId");
    }

    const isSubscribed = await Subscription.findOne({
        where: {
            subscriberId: req.user?.id,
            channelId: channelId,
        }
    });

    if (isSubscribed) {
        await isSubscribed.destroy();
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { subscribed: false },
                    "unsubscribed successfully"
                )
            );
    }

    await Subscription.create({
        subscriberId: req.user?.id,
        channelId: channelId,
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { subscribed: true },
                "subscribed successfully"
            )
        );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidUUID(channelId)) {
        throw new ApiError(400, "Invalid channelId");
    }

    const subscriptions = await Subscription.findAll({
        where: { channelId },
        include: [
            {
                model: User,
                as: 'subscriber',
                attributes: ['id', 'username', 'fullName', 'avatar'],
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

    const formattedSubscribers = await Promise.all(subscriptions.map(async (sub) => {
        const subData = sub.toJSON();
        const subscriber = subData.subscriber;
        
        // Check if current user is subscribed to this subscriber
        const subscribedToSubscriber = req.user?.id ? await Subscription.findOne({
            where: {
                channelId: subscriber?.id,
                subscriberId: channelId
            }
        }) : null;

        // Get subscriber count
        const subscribersCount = await Subscription.count({
            where: { channelId: subscriber?.id }
        });

        return {
            subscriber: {
                id: subscriber?.id,
                username: subscriber?.username,
                fullName: subscriber?.fullName,
                avatar: subscriber?.avatar,
                subscribedToSubscriber: !!subscribedToSubscriber,
                subscribersCount
            }
        };
    }));

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                formattedSubscribers,
                "subscribers fetched successfully"
            )
        );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if (!isValidUUID(subscriberId)) {
        throw new ApiError(400, "Invalid subscriberId");
    }

    const subscriptions = await Subscription.findAll({
        where: { subscriberId },
        include: [
            {
                model: User,
                as: 'channel',
                attributes: ['id', 'username', 'fullName', 'avatar'],
                include: [
                    {
                        model: Video,
                        as: 'videos',
                        attributes: ['id', 'videoFile', 'thumbnail', 'ownerId', 'title', 'description', 'duration', 'createdAt', 'views'],
                        where: { isPublished: true },
                        required: false,
                        separate: true,
                        order: [['createdAt', 'DESC']],
                        limit: 1
                    }
                ]
            }
        ]
    });

    const formattedChannels = subscriptions.map(sub => {
        const subData = sub.toJSON();
        const channel = subData.channel;
        const latestVideo = channel?.videos?.[0] || null;

        return {
            subscribedChannel: {
                id: channel?.id,
                username: channel?.username,
                fullName: channel?.fullName,
                avatar: channel?.avatar,
                latestVideo: latestVideo ? {
                    id: latestVideo.id,
                    videoFile: latestVideo.videoFile,
                    thumbnail: latestVideo.thumbnail,
                    ownerId: latestVideo.ownerId,
                    title: latestVideo.title,
                    description: latestVideo.description,
                    duration: latestVideo.duration,
                    createdAt: latestVideo.createdAt,
                    views: latestVideo.views
                } : null
            }
        };
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                formattedChannels,
                "subscribed channels fetched successfully"
            )
        );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
