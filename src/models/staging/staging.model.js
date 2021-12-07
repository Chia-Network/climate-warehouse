'use strict';
import Sequelize from 'sequelize';
const { DataTypes, Model } = Sequelize;
import { sequelize } from '../database';

class Staging extends Model {
  /**
   * Helper method for defining associations.
   * This method is not a part of Sequelize lifecycle.
   * The `models/index` file will call this method automatically.
   */
  static associate(models) {
    // define association here
  }
}

Staging.init(
  {
    id: {
      type: Sequelize.NUMBER,
      primaryKey: true,
    },
    uuid: Sequelize.STRING,
    table: Sequelize.STRING,
    action: Sequelize.STRING,
    data: Sequelize.STRING,
  },
  {
    sequelize,
    modelName: 'Staging',
  },
);

export { Staging };