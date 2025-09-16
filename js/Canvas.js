var Canvas = new Class({
    
    Extends: AbstractClass,

    ////////////////////
    // Attributes     //
    ////////////////////

    initialize: function(){
		var that = this;
		
        this.canvas_d3 = d3.select('#'+VM.settings.canvas_id);
        this.canvas_jq = $(VM.settings.canvas_id);
        this.canvas_moo = $(VM.settings.canvas_id);
    },
    
    
    /*
     * Methods
     */
    
    getDom: function(framework) {
    	var that = this;
    	var dom;
    	
    	switch(framework) {
    		case 'd3':
    			dom = that.canvas_d3;
    			break;
    		case 'jq':
    			dom = that.canvas_jq;
    			break;
            case 'moo':
                dom = that.canvas_moo;
                break;
    	}
    	return dom;
    },

    /**
     * load a new view on the canvas
      */
    loadView: function(view) {
    	var that = this;

        // hide most of the elements and let the view activate what it needs
        VM.ui.hide();

    	this.fadeOut();
        if(VM.getCurrentView()) VM.getCurrentView().removeEvents();
    	VM.setCurrentView(view);
        this.clear();
        view.render();
        this.fadeIn();
    },
    
    // clear the canvas
    clear: function() {
    	this.canvas_moo.empty();
    },
    
    // canvas fade out
    fadeOut: function() {
    	this.canvas_moo.morph('opacity', 0);
    },
    // canvas fade out
    fadeIn: function() {
    	this.canvas_moo.morph('opacity', 1);
    }
    
});