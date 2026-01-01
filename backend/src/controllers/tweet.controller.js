import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import { Tweet, User, Like } from "../models/index.js";
import ApiResponse from "../utils/ApiResponse.js";
import { isValidUUID } from "../utils/uuidValidator.js";
import { Op } from "sequelize";

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;

    if (!content) {
        throw new ApiError(400, "content is required");
    }

    const tweet = await Tweet.create({
        content,
        ownerId: req.user?.id,
    });

    if (!tweet) {
        throw new ApiError(500, "failed to create tweet please try again");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "Tweet created successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { tweetId } = req.params;

    if (!content) {
        throw new ApiError(400, "content is required");
    }

    if (!isValidUUID(tweetId)) {
        throw new ApiError(400, "Invalid tweetId");
    }

    const tweet = await Tweet.findByPk(tweetId);

    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (tweet?.ownerId !== req.user?.id) {
        throw new ApiError(400, "only owner can edit thier tweet");
    }

    await tweet.update({ content });
    await tweet.reload();

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!isValidUUID(tweetId)) {
        throw new ApiError(400, "Invalid tweetId");
    }

    const tweet = await Tweet.findByPk(tweetId);

    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (tweet?.ownerId !== req.user?.id) {
        throw new ApiError(400, "only owner can delete thier tweet");
    }

    await tweet.destroy();

    return res
        .status(200)
        .json(new ApiResponse(200, {tweetId}, "Tweet deleted successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidUUID(userId)) {
        throw new ApiError(400, "Invalid userId");
    }

    const tweets = await Tweet.findAll({
        where: { ownerId: userId },
        include: [
            {
                model: User,
                as: 'owner',
                attributes: ['id', 'username', 'avatar']
            },
            {
                model: Like,
                as: 'likes',
                attributes: ['id', 'likedById']
            }
        ],
        order: [['createdAt', 'DESC']]
    });

    const formattedTweets = tweets.map(tweet => {
        const tweetData = tweet.toJSON();
        const likesCount = tweet.likes ? tweet.likes.length : 0;
        const isLiked = tweet.likes?.some(like => like.likedById === req.user?.id) || false;
        
        return {
            id: tweetData.id,
            content: tweetData.content,
            createdAt: tweetData.createdAt,
            ownerDetails: {
                id: tweetData.owner?.id,
                username: tweetData.owner?.username,
                avatar: tweetData.owner?.avatar
            },
            likesCount,
            isLiked
        };
    });

    return res
        .status(200)
        .json(new ApiResponse(200, formattedTweets, "Tweets fetched successfully"));
});

export { createTweet, updateTweet, deleteTweet, getUserTweets };
