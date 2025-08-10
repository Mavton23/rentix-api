const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
    const BlogCategory = sequelize.define('BlogCategory', {
      categoryId: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    }, {
      tableName: 'blog_categories',
      timestamps: true,
    });
  
    BlogCategory.associate = (models) => {
      BlogCategory.hasMany(models.BlogPost, {
        foreignKey: 'categoryId',
        as: 'posts',
      });
    };
  
    return BlogCategory;
  };