import { DataTypes } from "sequelize";
import { sequelize } from "../db/dbConnect.js";

const Playlist = sequelize.define('Playlist', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: "name is required" }
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: { msg: "description is required" }
        }
    },
    ownerId: {
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
        { fields: ['ownerId'] }
    ]
});

// Many-to-Many relationship between Playlist and Video
const PlaylistVideo = sequelize.define('PlaylistVideo', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    playlistId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Playlists',
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
    },
    order: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    timestamps: true,
    indexes: [
        { 
            unique: true,
            fields: ['playlistId', 'videoId'],
            name: 'unique_playlist_video'
        }
    ]
});

// Associations will be defined in models/index.js to avoid circular dependencies

export { Playlist, PlaylistVideo };