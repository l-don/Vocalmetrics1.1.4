var StorageManagerJSON = new Class({
		
		Extends: AbstractClass,
		
		/////////////////
		//Attributes //
		/////////////////

		initialize: function(){
			var that = this;
		},

		getAllData: function(cb){
			var that = this;

			var storedData;

			var fs = require('fs');
			fs.readFile('data/database.json', 'utf8', function (err, data) {
				
				if (err) {
					console.log('Error: ' + err);
					return;
				}
			 
			  	storedData = JSON.parse(data);
			 
			  	console.dir(storedData);
				
				if(storedData)
					// return that.reinstantiateModelsFromData(storedData);
					cb(that.reinstantiateModelsFromData(storedData));
				else
					// return null;
					cb(null);
			});

		},

		minifyData: function(){
			var that = this;

			var dataToStore = {};

			// only store data that is defined in the data model (actual state data)
			_.each(VM.settings.dataModel, function(definition, modelName){
				
				var tableName = definition.tableName,
					fields = definition.fields,
					fieldsRelational = definition.fieldsRelational;

				dataToStore[tableName] = [];

				// go through all existing models and take out the needed data
				_.each( VM[tableName], function( model ){
					
					var storeModel = {};
					
					// store normal fields directly
					_.each(fields, function(field){

						if( field.doNotStore )
							return false;
						// if(field.name === 'featureGroups')
						// 	return false;
						storeModel[field.name] = model.get(field.name);

					});

					// store relational fields: only the related IDs
					_.each(fieldsRelational, function(field){
						

						if( field.doNotStore )
							return false;

						var fieldValue = model.get(field.name);

						// e.g. 'User.ratings', 'Project.featureDefinitions'
						if( Array.isArray(fieldValue) ){
							
							storeModel[field.name] = [];
							_.each(fieldValue, function( relatedModel ){
								storeModel[field.name].push(relatedModel.get('id'));
							});

						}
						// e.g. 'parentModel'
						else {
							storeModel[field.name] = fieldValue.get('id');
						}
					});

					dataToStore[tableName].push(storeModel);

				});

			});

			return dataToStore;
		},

		/** instantiates models with data from storage;
			only instantiates data that is defined in the data model */
		reinstantiateModelsFromData: function(storedData){
			var that = this;

			var data = VM.settings.dataSkeleton;

			/////////////////////////////////////
			// create models from storage data //
			// (generic)
			/////////////////////////////////////
			
			// I) instantiate all models from storage data
			_.each(VM.settings.dataModel, function(definition, modelName){
				
				var tableName = definition.tableName,
					fields = definition.fields,
					fieldsRelational = definition.fieldsRelational;

				_.each(storedData[tableName], function(storageModel){
					
					var modelData = {};

					// load normal fields directly
					_.each( _.union(fields, fieldsRelational), function(field){
						
						if( field.doNotStore )
							return false;
						
						modelData[field.name] = storageModel[field.name];
					});

					var model = new window[modelName](modelData);
					data[tableName].push(model);

				});
			
			});

			// II) update relational fields in all models (replace model-ID with model object)
			_.each(VM.settings.dataModel, function(definition, modelName){
				
				var tableName = definition.tableName,
					fields = definition.fields,
					fieldsRelational = definition.fieldsRelational;

				_.each(data[tableName], function(model){

					_.each(fieldsRelational, function(field){
						
						var fieldValue = model.get(field.name);

						// e.g. 'User.ratings', 'Project.featureDefinitions'
						if( Array.isArray(fieldValue) ){
							
							var relatedModels = [];
							
							_.each(fieldValue, function( relatedModelId ){
								
								var possibleRelatedModels = data[VM.settings.dataModel[field.modelName].tableName];
								var relatedModel = _.find(possibleRelatedModels, function(pModel){
									return pModel.get('id') === relatedModelId;
								});
								relatedModels.push(relatedModel);

							});

							model.set(field.name, relatedModels);

						}
						// e.g. 'parentModel'
						else {

							var possibleRelatedModels = data[VM.settings.dataModel[field.modelName].tableName];
							var relatedModel = _.find(possibleRelatedModels, function(pModel){
								return pModel.get('id') === fieldValue;
							});
							model.set(field.name, relatedModel);

						}
					});

				});

			});

			return data;
		},

		exportAllDataToFile: function(){
			var that = this;

			var exportData = JSON.stringify(that.minifyData());

			var downloadLink = new Element('a', { href: 'data:application/json;charset=utf-8,' + encodeURIComponent(exportData), target: '_blank', download: 'database.json'});
        	downloadLink.dispatchEvent(new CustomEvent('click'));
		},

		save: function( cb, model, options ){
			console.warn('must be implemented in child');
		},

		delete: function(model){
			that.save();
		}
});