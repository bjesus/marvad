var Sequelize = require("sequelize");

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Subscriber', {
    email: { type: Sequelize.STRING, unique: true, validate: { notNull: true, hasAt: function(value) { if(value.search('@') < 0) { throw new Error('Has to have @!') } } } },
    freq: { type: Sequelize.STRING, defaultValue: "post", validate: { notNull: true } },
    })
}