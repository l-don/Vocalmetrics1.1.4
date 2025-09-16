var AbstractClass = new Class({
    
    ///////////////
    //Attributes //
    ///////////////
    
    initialize: function(){
        
    },

    get: function( attributeName ) {
        var that = this;

        // attribute FOUND        
        if(this[attributeName] !== undefined) {
            return this[attributeName];
        }
        // attribute NOT FOUND        
        else {
            // throw new Error( 'requested attribute "' + attributeName + '" does not exist' );
            console.warn('requested attribute "' + attributeName + '" does not exist' );
            return null;
        }

    },

    set: function( attributeName, value ){
        var that = this;

        this[attributeName] = value;
    },

    // trigger global event
    say: function( eventName, data ){
        console.log('say: ' + eventName, '(' + this.name + ')', data);
        
        var event = jQuery.Event( eventName );
        if(data) event.customData = data;
        $j( document ).trigger( event );
    },

    listen: function( eventName, cb ){
        var that = this;
        console.log('listen: ' + eventName, '(' + that.name + ')');
        
        // attach event listener to document, but with namespace derived from calling object
        $j( document ).on( eventName + '.' + that.name, function(e){
            console.log('heard: ' + eventName, '(' + that.name + ')', e.customData);
            cb(e);
        });
    },

    unlisten: function( eventName ){
        var that = this;
        console.log('unlisten: ' + eventName, '(' + that.name + ')');

        // remove only those event listeners with specific namespace
        $j( document ).off( eventName + '.' + that.name)
    }

});