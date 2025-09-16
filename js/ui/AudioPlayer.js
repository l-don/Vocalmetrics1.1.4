var AudioPlayer = new Class({
    
    Extends: UIElement,

    ////////////////
    // Attributes //
    ////////////////

    defaultSound: 'pigeon_wings.ogg',

    initialize: function(){
        
        var that = this;
        
        // creates this.DOMElement
        that.parent(new Element('div.ui#audioplayer'));

        that.render();
    },
    
    render: function(){
    	var that = this;

        console.log('AudioPlayer:render()');
        that.audioTag = new Element('audio', {controls: 'controls'});
        // var src = new Element('source', {src: VM.settings.path_audio + that.defaultSound, type: 'audio/ogg', text: 'Your browser does not support the HTML5 audio element.'})
        var src = new Element('source', {src: null, text: 'Your browser does not support the HTML5 audio element.'});

        that.audioTag.preload = 'auto';

        that.audioTag.grab(src);

        var pEl = new Element('p');
        
        that.autoPlayBtn = new Element('span', {text: 'autoplay '});
        that.autoPlayBtn.addEvent('click', function(){
            that.setAutoplay(!that.audioTag.autoplay);
        });
        
        that.loopBtn = new Element('span', {text: ' loop'});
        that.loopBtn.addEvent('click', function(){
            that.setLoop(!that.audioTag.loop);
        });
        
        pEl.grab(that.autoPlayBtn);
        pEl.grab(that.loopBtn);

        that.DOMElement.grab(that.audioTag);
        that.DOMElement.grab(pEl);

        // append UIElement to live DOM
        VM.getUI().get('outerSpace').grab(that.DOMElement);
        
        that.setAutoplay(VM.getCurrentUser().get('settings').autoplay);
        that.setLoop(VM.getCurrentUser().get('settings').loop);
    },
    
    play: function() {
    	that.audioTag.play();
    },
    
    pause: function() {
    	that.audioTag.pause();
    },
    
    loadSound: function( fileName ){
    	var that = this;
    	
        that.currentAudioFile = fileName;
        
        var url = VM.settings.path_audio + fileName;
        that.audioTag.src = url;
        that.audioTag.load();
    },
    unLoadSound: function(){
        var that = this;

        var url = VM.settings.path_audio + that.defaultSound;
        var url = '';
        that.audioTag.src = url;
        that.currentAudioFile = null;
    	
        that.audioTag.load();
    },

    setAutoplay: function(bool) {
    	var that = this;

    	that.audioTag.autoplay = bool;
        VM.getCurrentUser().get('settings').autoplay = bool;
        d3.select(that.autoPlayBtn).classed('active', that.audioTag.autoplay);
        that.audioTag.load();
    },

    setLoop: function(bool) {
        var that = this;

        that.audioTag.loop = bool;
        VM.getCurrentUser().get('settings').loop = bool;
        d3.select(that.loopBtn).classed('active', that.audioTag.loop);
        that.audioTag.load();
    }

});