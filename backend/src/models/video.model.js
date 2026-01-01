import { DataTypes } from "sequelize";
import { sequelize } from "../db/dbConnect.js";

const Video = sequelize.define('Video', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    videoFile: {
        type: DataTypes.JSONB,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'videoFile is required' }
        }
    },
    thumbnail: {
        type: DataTypes.JSONB,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'thumbnail is required' }
        }
    },
    ownerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'title is required' }
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'description is required' }
        }
    },
    duration: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'duration is required' }
        }
    },
    views: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    isPublished: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    }
}, {
    timestamps: true,
    indexes: [
        { fields: ['ownerId'] },
        { fields: ['isPublished'] },
        { fields: ['title'] },
        { fields: ['description'] }
        // Note: For full-text search, you can add a GIN index after installing pg_trgm extension:
        // CREATE EXTENSION IF NOT EXISTS pg_trgm;
        // CREATE INDEX videos_title_description_gin ON "Videos" USING gin (title gin_trgm_ops, description gin_trgm_ops);
    ]
});

// WatchHistory junction table for User-Video many-to-many relationship
const WatchHistory = sequelize.define('WatchHistory', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    videoId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Videos',
            key: 'id'
        }
    }
}, {
    timestamps: true,
    indexes: [
        { 
            unique: true,
            fields: ['userId', 'videoId'],
            name: 'unique_watch_history'
        },
        { fields: ['userId'] },
        { fields: ['videoId'] }
    ]
});

// Associations will be defined in models/index.js to avoid circular dependencies

export { Video, WatchHistory };