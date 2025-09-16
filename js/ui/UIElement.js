var UIElement = new Class({

	Extends: AbstractClass,
	
	/////////////////
	// Attributes //
	/////////////////
	
	DOMElement: null,

	initialize: function( DOMElement ){
        
        var that = this;
        
        that.DOMElement = DOMElement;
    },

    getDOMElement: function() {
    	return this.DOMElement;
    }

});