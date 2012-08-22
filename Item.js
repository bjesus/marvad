var Sequelize = require("sequelize");

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Item', {
    content: { type: Sequelize.TEXT, validate: { notNull: true } },
    kind: { type: Sequelize.STRING, defaultValue: "ride", validate: { isAlpha: true, notNull: true } },
    phone: { type: Sequelize.STRING, validate: { isNumeric: true, len: 10, notNull: true } },
    name: { type: Sequelize.STRING, validate: { notNull: true } },
    area: { type: Sequelize.STRING },
    time: { type: Sequelize.DATE, validate: { notNull: true } },
    })
}