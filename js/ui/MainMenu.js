var MainMenu = new Class({

	Extends: UIElement,

	/////////////////
	// Attributes //
	/////////////////

	initialize: function(){
        
        var that = this;
        
        // creates this.DOMElement
        that.parent(new Element('div.ui#mainMenu'));
        
        that.render();
    },
    
    
    render: function(){
    	var that = this;

        that.getDOMElement().hide();

        var closeBtn = new Element('p.close', {text: 'X'});
        closeBtn.addEvent('click', function(){
            that.getDOMElement().hide();
        });
        that.getDOMElement().grab(closeBtn);
        
        var heading = new Element('h2', {text: VM.settings.appTitle});
        that.getDOMElement().grab(heading);
        
        var pVersion = new Element('p');
        pVersion.grab(new Element('span', {text: 'Version: ' + VM.settings.appVersion}));
        that.getDOMElement().grab(pVersion);

        var pCopy = new Element('p');
        pCopy.grab(new Element('span.bold', {text: 'created by Felix Schönfeld'}));
        pCopy.grab(new Element('br'));
        pCopy.grab(new Element('span', {text: 'visit '}));
        pCopy.grab(new Element('a', {href: 'http://felix.courages.net', target: '_blank', text: 'felix.courages.net'}));
        that.getDOMElement().grab(pCopy);

        var pCoop = new Element('p');
        pCoop.grab(new Element('span.bold', {text: 'in cooperation with'}));
        pCoop.grab(new Element('br'));
        pCoop.grab(new Element('a', {href: 'http://www.hfm-weimar.de/popvoices/index_en.htm', target: '_blank', text: 'The LISZT SCHOOL of Music Weimar'}));
        pCoop.grab(new Element('span', {text: ' and '}));
        pCoop.grab(new Element('a', {href: 'https://mg.inf.tu-dresden.de/', target: '_blank', text: 'TU Dresden'}));
        that.getDOMElement().grab(pCoop);

        var pInfo = new Element('p');
        pInfo.grab(new Element('span.bold', {text: 'Project website'}));
        pInfo.grab(new Element('br'));
        pInfo.grab(new Element('a', {href: 'http://schoenfelds.org/vocalmetrics', target: '_blank', text: 'http://schoenfelds.org/vocalmetrics'}));
        that.getDOMElement().grab(pInfo);

        var pManual = new Element('p');
        pManual.grab(new Element('span.bold', {text: 'User manual'}));
        pManual.grab(new Element('br'));
        pManual.grab(new Element('a', {href: 'http://www.hfm-weimar.de/popvoices/vocalmetrics/help.htm', target: '_blank', text: 'http://www.hfm-weimar.de/popvoices/vocalmetrics/help.htm'}));
        that.getDOMElement().grab(pManual);

        var pUser = new Element('p');
        pUser.grab(new Element('span', {text: 'logged in as '}));
        // pUser.grab(new Element('br'));
        that.userName = new Element('span.bold');
        pUser.grab(that.userName);
        that.getDOMElement().grab(pUser);
        

        /////////////
        // Buttons //
        /////////////
        var buttonDefs = [
            
            // {
            //     label: 'Remove all data',
            //     fn: function(){
            //         VM.getStorageManager().wipeout();
            //     }
            // },
            
            {
                label: 'Logout',
                fn: function(){
                    location.reload();
                }
            }

        ];

        buttonDefs.each(function(btnDef){
            var btn = new Element('button', {text: btnDef.label});
            btn.addEvent('click', btnDef.fn);
            that.getDOMElement().grab(new Element('p').grab(btn));
        });

        // append UIElement to live DOM
        VM.getUI().get('outerSpace').grab(that.DOMElement);
    },

    show: function(){
        var that = this;

        var currentUser = VM.getCurrentUser();
        var userName = currentUser.get('firstname') + ' ' + currentUser.get('surname');
        that.userName.set('text', userName);
        that.getDOMElement().show();
    }

});