var StorageManagerLocalStorage = new Class({
		
		Extends: StorageManagerJSON,
		
		///////////////
		//Attributes //
		///////////////

		options: {
			readLocalJsonFile: true,
			webStorageIdentifier: 'vocalmetrics_data'
		},

		initialize: function(){
			var that = this;
		},

		getAllData: function(cb){
			var that = this;

			var storedData;

			if (that.options.readLocalJsonFile) {
				
				d3.json("data/database.json", function(json, error) {
		            
		            if (error) {
						readFromLocalStorage();				
		            	return;
		            }
		            
					storedData = json;
					callback();
				});

			}
			else {
				readFromLocalStorage();				
			}

			function readFromLocalStorage(){
				var ws = localStorage.getItem(that.options.webStorageIdentifier);
				storedData = (ws) ? JSON.parse(ws) : null;
				callback();
			}

			function callback(){
				if(storedData)
					cb(that.reinstantiateModelsFromData(storedData));
				else
					cb(null);
			}
		},

		save: function( cb ){
			var that = this;

			var dataToStore = that.minifyData();

			///////////////////////////////////
			// Browser's HTML5 Local Storage //
			///////////////////////////////////
			console.log('save:', dataToStore);
			var json = JSON.stringify(dataToStore);
			
			localStorage.setItem(that.options.webStorageIdentifier, json);

		},

		delete: function(model){
			that.save();
		},

		/** REMOVE ALL DATA IN STORAGE */
		wipeout: function(){
			console.warn('ALL DATA REMOVED');
        	localStorage.removeItem(that.options.webStorageIdentifier);
			location.reload(); 
		}

});