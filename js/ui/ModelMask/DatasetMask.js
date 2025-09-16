var DatasetMask = new Class({

    Extends: ModelMask,

    /////////////////
    // Attributes //
    /////////////////
    
    attributes: {
        dataModelName: 'Dataset'
    },

    initialize: function(){
        
        var that = this;
        
        // pass modelName as defined in the dataModel
        that.parent(that.attributes.dataModelName, {blockRender: true});
    },
    
    /** OVERWRITE parent render() method only in the DatasetMask, because of its speciality */
    render: function(){
        var that = this;

        console.log('render ' + that.modelName+'Mask');
        console.debug('Dataset model:', that.model);

        that.DOMElement.empty();

        // hide the mask on creation
        that.DOMElement.addClass('hidden');
        
        /////////////
        // Heading //
        /////////////
        that.heading = new Element('h2');
        that.DOMElement.grab(that.heading);
        

        ////////////////////
        // Feature Fields //
        ////////////////////

        that.formFields = {};

        // show field for each of the project's FeatureDefinitions
        var featureDefinitions = that.model.get('parentModel').getAllFeatureDefinitions();
        
        var table = new Element('table');
        
        featureDefinitions.each(function(fd){
            var tr = new Element('tr'),
                td1 = new Element('td'),
                td2 = new Element('td.value');
            tr.grab(td1).grab(td2);
            td1.grab(new Element('label', {text: fd.get('displayName')}));
            
            if(fd.get('ratable')) {
                that.formFields[fd.get('name')] = new Element('input', {type: 'range', min: 0, max: 100, step: 1, value: 50});
                var numberBox = new Element('input.numberBox', {type: 'text', disabled: true});
                td2.grab(that.formFields[fd.get('name')]);
                td2.grab(numberBox);
                that.formFields[fd.get('name')].addEvent('input', function(e){
                    numberBox.set('value', $(that.formFields[fd.get('name')]).get('value') );
                });
                table.grab(tr);
            }
            else {
                switch(fd.get('dataType')){
                    case VM.settings.DataType.fileAudio:
                        that.formFields[fd.get('name')] = new Element('input', {type: 'file', accept: 'audio/*'});
                        break;
                    default:
                        that.formFields[fd.get('name')] = new Element('input', {type: 'text'});
                        break;
                }
                
                if( !VM.getCurrentUser().isAuthorized() )
                    that.formFields[fd.get('name')].set('disabled', true);
                
                td2.grab(that.formFields[fd.get('name')]);
                table.grab(tr);
            }

        });
        that.DOMElement.grab(new Element('p').grab(table));


        ///////////////////////
        // Fields relational //
        ///////////////////////
        // handle relational fields in the model-specific ModelMask instance
        if(that.fieldsRelational) {
            _.each(that.fieldsRelational, function(field){
                that.DOMElement.grab(new Element('h3', {text: field.label}));
                that.formFields[field.name] = new Element('div.relationals');
                that.DOMElement.grab(that.formFields[field.name]);
            });
        }
        
        // Create Action Buttons
        that.createActionButtons();

        // append UIElement to live DOM
        VM.getUI().get('outerSpace').grab(that.DOMElement, 'top');

    },

    loadModel: function( model, parentModel ){
        var that = this;

        console.log('load model of type ' + that.modelName, model);

        // shwo the mask
        that.DOMElement.removeClass('hidden');
        
        if(!model) {
            // create new model
            if(
                // instantiate with parentModel attribute
                parentModel &&
                _.find(that.fieldsRelational, function(field){
                    return field.name === 'parentModel'
                })
            ){
                that.model = new window[that.modelName]({
                    parentModel: parentModel
                });
            } else {
                // instantiate without any attributes (blank)
                that.model = new window[that.modelName];
            }
            that.mode = that.modes.new;
        }
        else {
            // edit existing model
            // clone the model to avoid working on the original
            that.model = _.clone(model);
            that.mode = that.modes.edit;
        }

        ////////////
        // RENDER //
        ////////////
        // render mask again because it differs from project to project
        that.render();
        that.DOMElement.removeClass('hidden');

        ///////////////////////
        // Heading + Buttons //
        ///////////////////////

        var heading;
        switch (that.mode){
            case that.modes.new:
                heading = 'New ' + that.modelName;
                that.deleteBtn.setProperty('disabled', true);
                break;
            case that.modes.edit:
                heading = 'Edit ' + that.modelName;
                that.deleteBtn.setProperty('disabled', false);
                break;
        }
        that.heading.set('text', heading);

        
        ////////////
        // Fields //
        ////////////
        
        if(that.mode === that.modes.edit){

            var featureDefinitions = that.model.get('parentModel').getAllFeatureDefinitions();
            featureDefinitions.each(function(fd){
                
                if(fd.get('ratable')) {
                    
                    var datasetRatings = that.model.getAllRatings();
                    var currentUserHasRating = false;

                    // load rating, if currentUser has one for the Dataset
                    datasetRatings.each(function(rating){
                        if( 
                            rating.get('user').get('id') === VM.getCurrentUser().get('id')
                            // && rating.get('parentModel').get('id') === that.model.get('id')
                        ){
                            currentUserHasRating = true;
                            rating.get('values').each(function(value){
                                if(value.featureDefinition === fd.get('id')) {
                                    $(that.formFields[fd.get('name')]).set('value', value.value);
                                    $(that.formFields[fd.get('name')]).getSiblings('.numberBox').set('value', value.value);
                                }
                            });
                        }
                    });
                    
                    // load default rating, if currentUser has not yet rated the Dataset
                    if(!currentUserHasRating){
                        $(that.formFields[fd.get('name')]).set('value', 50);
                        $(that.formFields[fd.get('name')]).getSiblings('.numberBox').set('value', 50);
                    }
                    

                }
                else {
                    switch(fd.get('dataType')){
                        case VM.settings.DataType.fileAudio:
                            console.debug(that.model.getFeature(fd.get('name')));
                            // that.formFields[fd.get('name')] = new Element('input', {type: 'file', accept: 'audio/*'});
                            break;
                        default:
                            $(that.formFields[fd.get('name')]).set('value', that.model.getFeature(fd.get('name')));
                            break;
                    }
                }

            });
        }


        ///////////////////////
        // Fields relational //
        ///////////////////////
        if(that.fieldsRelational)
            that.loadRelationalFields();

    },

    loadRelationalFields: function(){
        var that = this;
        
        _.each(that.fieldsRelational, function(field){
            
            // empty related models first
            that.formFields[field.name].empty();

            ///////////////////////////
            // parentModel (Project) //
            ///////////////////////////
            if(field.name === 'parentModel') {
                
                // only show name of parentModel
                // var parentModel = VM.getProject(that.model.get('parentModel'));
                var parentModel = that.model.get('parentModel');
                that.formFields[field.name].grab(new Element('p', {text: parentModel.get('name')}));

            } else

            //////////////
            // Features //
            //////////////
            if(field.name === 'features') {
                // show the features
                var text = '';
                that.model.get('parentModel').getAllFeatureDefinitions().each(function(feature){
                    text += ' ' + feature.get('displayName');
                });
                that.formFields[field.name].grab(new Element('p', {text: text}));
            } else

            /////////////
            // Ratings //
            /////////////
            if(field.name === 'ratings') {
                // only show number of ratings
                var count = that.model.getAllRatings().length;
                that.formFields[field.name].grab(new Element('p', {text: count}));
            }

        });
    },

    parseFormFields: function(){
        var that = this;

        that.formData = {};

        var featureDefinitions = that.model.get('parentModel').getAllFeatureDefinitions();
        featureDefinitions.each(function(fd){
            var value;
            if(fd.get('ratable')) {
                value = parseInt($(that.formFields[fd.get('name')]).get('value'));
            }
            else {
                switch(fd.get('dataType')){
                    case VM.settings.DataType.number:
                        value = parseFloat($(that.formFields[fd.get('name')]).get('value'));
                        if(!value) value = 0;
                        break;
                    // case VM.settings.DataType.enum:
                    //     value = parseInt($(that.formFields[fd.get('name')]).get('value'));
                    //     break;
                    case VM.settings.DataType.bool:
                        value = $(that.formFields[fd.get('name')]).get('checked');
                        break;
                    case VM.settings.DataType.fileAudio:
                        if (that.formFields[fd.get('name')].files[0]) {
                            value = that.formFields[fd.get('name')].files[0].name;
                        } else {
                            if (that.mode === that.modes.new)
                                value = null;                            
                            else
                                value = that.model.getFeature(fd.get('name'));
                        }
                        break;
                    default:
                        value = $(that.formFields[fd.get('name')]).get('value');
                        break;
                }
            }
            that.formData[fd.get('name')] = value;
        });

        that.save();
    },

    save: function(){
        var that = this;

        // ADD new model
        if(that.mode === that.modes.new) {
            
            //////////////////////
            // Feature creation //
            //////////////////////

            // create new Features and add to Dataset + VM
            var featureDefinitions = that.model.get('parentModel').getAllFeatureDefinitions();
            featureDefinitions.each(function(fd){
                
                var featureData = {
                    parentModel: that.model,
                    featureDefinition: fd
                };
                
                // only set a value for not-ratable features                
                if(!fd.get('ratable')){
                    featureData.value = that.formData[fd.get('name')];
                }

                var newFeature = new Feature(featureData);

                // add new Feature to VM
                VM.addFeature(newFeature);

                // add new Feature to dataset
                that.model.addFeature(newFeature);
                
            });


            /////////////////////
            // Rating creation //
            /////////////////////
            
            var ratingData = {
                parentModel: that.model,
                user: VM.getCurrentUser(),
                values: []
            };
            
            // set a value for each ratable feature
            featureDefinitions.each(function(fd){
                if(fd.get('ratable')){
                    ratingData.values.push({
                        featureDefinition: fd.get('id'),
                        value: that.formData[fd.get('name')]
                    });
                }
            });

            var newRating = new Rating(ratingData);
            
            // add new Rating to dataset
            // that.model.addRating(newRating);

            // add new Rating to currentUser
            // VM.getCurrentUser().addRating(newRating);

            // add new Rating to VM
            VM.addRating(newRating);
            // VM.addModel(newRating);

           
            ////////////////////
            // DATASET adding //
            ////////////////////

            // add new Dataset to VM
            VM.addDataset(that.model);
            // VM.addModel(that.model);
        }
        // UPDATE model
        else if(that.mode === that.modes.edit) {

            var featureDefinitions = that.model.get('parentModel').getAllFeatureDefinitions();
            
            var currentUserHasRating = false;

            // change Features + Ratings of the existing model
            featureDefinitions.each(function(fd){
                that.model.updateFeature(fd, that.formData[fd.get('name')]);
            });
        }
        
        VM.getCurrentView().selectDataset(that.model);

        that.model.save();
        that.close();
    },

    cancel: function(){
        var that = this;

        that.close();
    },

    delete: function(){
        var that = this;

        if(
            confirm('Are you sure?') &&
            that.mode === that.modes.edit
        ){
            // delete existing model
            // var existingModel = VM.getModel(that.model.get('id'));
            VM.removeDataset(that.model);
            // var index = _.indexOf(VM.getAllDatasets(), existingModel);
            // VM.removeDataset(VM.datasets[index]);
        }
        VM.save();
        that.close();
    }


});