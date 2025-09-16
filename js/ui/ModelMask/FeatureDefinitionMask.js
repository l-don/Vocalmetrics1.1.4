var FeatureDefinitionMask = new Class({

	Extends: ModelMask,

	/////////////////
	// Attributes //
	/////////////////
    
    attributes: {
        dataModelName: 'FeatureDefinition'
    },

	initialize: function(){
        
        var that = this;
        
        // pass modelName as defined in the dataModel
        that.parent(that.attributes.dataModelName);
    },
    
    render: function(){
        var that = this;

        // call parent
        that.parent();

        // displayName is taken from name
        that['name'].addEvent('input', function(){
            that['displayName'].set('value', that['name'].get('value'));
        });

        // if ratable, set datatype to number automatically
        that['ratable'].addEvent('change', function(){
            
            if ( $(this).get('checked') ) {
                
                that['dataType']
                    .set('value', VM.settings.DataType.number)
                    .set('disabled', true);

            } else {
                
                that['dataType']
                    .set('value', VM.settings.DataType.string)
                    .set('disabled', false);

            }

        });

    },

    loadRelationalFields: function(){
        var that = this;
        
        _.each(that.fieldsRelational, function(field){
            
            // empty related models first
            that[field.name].empty();

            ///////////////////////////
            // parentModel (Project) //
            ///////////////////////////
            
            if(field.name === 'parentModel') {
                
                // only show name of parentModel
                var parentModel = that.model.get('parentModel');
                that[field.name].grab(new Element('p', {text: parentModel.get('name')}));

            }

        });
    },

    save: function(){
        var that = this;

        // set FeatureDefinition.dataType to NUMBER if ratable
        if(that.model.get('ratable'))
            that.model.set('dataType', 1);

        // ADD new model
        if(that.mode === that.modes.new) {
            // add the model
            VM.addFeatureDefinition(that.model);
        } else
        // UPDATE model
        if(that.mode === that.modes.edit) {
            // overwrite existing model with the cloned model
            var existingModel = VM.getFeatureDefinition(that.model.get('id'));
            var index = _.indexOf(VM.getAllFeatureDefinitions(), existingModel);
            VM.featureDefinitions[index] = that.model;
        }
        
        VM.getUI().get('projectMask').loadModel(that.model.get('parentModel'));
        that.model.save();
        that.close();
    },

    delete: function(){
        var that = this;

        if(
            confirm('Are you sure?') &&
            that.mode === that.modes.edit
            // && VM.getCurrentUser().isAuthorized()
        ){
            // delete existing model
            var existingModel = VM.getFeatureDefinition(that.model.get('id'));
            var index = _.indexOf(VM.getAllFeatureDefinitions(), existingModel);
            VM.removeFeatureDefinition(VM.featureDefinitions[index]);
        }
        VM.getUI().get('projectMask').loadModel(that.model.get('parentModel'));
        VM.save();
        that.close();
    }

});