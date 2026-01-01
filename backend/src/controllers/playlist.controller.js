import { Playlist, Video, User, PlaylistVideo } from "../models/index.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { isValidUUID } from "../utils/uuidValidator.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name || !description) {
        throw new ApiError(400, "name and description both are required");
    }

    const playlist = await Playlist.create({
        name,
        description,
        ownerId: req.user?.id,
    });

    if (!playlist) {
        throw new ApiError(500, "failed to create playlist");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "playlist created successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const { playlistId } = req.params;

    if (!name || !description) {
        throw new ApiError(400, "name and description both are required");
    }

    if (!isValidUUID(playlistId)) {
        throw new ApiError(400, "Invalid PlaylistId");
    }

    const playlist = await Playlist.findByPk(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.ownerId !== req.user?.id) {
        throw new ApiError(400, "only owner can edit the playlist");
    }

    await playlist.update({ name, description });
    await playlist.reload();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlist,
                "playlist updated successfully"
            )
        );
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidUUID(playlistId)) {
        throw new ApiError(400, "Invalid PlaylistId");
    }

    const playlist = await Playlist.findByPk(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.ownerId !== req.user?.id) {
        throw new ApiError(400, "only owner can delete the playlist");
    }

    await playlist.destroy();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "playlist updated successfully"
            )
        );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidUUID(playlistId) || !isValidUUID(videoId)) {
        throw new ApiError(400, "Invalid PlaylistId or videoId");
    }

    const playlist = await Playlist.findByPk(playlistId);
    const video = await Video.findByPk(videoId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }
    if (!video) {
        throw new ApiError(404, "video not found");
    }

    if (playlist.ownerId !== req.user?.id) {
        throw new ApiError(400, "only owner can add video to thier playlist");
    }

    // Add video to playlist using the junction table
    await PlaylistVideo.findOrCreate({
        where: { playlistId, videoId },
        defaults: { playlistId, videoId }
    });

    await playlist.reload({
        include: [{ model: Video, as: 'videos' }]
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlist,
                "Added video to playlist successfully"
            )
        );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidUUID(playlistId) || !isValidUUID(videoId)) {
        throw new ApiError(400, "Invalid PlaylistId or videoId");
    }

    const playlist = await Playlist.findByPk(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.ownerId !== req.user?.id) {
        throw new ApiError(
            400,
            "only owner can remove video from thier playlist"
        );
    }

    // Remove video from playlist using the junction table
    await PlaylistVideo.destroy({
        where: { playlistId, videoId }
    });

    await playlist.reload({
        include: [{ model: Video, as: 'videos' }]
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlist,
                "Removed video from playlist successfully"
            )
        );
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidUUID(playlistId)) {
        throw new ApiError(400, "Invalid PlaylistId");
    }

    const playlist = await Playlist.findByPk(playlistId, {
        include: [
            {
                model: Video,
                as: 'videos',
                where: { isPublished: true },
                required: false,
                attributes: ['id', 'videoFile', 'thumbnail', 'title', 'description', 'duration', 'createdAt', 'views']
            },
            {
                model: User,
                as: 'owner',
                attributes: ['id', 'username', 'fullName', 'avatar']
            }
        ]
    });

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    const playlistData = playlist.toJSON();
    const videos = playlistData.videos || [];
    const totalVideos = videos.length;
    const totalViews = videos.reduce((sum, video) => sum + (video.views || 0), 0);

    const formattedPlaylist = {
        id: playlistData.id,
        name: playlistData.name,
        description: playlistData.description,
        createdAt: playlistData.createdAt,
        updatedAt: playlistData.updatedAt,
        totalVideos,
        totalViews,
        videos: videos.map(video => ({
            id: video.id,
            videoFile: video.videoFile,
            thumbnail: video.thumbnail,
            title: video.title,
            description: video.description,
            duration: video.duration,
            createdAt: video.createdAt,
            views: video.views
        })),
        owner: {
            id: playlistData.owner?.id,
            username: playlistData.owner?.username,
            fullName: playlistData.owner?.fullName,
            avatar: playlistData.owner?.avatar
        }
    };

    return res
        .status(200)
        .json(new ApiResponse(200, formattedPlaylist, "playlist fetched successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidUUID(userId)) {
        throw new ApiError(400, "Invalid userId");
    }

    const playlists = await Playlist.findAll({
        where: { ownerId: userId },
        include: [
            {
                model: Video,
                as: 'videos',
                attributes: ['id', 'views']
            }
        ]
    });

    const formattedPlaylists = playlists.map(playlist => {
        const playlistData = playlist.toJSON();
        const videos = playlistData.videos || [];
        const totalVideos = videos.length;
        const totalViews = videos.reduce((sum, video) => sum + (video.views || 0), 0);

        return {
            id: playlistData.id,
            name: playlistData.name,
            description: playlistData.description,
            totalVideos,
            totalViews,
            updatedAt: playlistData.updatedAt
        };
    });

    return res
    .status(200)
    .json(new ApiResponse(200, formattedPlaylists, "User playlists fetched successfully"));

});

export {
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    getPlaylistById,
    getUserPlaylists,
};
