const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AboutContent = sequelize.define('AboutContent', {
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    subtitle: {
        type: DataTypes.STRING,
        allowNull: false
    },
    historyTitle: {
        type: DataTypes.STRING,
        allowNull: false
    },
    historyText1: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    historyText2: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    valuesTitle: {
        type: DataTypes.STRING,
        allowNull: true
    },
    values: {
        type: DataTypes.JSONB,
        allowNull: true
    },
    ctaTitle: {
        type: DataTypes.STRING,
        allowNull: true
    },
    ctaText: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    ctaButtonText: {
        type: DataTypes.STRING,
        allowNull: true
    }
  });

  return AboutContent;
};