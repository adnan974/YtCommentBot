import { InsideHeartz } from '#database/init';
import { DataTypes } from '@sequelize/core';
import { SortOptions } from 'constants/YoutubeSortEnum';

export const YoutubeConfigDB = InsideHeartz.define(
    'youtube_config',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        sortValue: {
            type: SortOptions.toString(),
            allowNull: false,
        },
        minViewsFilter : {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        maxViewsFilter : {
            type: DataTypes.INTEGER,
            allowNull: false,
        }
    },
    {
        tableName: 'youtube_config',
        freezeTableName: true,
    }
);