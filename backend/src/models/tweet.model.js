import { DataTypes } from "sequelize";
import { sequelize } from "../db/dbConnect.js";

const Tweet = sequelize.define('Tweet', {
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

// Associations will be defined in models/index.js to avoid circular dependencies

export { Tweet };