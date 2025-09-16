var StorageManagerJSONFileFileAPI = new Class({
		
		Extends: AbstractClass,
		
		/////////////////
		//Attributes //
		/////////////////

		initialize: function(){
			
			var that = this;
			
			// that.settings = settings;

		},

		initFileSystem: function(cb){
			var that = this;
			
			
			 
		},

		errorHandler: function(err){
			var msg = 'File System Error: ' + err.name + ': ' + err.message;
			console.log(msg);
		},

		getAllData: function(){
			var that = this;

			// JSON.parse(...)
		},

		save: function( cb, model, options ){
			var that = this;

			var data = [
				VM.settings,
				VM.users,
				VM.projects
			];

			//////////////////////////////////////////////////
			// store to file using HTML5 File System API //
			//////////////////////////////////////////////////

			navigator.webkitPersistentStorage.requestQuota(10*1024*1024, function(grantedBytes) {
			// window.webkitStorageInfo.requestQuota(PERSISTENT, 1000*1024*1024, function(grantedBytes) {
				window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
  				window.requestFileSystem(PERSISTENT, grantedBytes, initFS, that.errorHandler);
			}, function(e) {
			  console.log('Error', e);
			});

			// window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
 
			// window.requestFileSystem(window.PERSISTENT, 10*1024*1024, initFS, that.errorHandler);
			// window.requestFileSystem(window.TEMPORARY, 100*1024*1024, initFS, that.errorHandler);
			 
			function initFS(fs){
			  
			  fs.root.getFile('zzz.txt', {create: true}, function(fileEntry) {
				  fileEntry.createWriter(function(fileWriter) {
				    
				    // window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder;
				    // var bb = new BlobBuilder();
				    // bb.append(JSON.stringify(data));
				    // bb.append('test');
				    // fileWriter.write(bb.getBlob('text/plain'));
				    
				    fileWriter.onwriteend = function(e) {
				        console.log('Write completed.');
				      };

				      fileWriter.onerror = function(e) {
				        console.log('Write failed: ' + e.toString());
				      };
				    var blob = new Blob(['Lorem Ipsum'], {type: 'text/plain'});
				    fileWriter.write(blob);

				  }, that.errorHandler);
				}, that.errorHandler);
			}

			// fs.writeFile("vocalmetrics.json", JSON.stringify(data), function(err) {
			
		},

		delete: function(model){
			// not needed
		}
});