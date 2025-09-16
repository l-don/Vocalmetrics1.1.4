/////////////
// EXAMPLE //
/////////////
///
///     values: [
///         { value: 50, featureDefinition: 'FD_xx1' },
///         { value: 23, featureDefinition: 'FD_xx2' },
///         { value: 76, featureDefinition: 'FD_xx3' }
///     ]
///
///
var Rating = new Class({
    
    Extends: AbstractModel,

    ///////////////
    //Attributes //
    ///////////////
    
    attributes: {
        nameInDataModel: 'Rating'
    },

    initialize: function( attributes ){
        var that = this;

        // if(!attributes) throw new Error( "missing parameter in Constructor" );
        // if(!attributes.parentDataset) throw new Error( "missing parameter in Constructor" );
        
        // CALL PARENT (creates properties)
        this.parent(that.attributes.nameInDataModel, attributes);

        // that.parentDataset = attributes.parentDataset;
        // if(attributes.user !== undefined) that.user = attributes.user;
        // if(attributes.value !== undefined) that.value = attributes.value;
    },

    validate: function(){

        // check attributes
            
            // that.name != null && not an empty string && no spaces in string >> if(that.name && ...)
            
            // that.displayName != null && not an empty string >> if(that.displayName)
                // false: take attributes.name

            // VM.settings.dataTypes[that.dataType] != undefined
                // false: set that.dataType = 0

            // if enabledForDC === true
                // false: set enabledForDC = false
                // true:
                    // check if datatype === Number
                    // rangeOfValues must be defined

    }
});