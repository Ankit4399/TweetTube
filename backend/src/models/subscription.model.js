import { DataTypes } from "sequelize";
import { sequelize } from "../db/dbConnect.js";

const Subscription = sequelize.define('Subscription', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    subscriberId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        },
        comment: 'one who is subscribing'
    },
    channelId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        },
        comment: 'one to whom subscriber subscribes'
    }
}, {
    timestamps: true,
    indexes: [
        { fields: ['subscriberId'] },
        { fields: ['channelId'] },
        { 
            unique: true,
            fields: ['subscriberId', 'channelId'],
            name: 'unique_subscription'
        }
    ]
});

// Associations will be defined in models/index.js to avoid circular dependencies

export { Subscription };