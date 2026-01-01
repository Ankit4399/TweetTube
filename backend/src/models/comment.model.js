import { DataTypes } from "sequelize";
import { sequelize } from "../db/dbConnect.js";

const Comment = sequelize.define('Comment', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: { msg: "content is required" }
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
        { fields: ['videoId'] },
        { fields: ['ownerId'] }
    ]
});

// Associations will be defined in models/index.js to avoid circular dependencies

export { Comment };