import { InsideHeartz } from '#database/init';
import { DataTypes } from '@sequelize/core';

export const GoogleAccountDB = InsideHeartz.define(
    'google_account',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isEmail: true,
            },
        },
        password: DataTypes.STRING,
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        tableName: 'google_account',
        freezeTableName: true,
    }
);