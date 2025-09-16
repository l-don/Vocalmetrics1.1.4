window.addEvent('domready', function() {
	
	var settings = {
		nw: false,	// node-webkit available?
		appTitle: 'VOCALMETRICS',
		appVersion: '1.1.3',
		dataModel: DataModel,
		DataType: DataType,
		loginRequired: true,
		adminPassword: 'elvis',
		canvas_id: 'canvas',
		// TODO height is not correct, because UI is not rendered yet
		width: $('canvas').getSize().x,
		height: $('canvas').getSize().y,
		path_audio: 'data/audio/',
		path_pdf: 'data/pdf/',
		path_img: 'data/img/',
		identifiers: {
			project: 'project',
			user: 'user'
		},
	    ratingScaleRange: [0,100],
	    stdAnimationTime: 750,
	    showZero: true,
	    hideFilter: false,
	    createDummyData: false
	}
	
	// create DataSkeleton
	var dataSkeleton = {};
	_.each(settings.dataModel, function(value, key){
		dataSkeleton[value.tableName] = [];
	});
	settings.dataSkeleton = dataSkeleton;

	// do special things when running in node-webkit
	// also changes settings
	nodeWebkitIndividuals();

	// VM initialization
	VM = new VM(settings);
	
	//////////////
	// Storage //
	//////////////
	// if not already set by node-webkit runtime
	if( settings.nw )
		VM.setStorageManager(new StorageManagerJSONFileNodeJS());
	else
		// VM.setStorageManager(new StorageManagerLocalStorage());
		VM.setStorageManager(new StorageManagerJSONFilePHP());
	
	var dm = new DataManager( settings );
	dm.loadData(0, initialize );


	// var initialize = function() {
	function initialize() {

		// create canvas
		VM.setCanvas(new Canvas());
		
		// create UI
		VM.setUI(new UI());
		VM.getUI().createStaticDOMElements();

		// create DataManager
		VM.setDM(new DataManager());

		
		// LOAD INITIAL VIEW:
    	if( VM.settings.loginRequired ) {
    		VM.loadView(new Admin(), true);
    	} else {
    		VM.setCurrentUser( VM.users[0] );
    		VM.setCurrentProject( VM.projects[0] );
    		// VM.loadView(new Flex());
    		VM.loadView(new Gravity());
    	}

	}

	function nodeWebkitIndividuals(){
		//////////////////////
	    // node-webkit only //
	    //////////////////////
	    try {
	        
	        // DEVTOOLS
	        // require('nw.gui').Window.get().showDevTools();
	    
	        // let us know that nw is alive
	        
	        // catch errors
	        // TODO not that nice: see https://github.com/rogerwang/node-webkit/issues/1699
	        process.on("uncaughtException", function(e) { console.log(e); });

	        // Fullscreen
	        var gui = require('nw.gui');
	        var win = gui.Window.get();
	        win.enterFullscreen();

	        // PATH to audio files
	        var audioPath = '';
	        var systemPathUnits = process.execPath.split('\\');
	        for(var i=0; i < systemPathUnits.length -2; i++){
	        	audioPath += systemPathUnits[i] + '\\';
	        	// audioPath += systemPathUnits[i] + '/';
	        };
	        audioPath = audioPath + 'data\\audio\\';
	        // audioPath = 'file:///' + audioPath + 'data\\audio\\';
	        // audioPath = 'file:///' + audioPath + 'data/audio/';
	        // console.log(audioPath);
	        settings.path_audio = audioPath;

	        settings.nw = true;

	        // live reload node-webkit on file changes
	        // var path = './';
	        // fs.watch(path, function() {
	        //     if (location)
	        //     location.reload();
	        // });
	        
	    }
	    catch(err) {
	        console.warn('node-webkit not available >> ' + err.message);
	        // console.warn(err.message);
	    }
	}

});