var DataManager = new Class({
		
		Extends: AbstractClass,
		
		/////////////////
		//Attributes //
		/////////////////

		initialize: function( settings ){
			
			var that = this;
			
			that.settings = settings;
		},

		/**
		 * load data from web storage or external source
		 * @param  {Number}   step
		 * @param  {Function} cb 	function to execute when data is loaded and ready to use
		 */
		loadData: function(step, cb) {
			console.log('loadData', step);
			var that = this;
			
			switch(step) {
				case 0:

					// load available data from storage
					VM.getStorageManager().getAllData(function(storageData){

						that.data = storageData;

						if(that.data) {
							// load data from storage
							console.log('load data from storage');
							that.loadData(1, cb);
						}
						else {
							// load default data
							console.log('load default data');
							that.initData(function( data ){
								that.data = data;
								that.loadData(1, cb);
							});
						}
					});
					break;
				case 1:

					///////////////////////////
					// PUT DATA INTO VM //
					///////////////////////////
					_.each(VM.settings.dataSkeleton, function(value, key){
						if(that.data[key]) VM[key] = that.data[key];
							else VM[key] = value;						
					});

					// invoke writing to persitent storage
					// TODO only necassary if data not read from storage
					VM.users[0].save();

					// then call callback
					cb();
					break;
			}
		},

		/**
		 * create data skeleton, if database is empty
		 * @return {Object} 
		 */
		initData: function(cb) {
			var that = this;

			if(VM.settings.createDummyData) {
				that.createDummyData(VM.settings.dataSkeleton, function(dummyData){
					var data = that.createDefaultData(dummyData);
					cb(data);
				});
			}
			else {
				var data = that.createDefaultData(VM.settings.dataSkeleton);
				cb(data);
			}

		},

		createDefaultData: function( dataSkeleton ){
			var that = this;
			
			// new user
			var admin = new User( {firstname: 'Admin', desc: '', role: 0} );
			dataSkeleton.users.push(admin);

			return dataSkeleton;
		},

		///////////////////////////////////////////////////////////////////
		// dummy data >> TODO no need after login process implemented //
		///////////////////////////////////////////////////////////////////
		createDummyData: function( dataSkeleton, cb ) {
			var that = this;

			// USER
			var felix = new User({
				firstname: 'Felix',
				surname: 'Schönfeld',
				desc: 'TU Dresden',
				email: 'fische@courages.net',
				role: 0
			});
			dataSkeleton.users.push(felix);

			// USER
			var tilo = new User({
				firstname: 'Tilo',
				surname: 'Hähnel',
				desc: 'HfM Weimar',
				email: 'tilo.haehnel@hfm-weimar.de',
				role: 0
			});
			dataSkeleton.users.push(tilo);

			// USER
			var axel = new User({
				firstname: 'Axel',
				surname: 'Berndt',
				desc: 'TU Dresden',
				email: 'axel.berndt@tu-dresden.de',
				role: 1
			});
			dataSkeleton.users.push(axel);

			// USER
			var martin = new User({
				firstname: 'Martin',
				surname: 'Pfleiderer',
				desc: 'HfM Weimar',
				email: 'martin.pfleiderer@hfm-weimar.de',
				role: 1
			});
			dataSkeleton.users.push(martin);

			// PROJECT
			var vocalmetrics = new Project({
				name: 'Voice and Singing',
			    desc: 'Exploring multiple dimensions of singing in early popular music recordings',
			});

			var featureDefs = [
				new FeatureDefinition({
					parentDataset: vocalmetrics,
					name: 'title',
					displayName: 'Title',
					dataType: that.settings.featureDataTypes.string,
					ratable: false,
					enabledForDC: false
				}),
				new FeatureDefinition({
					parentDataset: vocalmetrics,
					name: 'artist',
					displayName: 'Artist',
					dataType: that.settings.featureDataTypes.string,
					ratable: false,
					enabledForDC: false
				}),
				new FeatureDefinition({
					parentDataset: vocalmetrics,
					name: 'release_year',
					displayName: 'Year',
					dataType: that.settings.featureDataTypes.number,
					ratable: false,
					enabledForDC: false
				}),
				new FeatureDefinition({
					parentDataset: vocalmetrics,
					name: 'file_audio',
					displayName: 'Audio sample',
					dataType: that.settings.featureDataTypes.fileAudio,
					ratable: false,
					enabledForDC: false
				}),
				new FeatureDefinition({
					parentDataset: vocalmetrics,
					name: 'file_frequence',
					displayName: 'Spectrogram',
					dataType: that.settings.featureDataTypes.fileOther,
					ratable: false,
					enabledForDC: false
				}),
				new FeatureDefinition({
					parentDataset: vocalmetrics,
					name: 'file_pdf',
					displayName: 'PDF',
					dataType: that.settings.featureDataTypes.fileOther,
					ratable: false,
					enabledForDC: false
				}),
				new FeatureDefinition({
					parentDataset: vocalmetrics,
					name: 'label',
					displayName: 'Label',
					dataType: that.settings.featureDataTypes.string,
					ratable: false,
					enabledForDC: false
				}),
				new FeatureDefinition({
					parentDataset: vocalmetrics,
					name: 'genre',
					displayName: 'Genre',
					dataType: that.settings.featureDataTypes.string,
					ratable: false,
					enabledForDC: false
				}),
				new FeatureDefinition({
					parentDataset: vocalmetrics,
					name: 'gender',
					displayName: 'Gender',
					dataType: that.settings.featureDataTypes.string,
					ratable: false,
					enabledForDC: false
				}),
				new FeatureDefinition({
					parentDataset: vocalmetrics,
					name: 'vibrato',
					displayName: 'Vibrato',
					dataType: that.settings.featureDataTypes.number,
					ratable: true,
					enabledForDC: true
				}),
				new FeatureDefinition({
					parentDataset: vocalmetrics,
					name: 'glissando',
					displayName: 'Glissando',
					dataType: that.settings.featureDataTypes.number,
					ratable: true,
					enabledForDC: true
				}),
				new FeatureDefinition({
					parentDataset: vocalmetrics,
					name: 'intensity',
					displayName: 'Intensity',
					dataType: that.settings.featureDataTypes.number,
					ratable: true,
					enabledForDC: true
				}),
				new FeatureDefinition({
					parentDataset: vocalmetrics,
					name: 'roughness',
					displayName: 'Roughness',
					dataType: that.settings.featureDataTypes.number,
					ratable: true,
					enabledForDC: true
				}),
				new FeatureDefinition({
					parentDataset: vocalmetrics,
					name: 'breathiness',
					displayName: 'Breathiness',
					dataType: that.settings.featureDataTypes.number,
					ratable: true,
					enabledForDC: true
				}),
				new FeatureDefinition({
					parentDataset: vocalmetrics,
					name: 'register',
					displayName: 'Register',
					dataType: that.settings.featureDataTypes.number,
					ratable: true,
					enabledForDC: true
				}),
				new FeatureDefinition({
					parentDataset: vocalmetrics,
					name: 'articulation',
					displayName: 'Articulation',
					dataType: that.settings.featureDataTypes.number,
					ratable: true,
					enabledForDC: true
				}),
				new FeatureDefinition({
					parentDataset: vocalmetrics,
					name: 'rubato',
					displayName: 'Rubato',
					dataType: that.settings.featureDataTypes.number,
					ratable: true,
					enabledForDC: true
				}),
				new FeatureDefinition({
					parentDataset: vocalmetrics,
					name: 'offbeat',
					displayName: 'Offbeat',
					dataType: that.settings.featureDataTypes.number,
					ratable: true,
					enabledForDC: true
				})
			];
			featureDefs.each(function(f){
				vocalmetrics.addFeatureDefinition(f);
			});
			vocalmetrics.assignUser(felix);
			vocalmetrics.assignUser(tilo);
			vocalmetrics.assignUser(axel);
			vocalmetrics.assignUser(martin);
			dataSkeleton.projects.push(vocalmetrics);

			// PROJECT
			var nutrients = new Project({
				name: 'Nutrients',
			    desc: 'Finding healthy food.'
			});

			var featureDefs2 = [
				new FeatureDefinition({
					parentDataset: nutrients,
					name: 'name',
					displayName: 'Name',
					dataType: that.settings.featureDataTypes.string,
					ratable: false,
					enabledForDC: false
				}),
				new FeatureDefinition({
					parentDataset: nutrients,
					name: 'category',
					displayName: 'Category',
					dataType: that.settings.featureDataTypes.string,
					ratable: false,
					enabledForDC: false
				}),
				new FeatureDefinition({
					parentDataset: nutrients,
					name: 'energy',
					displayName: 'Energy',
					dataType: that.settings.featureDataTypes.number,
					ratable: false,
					enabledForDC: true
				}),
				new FeatureDefinition({
					parentDataset: nutrients,
					name: 'protein',
					displayName: 'Protein',
					dataType: that.settings.featureDataTypes.number,
					ratable: false,
					enabledForDC: true,
					rangeOfValues: [0,100]
				}),
				new FeatureDefinition({
					parentDataset: nutrients,
					name: 'carbo',
					displayName: 'Carbohydrates',
					dataType: that.settings.featureDataTypes.number,
					ratable: false,
					enabledForDC: true
				}),
				new FeatureDefinition({
					parentDataset: nutrients,
					name: 'sugars',
					displayName: 'Sugars',
					dataType: that.settings.featureDataTypes.number,
					ratable: false,
					enabledForDC: true
				}),
				new FeatureDefinition({
					parentDataset: nutrients,
					name: 'water',
					displayName: 'Water',
					dataType: that.settings.featureDataTypes.number,
					ratable: false,
					enabledForDC: true
				}),
				new FeatureDefinition({
					parentDataset: nutrients,
					name: 'calcium',
					displayName: 'Calcium',
					dataType: that.settings.featureDataTypes.number,
					ratable: false,
					enabledForDC: true
				}),
				new FeatureDefinition({
					parentDataset: nutrients,
					name: 'vitc',
					displayName: 'Vit C',
					dataType: that.settings.featureDataTypes.number,
					ratable: false,
					enabledForDC: true
				}),
				new FeatureDefinition({
					parentDataset: nutrients,
					name: 'vitb12',
					displayName: 'Vit B12',
					dataType: that.settings.featureDataTypes.number,
					ratable: false,
					enabledForDC: true
				}),
				new FeatureDefinition({
					parentDataset: nutrients,
					name: 'iron',
					displayName: 'Iron',
					dataType: that.settings.featureDataTypes.number,
					ratable: false,
					enabledForDC: true
				}),
				new FeatureDefinition({
					parentDataset: nutrients,
					name: 'fat',
					displayName: 'Fat',
					dataType: that.settings.featureDataTypes.number,
					ratable: false,
					enabledForDC: true
				}),
				new FeatureDefinition({
					parentDataset: nutrients,
					name: 'satFat',
					displayName: 'Sat. Fat',
					dataType: that.settings.featureDataTypes.number,
					ratable: false,
					enabledForDC: true
				}),
				new FeatureDefinition({
					parentDataset: nutrients,
					name: 'monoSatFat',
					displayName: 'Monosat. Fat',
					dataType: that.settings.featureDataTypes.number,
					ratable: false,
					enabledForDC: true
				}),
				new FeatureDefinition({
					parentDataset: nutrients,
					name: 'polySatFat',
					displayName: 'Polysat. Fat',
					dataType: that.settings.featureDataTypes.number,
					ratable: false,
					enabledForDC: true
				}),
				new FeatureDefinition({
					parentDataset: nutrients,
					name: 'cholesterol',
					displayName: 'Cholesterol',
					dataType: that.settings.featureDataTypes.number,
					ratable: false,
					enabledForDC: true
				}),
				new FeatureDefinition({
					parentDataset: nutrients,
					name: 'fiber',
					displayName: 'Fiber',
					dataType: that.settings.featureDataTypes.number,
					ratable: false,
					enabledForDC: true
				})
			];

			featureDefs2.each(function(f){
				nutrients.addFeatureDefinition(f);
			});

			var dummyData = [
				{
					sort: 'Avocado',
					energy: 188,
					protein: 2.6,
					carbo: 1.5,
					sugars: 1.4,
					fat: 18.1,
					satFat: 3.8,
					monoSatFat: 11.3,
					polySatFat: 2,
					cholesterol: 0,
					fiber: 6.4
				},
				{
					sort: 'Asparagus',
					energy: 17,
					protein: 1.9,
					carbo: 1.3,
					sugars: 1.2,
					fat: 0.2,
					satFat: 0,
					monoSatFat: 0,
					polySatFat: 0,
					cholesterol: 0,
					fiber: 1.5
				},
				{
					sort: 'Apple',
					energy: 54,
					protein: 0.4,
					carbo: 12,
					sugars: 11.8,
					fat: 0,
					satFat: 0,
					monoSatFat: 0,
					polySatFat: 0,
					cholesterol: 0,
					fiber: 2.3
				}
			];

			var datasets = [];
			dummyData.each(function(dummy){
				datasets.push(new Dataset({values: dummy, parentDataset: nutrients}));
			})

			nutrients.assignUser(felix);
			dataSkeleton.projects.push(nutrients);

			that.importDatasetsFromFile(vocalmetrics, that.settings.xmlFile, 'xml', function() {
				cb(dataSkeleton);
			});

			// nutrients.addDatasets(datasets);
			// that.importDatasetsFromFile(nutrients, that.settings.csvFile, 'csv', function() {
			// 	cb(dataSkeleton);
			// });
		},

		/**
		 * import a whole project from backup file (JSON)
		 * @param  {[type]} file the JSON file
		 * @return {Project}     a Project Object
		 */
		importProjectFromFile: function( file ) {
			var that = this;
		},

		/**
		 * import datasets into an existing project from file (XML, CSV)
		 * the project's feature names must be identical with the column heads in the file
		 * @param  {[type]} project the project where datasets to be imported
		 * @param  {[type]} file    XML or CSV file
		 * @param  {String} type    one of ['xml', 'csv']
		 * @param  {function} cb    callback function to call after file was read
		 * @return {[type]}         
		 */
		importDatasetsFromFile: function( project, file, type, cb ) {
			var that = this;

			if(type === 'xml') {

				console.log('import datasets from xml: ' + file);

				var datasets = [];
				d3.xml(file, function(xml){
					
					// TODO make universal (here nodes are named "sound"!)
					// iterate through the datasets
					d3.select(xml).selectAll('sound').each(function() {
						// as array
						var object = {};
						d3.select(this).selectAll('*').each(function() {
							var attributeName = this.nodeName;
							var attributeValue = d3.select(this).text();
							
							// only extract those features, that are defined in the project
							var featureDef = project.getFeatureDefinition(attributeName);
							if( featureDef ) {
								// if feature is numeric type
								if( featureDef.dataType === that.settings.featureDataTypes.number )
									attributeValue = parseFloat(attributeValue);
								object[attributeName] = attributeValue;
							}
						});
						dataset = new Dataset( {values: object, parentDataset: project} );
						datasets.push(dataset);
						// datasets.push(object);
					});

					// map ratable feature values into [0,100]
					datasets.each(function( dataset ){ dataset.scaleRatableFeatureValues(that.settings); });
					
					// finished reading XML
					project.addDatasets(datasets);
					// that.storeDataInWS({name: 'datasets', value: that.datasets});
					// that.store()
					console.log(datasets.length + ' datasets imported');
					cb();
				});
			}
			else if(type === 'csv') {

				console.log('import datasets from csv: ' + file);

				var datasets = [];
				d3.csv(file, function(rows){

					var object = {};
					
					rows.each(function(row){
						for(var attributeName in row){

							var attributeValue = row[attributeName];
							if(!attributeValue) attributeValue = 0;

							// only extract those features, that are defined in the project
							var featureDef = project.getFeatureDefinition(attributeName);
							if( featureDef ) {
								// if feature is numeric type
								if( featureDef.dataType === that.settings.featureDataTypes.number ){
									attributeValue = parseFloat(attributeValue);
									if(attributeValue === NaN) attributeValue = 0;
								}
								object[attributeName] = attributeValue;
							}
						}

						dataset = new Dataset( {values: object, parentDataset: project} );
						datasets.push(dataset);
					});

					// map ratable feature values into [0,100]
					datasets.each(function( dataset ){ dataset.scaleRatableFeatureValues(that.settings); });
					
					// finished reading XML
					project.addDatasets(datasets);

					console.log(datasets.length + ' datasets imported');
					cb();
				},
				// if error
				function(error, rows){
					console.warn(error, rows);
				});
    		}
		},

		/**
		 * filters the initial sound collection according to the specified options, e.g. by an artist's name or a label's name 
	 * @param {Object} options
		 */
		filter: function(options) {
//    	console.log(options);
			var that = this;
			var sounds = VM.getCurrentProject().getAllDatasets();

			var result = [];    	
			for (var i=0;i<sounds.length;i++) {
				
				var check = true;
				for(var option in options) {
					
					// FEATURE filter
					if(option == 'feature') {
						if(!VM.settings.showZero && !(parseFloat(sounds[i][options[option]]) > 0)) {
							console.log(sounds[i]);
							check = false;
						}
					}
					// META filter
					else if(sounds[i][option] !== options[option]) {
						check = false;
					}

				}
				
				if(check) result.push(sounds[i]);
				
			}
			return result;
		},

		/** just get the name of a data type of a FeatureDefinition */
		getDataTypeName: function( number ){
			var that = this;

			var name;
			
			_.each(VM.settings.DataType, function(value, key){
                if(value === number) name = key;
            });

            return name;
		},

		/**
		 * returns the average values of the specified features of the specified datasets
		 * @param  {Object} args { datasets: [...], features: [...]}
		 * @return {Object} [ {feature: fd, averageValue: xxx} ]
		 */
		getAverageValuesOf: function( args ){
			var that = this;

			var result = [];
			
			args.features.each(function( fd ){

				var values = [];
				args.datasets.each(function( dataset ){
					values.push( dataset.getFeature(fd.get('name')) );
				});

				var sum = 0;
				values.each(function( value ){
				    sum += value;
				});

				var averageValue = sum / args.datasets.length;

				result.push( {feature: fd, averageValue: averageValue} );
			});

			return result;
		},
		
		/**
		 * calculates the average of all attributes of the passed in sounds
		 * @param {Array} sounds: custom sound collection; if null, the initial sound collection is used
		 * @param {Object} sign: to have a context value and not only attribute values in the return 
		 * @return {Object} an object containing the average values of the attributes and the value of parameter sign
		 */
		average: function(sign, sounds, excludes) {
			
			var that = this;

		(sounds === undefined) ? sounds = VM.getCurrentProject().getAllDatasets() : {};

		var result = {};
			
			for (var i=0;i<sounds.length;i++) {
			
			var k = 0;
			for(var attribute in sounds[i]) {
				var before;
				if(i>0) {
					before = result[attribute];	
				} else {
					before = 0;
				} 
				result[attribute] = parseFloat(before) + parseFloat(sounds[i][attribute]);
				k++;
			}
			}
			
			// make average
			for(var attribute in result) {
						if(excludes != undefined && excludes.contains(attribute)) {
								result[attribute] = '-';
						} else {
								result[attribute] /= sounds.length;
						}
			}
			
			// add sign
			for(var attribute in sign) {
				result[attribute] = sign[attribute];
			}
			
			return result;
		},
		
		/**
		 * group sounds by year
		 * @return {year: [sound, sound, sound], year: [sound, sound, sound]} 
		 */
		groupByYear: function(sounds) {
		
		var yearGroups = {};
		
			sounds.forEach(function(el,i){
				//console.log(el);
				if(yearGroups[el.release_year] === undefined) {
					yearGroups[el.release_year] = [el];
				} else {
					yearGroups[el.release_year].push(el);
				}
			});
			
			return yearGroups;	
		},

		/**
		 * groupByXY()
		 * group sounds by (x,y) position
		 * @param array of sounds, feature for x-axis, feature for y-axis
		 * @return array of sounds, sounds are enriched with additional attribute for group belonging (sound.group)
		 */
		groupByXY: function(sounds, xFeature, yFeature) {
				var that = this;

				var result = [];    // array of sounds, sounds have additional attribute sound.group
				var nested = d3.nest()
						.key(function(d) { return d.getFeature(xFeature); })
						.key(function(d) { return d.getFeature(yFeature); })
						.entries(sounds);

				var groups = [];
				nested.each(function(itemX) {    // d3's internal each() function
						itemX.values.each(function(itemY) {
								groups.push(itemY);
						});
				});

				groups.each(function(itemY, i) {
						itemY.values.each(function(sound) {
								sound.group = i;
								result.push(sound);
						});
				});

				return result;
		},
		
		/**
		 * calculate data for FeatureMatrix view
		 * @return: max. 9x60=540 data points like [{release_year: 1906, vibrato: 1.55}, {release_year: 1906, glissando: 2.81}, ... ] 
		 */
		calculateFeatureMatrix: function(){
			
			var that = this;
			
			var result = [];
			var yearGroups = that.groupByYear(VM.getCurrentProject().getAllDatasets());
			// console.log(yearGroups);
			
			for(var year in yearGroups){
				var currentYear = yearGroups[year];
				var averageYear = that.average({year: year}, currentYear);
				// console.log(averageYear);
				
				for(var feature in averageYear) {
				if(VM.settings.featureList.contains(feature)) {
					var datum = {};
					datum['release_year'] = averageYear.release_year;
					datum['feature'] = feature;
					datum['value'] = averageYear[feature];
					result.push(datum);
				}   		
				}
			}
			// console.log(result.length, result);
			return result;
			
		},
		
		/**
		 * sort sounds array by years
		 * @param sounds
		 * @return {*}
		 */
		sortByYear: function(sounds) {
			
			var that = this;

		(sounds === undefined) ? sounds = VM.getCurrentProject().getAllDatasets() : {};
		
		sounds.sort(function(a,b){
			if(a.release_year < b.release_year)
				return -1;
			if(a.release_year > b.release_year)
				return 1;
			return 0;
		});
			
			return sounds;
		},
		
		/**
		 * gives an array of all unique entries of a specified meta type,
		 * e.g. a list of all artists ["Anita O'Day", "Aretha Franklin", "Alberta Hunter", ...]
		 * @param meta type of meta, e.g. ['artist'] or ['label']
		 * @return {Array} with all unique entries of specified meta type
		 */
		getListOf: function(meta) {
				var that = this;

				var sounds = VM.getCurrentProject().getAllDatasets();
				var result = [];

				var nested = d3.nest()
						.key(function(d) { return d[meta]; })
						.entries(sounds);

				nested.each(function(item, i) {
					 result.push(item.key);
				});

				return result;
		}
});