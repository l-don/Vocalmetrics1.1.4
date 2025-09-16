var Project = new Class({
    
    Extends: AbstractModel,

    ///////////////
    //Attributes //
    ///////////////
    
    attributes: {
        nameInDataModel: 'Project'
    },

    initialize: function( attributes ){
        var that = this;

        // if(!attributes) throw new Error( "missing parameter in Constructor" );

         // CALL PARENT (creates properties)
        this.parent(that.attributes.nameInDataModel, attributes);
    },

    ///////////////////////
    // FeatureDefinition //
    ///////////////////////

    getAllFeatureDefinitions: function() {
        // console.debug('Project:getAllFeatureDefinitions()');
        return this.get('featureDefinitions').sort(function(a, b){return a.get('sort')-b.get('sort')});
    },

    /**
     * returns a list with the names of all defined features
     * @return {Array} e.g. ['name', 'id', 'vibrato', ... ]
     */
    getListOfFeatureDefinitions: function() {
        var list = [];
        this.getAllFeatureDefinitions().each(function( fd ) {
            list.push( fd.get('name') );
        });
        return list;
    },

    addFeatureDefinition: function( featureDef ) {
        var that = this;

        that.get('featureDefinitions').push(featureDef);

        that.groupFeatureDefinitions();
    },

    removeFeatureDefinition: function( model ) {
        var that = this;

        that.set('featureDefinitions', _.reject(that.get('featureDefinitions'), function(m){
            return m.get('id') === model.get('id');
        }));
    }, 

    sortFeatureDefinitions: function(){
        var that = this;

        _.each(that.getAllFeatureDefinitions(), function(fd, i){
            fd.set('sort', i);
        });
    },

    changeSortingOfFeatureDefinition: function(fd, direction){
        var that = this;

        // move up
        if(direction){
            if( fd.get('sort') === 0) return;
            
            var concurrent = _.find(that.getAllFeatureDefinitions(), function(otherFD){
                return otherFD.get('sort') === fd.get('sort') - 1;
            });

            var newSort = concurrent.get('sort');
            concurrent.set('sort', newSort +1);
            fd.set('sort', newSort);
        }
        // move down
        else {
            if( fd.get('sort') === that.getAllFeatureDefinitions().length - 1) return;
            
            var concurrent = _.find(that.getAllFeatureDefinitions(), function(otherFD){
                return otherFD.get('sort') === fd.get('sort') + 1;
            });

            var newSort = concurrent.get('sort');
            concurrent.set('sort', newSort -1);
            fd.set('sort', newSort);
        }
    },

    /**
     * get a FeatureDefinition object by its name
     * @param  {String} name as specified in FeatureDefinition.name
     * @return {FeatureDefinition}
     */
    // getFeatureDefinition: function( name ) {
    //     var that = this;

    //     var featureDef = null;
    //     that.get('featureDefinitions').each(function(fd){
    //         if( name === fd.get('name') ) {
    //             featureDef = fd;
    //             return false;
    //         }
    //     });
    //     return featureDef;
    // },

    /////////////
    // Dataset //
    /////////////

    getAllDatasets: function() {
        // console.debug('Project:getAllDatasets()');
        // return this.datasets;
        return this.get('datasets');
    },

    addDataset: function( model ){
        var that = this;

        // that.datasets.push(model.get('id'));
        that.get('datasets').push(model);
    },

    removeDataset: function( model ) {
        var that = this;

        // that.set('datasets', _.without(that.get('datasets'), model));
        that.set('datasets', _.reject(that.get('datasets'), function(m){
            return m.get('id') === model.get('id');
        }));

    },

    removeAllDatasets: function(){
        var that = this;

        var modelsToRemove = that.getAllDatasets();

        _.each(modelsToRemove, function(model){
            VM.removeDataset(model);
        });
    },

    importDatasetsFromCSV: function( files, cb ) {
        var that = this;

        console.debug(files);

        var file = files[0];

        // if (typeof FileReader !== "undefined" && (/image/i).test(file.type)) {
        if (typeof FileReader !== "undefined" && (/application/i).test(file.type)) {
            reader = new FileReader();
            reader.onload = (function (fileData) {
                return function (evt) {
                    console.debug('process data', evt);
                    
                    var datasets = [];
                    var rows = d3.csv.parse(evt.target.result);
                    
                    // if( confirm('Import ' + rows.length + ' datasets and overwrite all existing datasets in "' + that.get('name') + '"?' ) )
                    if( confirm('Import ' + rows.length + ' datasets into "' + that.get('name') + '"?' ) )
                        createModels(rows);
                        cb();
                };
            }());

            // reader.readAsDataURL(file);
            reader.readAsText(file);
        }

        function createModels( rows ){
            console.debug(rows);
            
            rows.each(function(row){

                var newDataset = new Dataset( {parentModel: that} );
                
                // only take features that are defined in the project
                var attributes = {};
                that.getAllFeatureDefinitions().each(function(fd){
                    if( fd.get('name') === 'id' )
                        return false;
                    if( row[fd.get('name')] ) {
                        var value = row[fd.get('name')];
                        
                        if( fd.get('dataType') === VM.settings.DataType.number ){
                            var number = parseFloat(value);
                            if(fd.get('ratable')) number = (number).round();
                            attributes[fd.get('name')] = number;
                        }
                        else{
                            attributes[fd.get('name')] = value;
                        }
                    }
                });

                // console.debug(attributes);
                newDataset.setup( attributes );
        
            });

        }
    },

    exportDatasetsToCSV: function( files ) {
        var that = this;

        var ratableFeatures = _.filter(that.getAllFeatureDefinitions(), function(fd){
            return fd.get('ratable');
        });

        var otherFeatures = _.filter(that.getAllFeatureDefinitions(), function(fd){
            return !fd.get('ratable');
        });

        //////////////////
        // column names //
        //////////////////
        var headers = [];
        
        // fixed features
        _.each(otherFeatures, function(fd){
            headers.push('"' + fd.get('name') + '"');
        });

        // ratable features
        _.each(VM.getUsers(), function(user){
            _.each(ratableFeatures, function(fd){
                headers.push('"' + fd.get('name') + '/' + user.get('firstname') + '"');
            });
        });

        // column names as first row
        var A = [headers];
        
        ////////////
        // values //
        ////////////
        // for(var j=1;j<10;++j){ A.push([j, Math.sqrt(j)]) }
        _.each(that.getAllDatasets(), function(d){
            
            var row = [];
            _.each(otherFeatures, function(fd){
                if( fd.get('dataType') === VM.settings.DataType.number )
                    row.push( d.getFeature(fd.get('name')) );
                else
                    row.push( '"' + d.getFeature(fd.get('name')) + '"');
            });

            _.each(VM.getUsers(), function(user){

                _.each(ratableFeatures, function(fd){
                    row.push( d.getFeature(fd.get('name'), user) );
                });

            });

            A.push(row);

        });
        
        var csvRows = [];
        for(var i=0,l=A.length; i<l; ++i){
            csvRows.push(A[i].join(','));
        }

        var csvString = csvRows.join("\r\n");

        // file download for node-webkit
        if ( VM.settings.nw ) {

            $('ProjectMask').grab(new Element('input', { id: 'export_file', type: 'file', nwsaveas: that.get('name')+'.csv', nwworkingdir: '', style: 'display: none' }));

            function saveFile(name,data) {
                var chooser = document.querySelector(name);
                chooser.addEventListener("change", function(evt) {
                    console.log(this.value); // get your file name
                    var fs = require('fs');// save it now
                    fs.writeFile(this.value, data, function(err) {
                        if(err) {
                           alert("error"+err);
                        }
                    });
                }, false);

                chooser.click();
            }

            saveFile('#export_file',csvString);
            
        } else {
        // file download in normal browser
        
            var downloadLink = new Element('a', { href: 'data:application/csv;charset=utf-8,' + encodeURIComponent(csvString), target: '_blank', download: that.get('name')+'.csv'});
            downloadLink.dispatchEvent(new CustomEvent('click'));

        }


    },

    ///////////
    // Other //
    ///////////

    groupFeatureDefinitions: function(){
        var that = this;

        // console.log('groupFeatureDefinitions');

        that.featureGroups = {};
        
        var allFeatures = that.getAllFeatureDefinitions();
        
        //////////////////////////////////////////
        // RATABLE features (to show in matrix) //
        //////////////////////////////////////////
        var ratableFeatures = allFeatures.filter(function( fd ){
            return fd.get('ratable') === true;
        });
        that.featureGroups['ratableFeatures'] = [];
        _.each(ratableFeatures, function(fd){
            that.featureGroups['ratableFeatures'].push(fd);
        });

        ////////////////////////
        // NUMERICAL features //
        ////////////////////////
        var numericalFeatures = allFeatures.filter(function( fd ){
            return ( !fd.get('ratable') && fd.get('dataType') === VM.settings.DataType.number );
        });
        that.featureGroups['numericalFeatures'] = [];
        _.each(numericalFeatures, function(fd){
            that.featureGroups['numericalFeatures'].push(fd);
        });

        //////////////////////////////////////////////////////
        // AUDIO file feature (to load in the audio player) //
        //////////////////////////////////////////////////////
        var fileAudioFeature = allFeatures.filter(function( fd ){
            return fd.get('dataType') === VM.settings.DataType.fileAudio;
        }).slice(0,1);
        that.featureGroups['fileAudioFeature'] = [];
        _.each(fileAudioFeature, function(fd){
            that.featureGroups['fileAudioFeature'].push(fd);
        });

        /////////////////////////////////////////////////
        // IMAGE file feature (to show in image frame) //
        /////////////////////////////////////////////////
        var fileImageFeature = allFeatures.filter(function( fd ){
            return fd.get('dataType') === VM.settings.DataType.fileImage;
        }).slice(0,1);
        that.featureGroups['fileImageFeature'] = [];
        _.each(fileImageFeature, function(fd){
            that.featureGroups['fileImageFeature'].push(fd);
        });

        //////////////////////////////////////////////////
        // other FILE features (to show in image frame) //
        //////////////////////////////////////////////////
        var fileOtherFeatures = allFeatures.filter(function( fd ){
            return fd.get('dataType') === VM.settings.DataType.fileOther;
        });
        that.featureGroups['fileOtherFeatures'] = [];
        _.each(fileOtherFeatures, function(fd){
            that.featureGroups['fileOtherFeatures'].push(fd);
        });

        var remainingFeatures = _.difference(allFeatures, ratableFeatures, numericalFeatures, fileAudioFeature, fileImageFeature, fileOtherFeatures);

        //////////////////////////////////////////////
        // HEADINGs features (to show in h1 and h2) //
        //////////////////////////////////////////////
        var headingsFeatures = remainingFeatures.slice(0,2);
        that.featureGroups['headingsFeatures'] = headingsFeatures;
        // _.each(headingsFeatures, function(fd){
        //     that.featureGroups['headingsFeatures'].push(fd);
        // });

        ////////////////////////////////////////////////////////////////
        // all remaining features (to show in further matrix columns) //
        ////////////////////////////////////////////////////////////////
        remainingFeatures = _.union( _.difference(remainingFeatures, headingsFeatures), numericalFeatures);
        that.featureGroups['remainingFeatures'] = [];
        _.each(remainingFeatures, function(fd){
            that.featureGroups['remainingFeatures'].push(fd);
        });

    },
    
    setDynamicRangeOfValues: function(bool){
        this.dynamicRangeOfValues = bool;
    }

});