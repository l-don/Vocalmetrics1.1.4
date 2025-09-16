/**
 * WHICH FEATURES to select for showing in the details area:
 *
 * show:
 * ~ ratable features shown in nx3 matrix
 * ~ datatype fileAudio is loaded into the audio player
 * ~ datatype fileImage is loaded into the image frame
 * ~ datatype fileOther is shown under "attachments"
 * ~ all others fill up h1 and h2 and further matrix columns
 *
 */

var DetailsArea = new Class({

	Extends: UIElement,

	/////////////////
	// Attributes //
	/////////////////

	numberMatrixRows: 3,

	initialize: function(){
        
        var that = this;
        
        // creates this.DOMElement
        that.parent(new Element('div.ui#infobox'));
        
        that.render();
    },
    
    /**
     * prepares the DOM elements in the details area according to the current project's feature definitions
     * called in VM.setCurrentProject()
     * @return -
     */
    render: function(){
        var that = this;

        ///////////
        // Image //
        ///////////

        if(VM.getCurrentProject().featureGroups.fileImageFeature.length > 0) {
            that.image = new Element('div#dataset-image');
            that.DOMElement.grab(that.image);
        }


        /////////////////////////////////
        // Headings (position 1 and 2) //
        /////////////////////////////////

        // prepare the two heading positions
        var headings = new Element('div#dataset-headings');
        var h1 = new Element('p.h1');
        var h1Value = new Element('span.value', {text: '...'});
        d3.select(h1Value).on('click', function(){
            if(that.currentDataset)
                VM.getUI().get('datasetMask').loadModel(that.currentDataset);
        });
        h1.grab(h1Value);
        headings.grab(h1);

        // BIND feature to DOMElement
        that[VM.getCurrentProject().featureGroups.headingsFeatures[0].get('name')] = h1Value;
        
        // if second heading feature exists
        if(VM.getCurrentProject().featureGroups.headingsFeatures[1]){
            
            var h2 = new Element('p.h2');
            var h2Value = new Element('span.value', {text: '...'});
            h2.grab(h2Value);
            headings.grab(h2);
            
            // BIND feature to DOMElement
            that[VM.getCurrentProject().featureGroups.headingsFeatures[1].get('name')] = h2Value;
        }
        
        that.DOMElement.grab(headings);

        
        ////////////////////////////////////
        // ratable and remaining features //
        ////////////////////////////////////
 
        buildMatrix(VM.getCurrentProject().featureGroups.ratableFeatures, 'dataset-features-ratable');
        buildMatrix(VM.getCurrentProject().featureGroups.remainingFeatures, 'dataset-features-other');
 
        function buildMatrix(features, cssClassName ) {

            for(var i=1; i <= Math.ceil(features.length / that.numberMatrixRows); i++){
            
                var column = new Element('div.' + cssClassName);
                
                for(var j = (i-1)*3; (j < i*3) && (j<features.length); j++){
                        
                    var row = new Element('p.dataset-feature');
                    var label = new Element('span', { text: features[j].get('displayName') });
                    var value = new Element('span.value', {text: ' '});

                    // BIND feature to DOMElement
                    that[features[j].get('name')] = value;
                    
                    row.grab(label);
                    row.grab(value);
                    column.grab(row);
                };

                that.DOMElement.grab(column);
            };
        }

        // var buttons = new Element('div#dataset-buttons');
        // var editBtn = new Element('button', {text: 'Edit'});
        // d3.select(editBtn).on('click', function(){
        //     VM.getUI().get('datasetMask').loadModel(VM.getModel(that.currentDataset));
        // });
        // buttons.grab(editBtn);
        // that.DOMElement.grab(buttons);

        /////////////////////////
        // other file features //
        /////////////////////////

        // TODO create attachments menu

        // append UIElement to live DOM
        VM.getUI().get('outerSpace').grab(that.DOMElement, 'top');
    },

    // Öffnet Links im externen System-Browser (nicht im App-Fenster)
    openExternal: function(url, evt){
        try {
            if (evt && evt.preventDefault) evt.preventDefault();

            // NW.js
            if (window.nw && nw.Shell && typeof nw.Shell.openExternal === 'function') {
                nw.Shell.openExternal(url);
                return;
            }

            // Electron
            if (window.require) {
                try {
                    var electron = window.require('electron');
                    if (electron && electron.shell && typeof electron.shell.openExternal === 'function') {
                        electron.shell.openExternal(url);
                        return;
                    }
                } catch (e) {}
                // Ältere NW.js-Variante
                try {
                    var gui = window.require('nw.gui');
                    if (gui && gui.Shell && typeof gui.Shell.openExternal === 'function') {
                        gui.Shell.openExternal(url);
                        return;
                    }
                } catch (e) {}
            }
        } catch (e) {}

        // Fallback: neuer Tab/Fenster im Standard-Browser
        window.open(url, '_blank', 'noopener,noreferrer');
    },

    showDataset: function( d ){
        var that = this;

        if ( d ) {
            
            that.currentDataset = d;
            
            if ( d.candidate )
                that.DOMElement.addClass('candidate');
            else
                that.DOMElement.removeClass('candidate');
        }


        var featureDefinitions = VM.getCurrentProject().getAllFeatureDefinitions();

        featureDefinitions.each(function( fd ){
            
            // get the belonging DOMElement for the certain feature
            var valueDOMElement = that[fd.get('name')];

            // handle feature value according to its type
            var value = (d && d.getFeature(fd.get('name')) !== null) ? d.getFeature(fd.get('name')) : '...';

            switch( fd.get('dataType') ) {
                
                case VM.settings.DataType.fileAudio:
                
                    var ap = VM.getUI().get('audioPlayer');
                    if(d) {
                        // only if audio file really changed, otherwise avoid stop playing
                        if( value != ap.currentAudioFile )
                            ap.loadSound(value);
                    }
                    else ap.unLoadSound();
                    break;
                
                case VM.settings.DataType.fileImage:
                
                    // TODO handle image value
                    break;
                
                default:
                
                    if(valueDOMElement){
                        // If the value looks like a URL (e.g., YouTube), render it as a clickable link
                        var isString = (typeof value === 'string' || value instanceof String);
                        var strVal = isString ? ('' + value).trim() : value;

                        // Detect YouTube links even without scheme (e.g., 'youtube.com/watch...'), plus general URLs
                        var looksLikeUrl = isString && (
                            /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch|youtu\.be\/)/i.test(strVal) ||
                            /^(https?:\/\/|www\.)/i.test(strVal)
                        );

                        // detect local png filename (e.g. "cover.png")
                        var looksLikePng = isString && /\.png$/i.test(strVal);

                        if (looksLikePng) {
                            // For local usage: assume image is in data/img/<name>
                            var imgPathLocal = 'data/img/' + strVal;
                            valueDOMElement.empty();
                            var btn = new Element('a', { href: '#', text: strVal });
                            btn.addEvent('click', function(e){
                                if(e && e.preventDefault) e.preventDefault();
                                that.openImageModal(imgPathLocal);
                            });
                            valueDOMElement.grab(btn);
                        }
                        else if (looksLikeUrl) {
                            // Normalize href to include scheme
                            var href = /^https?:\/\//i.test(strVal) ? strVal : ('https://' + strVal);
                            valueDOMElement.empty();
                            var linkEl = new Element('a', {
                                href: href,
                                target: '_blank',
                                rel: 'noopener noreferrer',
                                text: strVal
                            });
                            // Immer extern öffnen (Standard-Browser) und internes Laden verhindern
                            linkEl.addEvent('click', function(e){
                                that.openExternal(href, e);
                            });
                            valueDOMElement.grab(linkEl);
                        }
                        else {
                            valueDOMElement.set('text', value);
                        }
                    }
            }
        });

    }

});

// Modal helpers appended to prototype
DetailsArea.implement({
    openImageModal: function(path){
        try{
            var modal = document.getElementById('vm-image-modal');
            if(!modal) return;
            var img = modal.querySelector('.vm-modal-img');
            var closeBtn = modal.querySelector('.vm-modal-close');
            img.setAttribute('src', path);
            modal.style.display = 'block';
            // attach close handler once
            var closeHandler = function(e){
                if(e && e.preventDefault) e.preventDefault();
                modal.style.display = 'none';
                img.setAttribute('src', '');
            };
            closeBtn.addEventListener('click', closeHandler);
            // also close when clicking backdrop
            var backdrop = modal.querySelector('.vm-modal-backdrop');
            if(backdrop){
                backdrop.addEventListener('click', closeHandler);
            }
        }catch(e){}
    },
    closeImageModal: function(){
        try{
            var modal = document.getElementById('vm-image-modal');
            if(!modal) return;
            var img = modal.querySelector('.vm-modal-img');
            modal.style.display = 'none';
            img.setAttribute('src', '');
        }catch(e){}
    }
});