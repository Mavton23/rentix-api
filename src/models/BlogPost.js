const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const BlogPost = sequelize.define('BlogPost', {
    postId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    excerpt: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    coverImage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    authorId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    readTime: {
      type: DataTypes.INTEGER, // minutos
      allowNull: false,
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'draft',
      validate: {
        isIn: [['draft', 'published', 'archived']]
      }
    },
    seoTitle: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    seoDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metaKeywords: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    allowComments: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    tableName: 'blog_posts',
    timestamps: true,
    paranoid: true,
  });

  BlogPost.associate = (models) => {
    BlogPost.belongsTo(models.Manager, {
      foreignKey: 'authorId',
      as: 'author',
    });
    BlogPost.belongsTo(models.BlogCategory, {
      foreignKey: 'categoryId',
      as: 'category',
    });
  };

  return BlogPost;
};