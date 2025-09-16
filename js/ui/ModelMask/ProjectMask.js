var ProjectMask = new Class({

	Extends: ModelMask,

	/////////////////
	// Attributes //
	/////////////////
    
    attributes: {
        dataModelName: 'Project'
    },

	initialize: function(){
        
        var that = this;
        
        // pass modelName as defined in the dataModel
        that.parent(that.attributes.dataModelName);
    },
    
    createActionButtons: function(){
        var that = this;

        /////////////////////////
        // Delete all datasets //
        /////////////////////////
        that.emptyBtn = new Element('button.removeAllDatasets', {text: 'Remove all datasets', disabled: true});
        
        d3.select(that.emptyBtn).on('click', function(){
            if(
                confirm('Are you sure to delete all ' + that.model.getAllDatasets().length + ' datasets from "' + that.model.get('name') + '"?')
            )
            that.model.removeAllDatasets();
            that.loadModel(that.model);
            that.save();
        });

        ///////////////////
        // Import Button //
        ///////////////////
        that.importBtn = new Element('button.import', {text: 'Import data', disabled: true});
        var hiddenFileInput = new Element('input#file.hidden', {type: 'file'});
        
        d3.select(that.importBtn).on('click', function(){
            hiddenFileInput.dispatchEvent(new CustomEvent('click'));
        });

        d3.select(hiddenFileInput).on('change', function(){
            // console.debug($$(hiddenFileInput));
            that.model.importDatasetsFromCSV($$(hiddenFileInput)[0].files, function(){
                that.loadModel(that.model);
            });
            $$(hiddenFileInput).setProperty('value', null);
        });

        ////////////
        // Export //
        ////////////
        that.exportBtn = new Element('button.export', {text: 'Export data', disabled: true});
        
        d3.select(that.exportBtn).on('click', function(){
            that.model.exportDatasetsToCSV();
        });

        var additionals = [];
        additionals.push(that.emptyBtn);
        additionals.push(that.importBtn);
        additionals.push(that.exportBtn);
        additionals.push(hiddenFileInput);

        that.parent(additionals);
    },

    loadRelationalFields: function(){
        var that = this;
        
        if(that.mode == that.modes.edit) {
            _.each(that.fieldsRelational, function(field){
                
                // empty related models first
                that[field.name].empty();

                ///////////////////////
                // FeatureDefinition //
                ///////////////////////
                if(field.name === 'featureDefinitions') {
                    
                    if(that.model.get(field.name).length > 0){
                        _.each(that.model.getAllFeatureDefinitions(), function(model){
                            var name = (model.get('name')) ? model.get('name') : '???';
                            var displayName = (model.get('displayName')) ? model.get('displayName') : '???';
                            var dataType = VM.dm.getDataTypeName(model.get('dataType'));
                            var text = name + ' as ' + '"' + displayName + '"';
                            if(model.get('ratable')) text += ' (ratable)'; else text += ' (' + dataType + ')';
                            // text += ' '+model.get('sort');
                            
                            var textSpan = new Element('span.text', {text: text});
                            d3.select(textSpan).on('click', function(){
                                VM.getUI().get('featureDefinitionMask').loadModel(model);
                            });
                            

                            var upArrow = new Element('span.upArrow', {text: ' ▲ '});
                            upArrow.addEvent('click', function(){
                                that.model.changeSortingOfFeatureDefinition(model, 1);
                                that.loadModel(that.model);
                            });
                            var downArrow = new Element('span.downArrow', {text: ' ▼ '});
                            downArrow.addEvent('click', function(){
                                that.model.changeSortingOfFeatureDefinition(model, 0);
                                that.loadModel(that.model);
                            });

                            var element = new Element('p');
                            element.grab(upArrow);
                            element.grab(downArrow);
                            element.grab(textSpan);

                            that[field.name].grab(element);
                        });              
                    }
                    var addBtn = new Element('button.plus', {text: '+'})
                    that[field.name].grab(addBtn);
                    d3.select(addBtn).on('click', function(){
                        // load mask for new FeatureDefinition, give project as parentDataset
                        VM.getUI().get('featureDefinitionMask').loadModel(null, that.model);
                    });

                } else

                //////////////
                // Datasets //
                //////////////
                if(field.name === 'datasets') {
                    // only show number of datasets
                    var count = that.model.getAllDatasets().length;
                    that[field.name].grab(new Element('p', {text: count}));
                }

            });
        } else {
            
            _.each(that.fieldsRelational, function(field){
                
                // empty related models first
                that[field.name].empty();
            });

        }
    },

    save: function(){
        var that = this;

        // ADD new model
        if(that.mode === that.modes.new) {
            // add the model
            // VM.addProject(that.model);
            VM.addModel(that.model);
        } else
        // UPDATE model
        if(that.mode === that.modes.edit) {
            // overwrite existing model with the cloned model
            var existingModel = VM.getProject(that.model.get('id'));
            var index = _.indexOf(VM.getProjects(), existingModel);
            VM.projects[index] = that.model;
        }
        that.model.save();
        that.close();
    },

    delete: function(){
        var that = this;

        if(
            confirm('Are you sure?') &&
            that.mode === that.modes.edit && 
            VM.getCurrentUser().isAuthorized()
        ){
            // delete existing model
            // var existingModel = that.model;
            // var index = _.indexOf(VM.getProjects(), that.model);
            // VM.removeProject(VM.projects[index]);
            VM.removeProject(that.model);
        }
        VM.save();
        that.close();
    }

});