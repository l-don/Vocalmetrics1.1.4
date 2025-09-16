var StorageManagerSQLiteNodeJS = new Class({
		
		Extends: AbstractClass,
		
		/////////////////
		//Attributes //
		/////////////////


		initialize: function( cb ){
			
			var that = this;
			
			// that.settings = settings;

			// create database if not yet created
			var Sequelize = require('sequelize');

			that.definitions = {
				tables: [
					{
						tableName: 'User',
						fields: [
							{ name: 'id', dataType: Sequelize.STRING },
							{ name: 'firstname', dataType: Sequelize.STRING },
							{ name: 'surname', dataType: Sequelize.STRING },
							{ name: 'desc', dataType: Sequelize.STRING },
							{ name: 'email', dataType: Sequelize.STRING },
							{ name: 'phone', dataType: Sequelize.STRING },
							{ name: 'role', dataType: Sequelize.INTEGER },
							{ name: 'settings', dataType: Sequelize.STRING.BINARY }
						]
					}
				]
			};

			that.initSQLite(Sequelize, function(){
				cb();
			});
		},

		initSQLite: function(Sequelize, cb){
			var that = this;

			var sequelize = new Sequelize('vocalmetrics', null, null, {
		      dialect: "sqlite", // or 'sqlite', 'postgres', 'mariadb'
		      port:    3306, // or 5432 (for postgres)
		      storage: 'VM-database.sqlite',
		    });

		    sequelize
			  .authenticate()
			  .complete(function(err) {
			    if (!!err) {
			      console.log('Unable to connect to the database:', err)
			    } else {
			      console.log('Connection has been established successfully.')
			    }
			  });

			_.each(that.definitions.tables, function(table, index, list){
				console.debug(table);
				var fields = {};
				_.each(table.fields, function(field){
					fields[field.name] = field.dataType;
				});
				that[table.tableName] = sequelize.define(table.tableName, fields);
			});
			// that.User = sequelize.define('User', {
			// 	  id: Sequelize.STRING,
			// 	  firstname: Sequelize.STRING,
			// 	  surname: Sequelize.STRING,
			// 	  desc: Sequelize.STRING,
			// 	  email: Sequelize.STRING,
			// 	  phone: Sequelize.STRING,
			// 	  role: Sequelize.INTEGER,
			// 	  settings: Sequelize.STRING.BINARY
			// 	});

			sequelize
			  .sync({ force: true })
			  .complete(function(err) {
			     if (!!err) {
			       console.log('An error occurred while creating the table:', err)
			     } else {
			       console.log('It worked!')
			       cb();
			     }
			  });
		},

		save: function(model){
			var that = this;

			console.log('save:', model);
			
			// detect model type and write to the appropriate table
			// ...
			
			// stringify attributes of type object
			model.settings = JSON.stringify(model.settings);

			var user = that.User.build(model);
			 
			user
			  .save()
			  .complete(function(err) {
			    if (!!err) {
			      console.log('instance not saved:', err)
			    } else {
			      console.log('instance saved')
			      that.User
				  .find({ where: { firstname: model.get('firstname') } })
				  .complete(function(err, user) {
				    if (!!err) {
				      console.log('An error occurred while searching for John:', err)
				    } else if (!user) {
				      console.log('No user with the username "john-doe" has been found.')
				    } else {
				      console.log('Hello ' + user.firstname + '!')
				      console.log('All attributes of user:', user.values)
				    }
				  });
			    }
			  });
			
		},

		delete: function(model){
			// detect model type and write to the appropriate table
		}
});