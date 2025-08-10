const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Testimonial = sequelize.define('Testimonial', {
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isEmail: true
        }
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5
        }
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      approved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      propertyId: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    }, {
        timestamps: true
    });
  
    return Testimonial;
  };