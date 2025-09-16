var UserMask = new Class({

	Extends: ModelMask,

	/////////////////
	// Attributes //
	/////////////////

    attributes: {
        dataModelName: 'User'
    },

	initialize: function(){
        
        var that = this;
        
        // pass modelName as defined in the dataModel
        that.parent(that.attributes.dataModelName);
    },

    loadRelationalFields: function(){
        var that = this;
        
        _.each(that.fieldsRelational, function(field){
            
            // empty related models first
            that[field.name].empty();

            /////////////
            // Ratings //
            /////////////
            if(field.name === 'ratings') {
                // only show number of ratings
                var count = that.model.getAllRatings().length;
                that[field.name].grab(new Element('p', {text: count}));
            }

        });
    },

    save: function(){
        var that = this;

        // ADD new model
        if(that.mode === that.modes.new) {
            // add the model
            // VM.addUser(that.model);
            VM.addModel(that.model);
        } else
        // UPDATE model
        if(that.mode === that.modes.edit) {
            // overwrite existing model with the cloned model
            var index = _.indexOf(VM.getUsers(), that.model);
            VM.users[index] = that.model;
        }
        that.model.save();
        that.close();
    },

    delete: function(){
        var that = this;

        if(
            confirm('Are you sure?') &&
            that.mode === that.modes.edit
        ) {
            // delete existing model
            VM.removeUser(that.model);
        }
        VM.save();
        that.close();
    }

});