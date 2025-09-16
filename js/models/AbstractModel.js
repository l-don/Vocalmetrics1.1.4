var AbstractModel = new Class({
    
    Extends: AbstractClass,

    ///////////////
    //Attributes //
    ///////////////
    
    id: null,

    initialize: function( modelName, attributes ){
        var that = this;

        this._fields = {};

        // constructing a unique id
        var newID = new Date().getTime();
        if(VM.lastModelID) {
            while(newID <= VM.lastModelID) {
                newID++;        
            }
        }
        VM.lastModelID = newID;
        if(modelName == 'FeatureDefinition')
            // this.id = 'FD_' + newID;
            this.set('id', 'FD_' + newID);
        else
            // this.id = modelName.substr(0,1) + '_' + newID;
            this.set('id', modelName.substr(0,1) + '_' + newID);
        
        /////////////////////
        // Init properties //
        /////////////////////

        // set default values from datamodel definition
        // !!! clone it to avoid accidently overwriting its values !!!
        var dataModel = Object.clone(VM.settings.dataModel[modelName]);
        var fields = _.union(dataModel.fields, dataModel.fieldsRelational);
        // _.each(fields, function(field){
        fields.each(function(field){
            if(field.default !== undefined)
                // that[field.name] = field.default;
                that.set(field.name, field.default);
        });

        // overwrite values with passed in attributes
        if(attributes){
            _.each(attributes, function(value, key){
                // take only if defined in datamodel
                if(
                    _.find(_.union(dataModel.fields, dataModel.fieldsRelational), function(field){
                        return field.name === key;
                    })
                ){
                    // that[key] = value;
                    that.set(key, value);
                }
            });
        }
    },

    get: function( attributeName ) {
        var that = this;

        // attribute FOUND        
        if(this._fields[attributeName] !== undefined) {
            return this._fields[attributeName];
        }

        // attribute NOT FOUND        
        else {
            return that.parent( attributeName );
        }

        // if(this[attributeName] !== undefined) return this[attributeName];
        // else throw new Error( 'requested attribute "' + attributeName + '" does not exist' );
    },
    
    set: function( attributeName, value ){
        var that = this;

        // if(this[attributeName] !== undefined) this[attributeName] = value;
        this._fields[attributeName] = value;
        // else
        // else throw new Error( 'requested attribute "' + attributeName + '" does not exist' );  
    },

    save: function(cb){
        var that = this;
        // write to storage
        VM.getStorageManager().save(cb, that);
    },
    
    delete: function(){
        // write to storage
    }

});