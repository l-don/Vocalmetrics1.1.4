var StorageManagerJSONFileNodeJS = new Class({
		
		Extends: StorageManagerJSON,
		
		/////////////////
		//Attributes //
		/////////////////

		initialize: function(){
			
			var that = this;
			
			// that.settings = settings;

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
					cb(that.reinstantiateModelsFromData(storedData));
				else
					cb(null);
			});

		},

		save: function( cb, model, options ){
			var that = this;

			var dataToStore = that.minifyData();

			/////////////////////////
			// Node.js File System //
			/////////////////////////
			var fs = require('fs');
			fs.writeFile("data/database.json", JSON.stringify(dataToStore), function(err) {
			    if(err) {
			        console.log(err);
			    } else {
			        console.log("The file was saved!");
			        // cb();
			    }
			});
			
		},

		delete: function(model){
			that.save();
		}
});