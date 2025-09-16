var StorageManagerJSONFilePHP = new Class({
		
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

			d3.json("data/database.json", function(json, error) {
		            
	            if (error) {
					callback();				
	            	return;
	            }
	            
				storedData = json;
				callback();
			});

			function callback(){
				if(storedData)
					cb(that.reinstantiateModelsFromData(storedData));
				else
					cb(null);
			}
		},

		save: function( cb, model, options ){
			var that = this;

			var dataToStore = JSON.stringify(that.minifyData());

			//////////////////////////
			// AJAX call to PHP API //
			//////////////////////////
	        var myRequest = new Request({
	            url: "php/api/",
			    method: 'post',
	            data: dataToStore,
			    onRequest: function(){
			        // myElement.set('text', 'loading...');
			    },
			    onSuccess: function(responseText){
			        // myElement.set('text', responseText);
			    },
			    onFailure: function(){
			        // myElement.set('text', 'Sorry, your request failed :(');
			    }
			});
			 
		    myRequest.send();
		},

		delete: function(model){
			that.save();
		}
});