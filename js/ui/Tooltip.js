var Tooltip = new Class({

	Extends: UIElement,

	/////////////////
	// Attributes //
	/////////////////

	initialize: function(){
        
        var that = this;
        
        // creates this.DOMElement
        that.parent(new Element('div.ui#tooltip'));
        
        that.render();
    },
    
    
    render: function(){
    	var that = this;

        // that.value = new Element('span');
        // that.getDOMElement().grab(that.value);

        // append UIElement to live DOM
        VM.getUI().get('outerSpace').grab(that.DOMElement);
    },

    showText: function( string ){
        var that = this;

        that.getDOMElement().empty().show();
        
        that.getDOMElement().grab(new Element('span', {text: string}));
    },

    showValues: function( values ){
        var that = this;

        that.getDOMElement().empty().show();
        
        _.each(values, function( value ){
            var span = new Element('span', {text: value.text});
            if(value.active) span.addClass('chosen-group-element');
            that.getDOMElement().grab(span);
        });
    },

    hide: function(){
        var that = this;

        that.getDOMElement().addClass('hidden');
    }
        
});