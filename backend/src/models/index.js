// Import all models
import { User } from './user.model.js';
import { Video, WatchHistory } from './video.model.js';
import { Tweet } from './tweet.model.js';
import { Subscription } from './subscription.model.js';
import { Comment } from './comment.model.js';
import { Like } from './like.model.js';
import { Playlist, PlaylistVideo } from './playlist.model.js';

// Define all associations here to avoid circular dependencies
Video.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
User.hasMany(Video, { foreignKey: 'ownerId', as: 'videos' });
User.belongsToMany(Video, { through: WatchHistory, foreignKey: 'userId', as: 'watchHistory' });
Video.belongsToMany(User, { through: WatchHistory, foreignKey: 'videoId', as: 'watchedBy' });

Tweet.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
User.hasMany(Tweet, { foreignKey: 'ownerId', as: 'tweets' });

Subscription.belongsTo(User, { foreignKey: 'subscriberId', as: 'subscriber' });
Subscription.belongsTo(User, { foreignKey: 'channelId', as: 'channel' });
User.hasMany(Subscription, { foreignKey: 'subscriberId', as: 'subscriptions' });
User.hasMany(Subscription, { foreignKey: 'channelId', as: 'subscribers' });

Comment.belongsTo(Video, { foreignKey: 'videoId', as: 'video' });
Comment.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
Video.hasMany(Comment, { foreignKey: 'videoId', as: 'comments' });
User.hasMany(Comment, { foreignKey: 'ownerId', as: 'comments' });

Like.belongsTo(User, { foreignKey: 'likedById', as: 'likedBy' });
Like.belongsTo(Video, { foreignKey: 'videoId', as: 'video' });
Like.belongsTo(Comment, { foreignKey: 'commentId', as: 'comment' });
Like.belongsTo(Tweet, { foreignKey: 'tweetId', as: 'tweet' });
User.hasMany(Like, { foreignKey: 'likedById', as: 'likes' });
Video.hasMany(Like, { foreignKey: 'videoId', as: 'likes' });
Comment.hasMany(Like, { foreignKey: 'commentId', as: 'likes' });
Tweet.hasMany(Like, { foreignKey: 'tweetId', as: 'likes' });

Playlist.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
User.hasMany(Playlist, { foreignKey: 'ownerId', as: 'playlists' });
Playlist.belongsToMany(Video, { through: PlaylistVideo, foreignKey: 'playlistId', as: 'videos' });
Video.belongsToMany(Playlist, { through: PlaylistVideo, foreignKey: 'videoId', as: 'playlists' });

// Export all models
export {
    User,
    Video,
    WatchHistory,
    Tweet,
    Subscription,
    Comment,
    Like,
    Playlist,
    PlaylistVideo
};

