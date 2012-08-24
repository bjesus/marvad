var Sequelize = require("sequelize");

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Item', {
    content: { type: Sequelize.TEXT, validate: { notNull: true } },
    kind: { type: Sequelize.STRING, defaultValue: "ride", validate: { isAlpha: true, notNull: true } },
    phone: { type: Sequelize.STRING, validate: { isNumeric: true, notNull: true,  isTen: function(value) { if(value.length !== 10) { throw new Error('Has to be exactly 10 digits!') } } } },
    name: { type: Sequelize.STRING, validate: { notNull: true, hasSpace: function(value) { if(value.search(' ') < 0) { throw new Error('Has to have space!') } } } },
    area: { type: Sequelize.STRING },
    time: { type: Sequelize.DATE, validate: { notNull: true } },
    })
}