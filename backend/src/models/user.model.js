import { DataTypes } from "sequelize";
import { sequelize } from "../db/dbConnect.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: { msg: 'username is required' }
        },
        set(value) {
            this.setDataValue('username', value?.toLowerCase()?.trim());
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
            notEmpty: { msg: 'email is required' }
        },
        set(value) {
            this.setDataValue('email', value?.toLowerCase()?.trim());
        }
    },
    fullName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'fullname is required' }
        },
        set(value) {
            this.setDataValue('fullName', value?.trim());
        }
    },
    avatar: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
        validate: {
            notEmpty: { msg: 'avatar is required' }
        }
    },
    coverImage: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: null
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Password is required' }
        }
    },
    refreshToken: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    timestamps: true,
    indexes: [
        { fields: ['username'] },
        { fields: ['fullName'] }
    ]
});

// Hash password before saving
User.beforeCreate(async (user) => {
    if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
    }
});

User.beforeUpdate(async (user) => {
    if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
    }
});

// Instance methods
User.prototype.comparePassword = async function(plainTextPassword) {
    return await bcrypt.compare(plainTextPassword, this.password);
};

User.prototype.generateAccessToken = function() {
    return jwt.sign(
        {
            id: this.id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    );
};

User.prototype.generateRefreshToken = function() {
    return jwt.sign(
        {
            id: this.id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    );
};

// WatchHistory will be defined after Video model is imported to avoid circular dependency
// See video.model.js for the association

export { User };