import { Comment, Video, Like, User } from "../models/index.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { isValidUUID } from "../utils/uuidValidator.js";

// get all comments for a video
const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!isValidUUID(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const video = await Video.findByPk(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    const { count, rows: comments } = await Comment.findAndCountAll({
        where: { videoId },
        include: [
            {
                model: User,
                as: 'owner',
                attributes: ['id', 'username', 'fullName', 'avatar']
            },
            {
                model: Like,
                as: 'likes',
                attributes: ['id', 'likedById']
            }
        ],
        order: [['createdAt', 'DESC']],
        limit: limitNum,
        offset: offset
    });

    const formattedComments = comments.map(comment => {
        const commentData = comment.toJSON();
        const likesCount = comment.likes ? comment.likes.length : 0;
        const isLiked = comment.likes?.some(like => like.likedById === req.user?.id) || false;
        
        return {
            id: commentData.id,
            content: commentData.content,
            createdAt: commentData.createdAt,
            likesCount,
            owner: {
                id: commentData.owner?.id,
                username: commentData.owner?.username,
                fullName: commentData.owner?.fullName,
                avatar: commentData.owner?.avatar
            },
            isLiked
        };
    });

    const paginatedResult = {
        docs: formattedComments,
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
        .json(new ApiResponse(200, paginatedResult, "Comments fetched successfully"));
});

// add a comment to a video
const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;

    if (!content) {
        throw new ApiError(400, "Content is required");
    }

    if (!isValidUUID(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const video = await Video.findByPk(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const comment = await Comment.create({
        content,
        videoId: videoId,
        ownerId: req.user?.id
    });

    if (!comment) {
        throw new ApiError(500, "Failed to add comment please try again");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, comment, "Comment added successfully"));
});

// update a comment
const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content) {
        throw new ApiError(400, "content is required");
    }

    if (!isValidUUID(commentId)) {
        throw new ApiError(400, "Invalid commentId");
    }

    const comment = await Comment.findByPk(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment?.ownerId !== req.user?.id) {
        throw new ApiError(400, "only comment owner can edit their comment");
    }

    await comment.update({ content });
    await comment.reload();

    return res
        .status(200)
        .json(
            new ApiResponse(200, comment, "Comment edited successfully")
        );
});

// delete a comment
const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!isValidUUID(commentId)) {
        throw new ApiError(400, "Invalid commentId");
    }

    const comment = await Comment.findByPk(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment?.ownerId !== req.user?.id) {
        throw new ApiError(400, "only comment owner can delete their comment");
    }

    // Delete associated likes
    await Like.destroy({
        where: {
            commentId: commentId
        }
    });

    await comment.destroy();

    return res
        .status(200)
        .json(
            new ApiResponse(200, { commentId }, "Comment deleted successfully")
        );
});

export { getVideoComments, addComment, updateComment, deleteComment };
