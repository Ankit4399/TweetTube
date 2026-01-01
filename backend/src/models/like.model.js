import { DataTypes } from "sequelize";
import { sequelize } from "../db/dbConnect.js";
import { Op } from "sequelize";

const Like = sequelize.define('Like', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    commentId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'Comments',
            key: 'id'
        }
    },
    videoId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'Videos',
            key: 'id'
        }
    },
    tweetId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'Tweets',
            key: 'id'
        }
    },
    likedById: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    }
}, {
    timestamps: true,
    indexes: [
        { fields: ['commentId'] },
        { fields: ['videoId'] },
        { fields: ['tweetId'] },
        { fields: ['likedById'] },
        {
            unique: true,
            fields: ['commentId', 'likedById'],
            name: 'unique_comment_like',
            where: {
                commentId: { [Op.ne]: null }
            }
        },
        {
            unique: true,
            fields: ['videoId', 'likedById'],
            name: 'unique_video_like',
            where: {
                videoId: { [Op.ne]: null }
            }
        },
        {
            unique: true,
            fields: ['tweetId', 'likedById'],
            name: 'unique_tweet_like',
            where: {
                tweetId: { [Op.ne]: null }
            }
        }
    ]
});

// Associations will be defined in models/index.js to avoid circular dependencies

export { Like };