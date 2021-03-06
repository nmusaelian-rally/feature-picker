Ext.define('CustomApp', {
    extend: 'Rally.app.TimeboxScopedApp',
    componentCls: 'app',
    scopeType: 'release',
    comboboxConfig: {
        fieldLabel: 'Select a Release:',
        labelWidth: 100,
        width: 300
    },
   onScopeChange: function() {
       if (this.down('#features')) {
	    this.down('#features').destroy();
	}
	var features = Ext.create('Rally.ui.combobox.ComboBox',{
	    itemId: 'features',
	    storeConfig: {
		model: 'PortfolioItem/Feature',
		fetch: ['FormattedID','Name','Release', 'UserStories'],
		pageSize: 100,
		autoLoad: true,
		filters: [this.getContext().getTimeboxScope().getQueryFilter()]
	    },
	    fieldLabel: 'select Feature',
	    listeners:{
                ready: function(combobox){
		    if (combobox.getRecord()) {
			console.log('ready',combobox.getRecord().get('_ref'));
			this._onFeatureSelected(combobox.getRecord());
		    }
		    else{
			console.log('selected release has no features');
			if (this.down('#grid')) {
			    this.down('#grid').destroy();
			}
		    }
		},
                select: function(combobox){
		    if (combobox.getRecord()) {
			console.log('select',combobox.getRecord().get('_ref'));
			this._onFeatureSelected(combobox.getRecord());
		    }
			        
                },
                scope: this
            }
	});
	this.add(features); 
    },

    
    _onFeatureSelected:function(feature){
	console.log('feature', feature.get('Name'));
	
	 var f  = {
            FormattedID: feature.get('FormattedID'),
            Name: feature.get('Name'),
            _ref: feature.get("_ref"),
            UserStories: []
        };
	
	var collection = feature.getCollection('UserStories', {fetch: ['Name','FormattedID','Owner', 'Defects']});
	var that = this;
	var count = collection.getCount();
	console.log(count);
	var stories = [];
	var pendingStories = count;
	  collection.load({
            callback: function(records, operation, success){
                Ext.Array.each(records, function(story){
		     var s  = {
                                FormattedID: story.get('FormattedID'),
                                Name: story.get('Name'),
                                _ref: story.get("_ref"),
                                DefectCount: story.get('Defects').Count,
                                Defects: []
                            };
			    var defects = story.getCollection('Defects');
			    var defectcount = defects.getCount();
			    var pendingDefects = defectcount;
			     defects.load({
                                fetch: ['FormattedID'],
                                callback: function(records, operation, success){
                                    Ext.Array.each(records, function(defect){
                                        s.Defects.push({_ref: defect.get('_ref'),
                                                        FormattedID: defect.get('FormattedID')
                                                    });
                                    }, this);
                                    
                                    --pendingDefects;
                                    if (pendingDefects === 0) {
					 console.log(story.get('FormattedID') + ' - ' + story.get('Name'));
					--pendingStories;
					 if (pendingStories === 0) {
						console.log('stories inside callback',stories);
					 }
					 
                                    }
				    console.log('makeGrid');
                                    that._makeGrid(stories);
                                },
                                scope: this
                            });
		    stories.push(s);
            }, this);     		
        }
	
        });
    },
    
     _makeGrid: function(stories) {
	 var c = Ext.create('Ext.Container', {
	    layout: {
		type: 'absolute'
	    },
	    x: 400
	});
	this.add(c);
        this._store = Ext.create('Rally.data.custom.Store', {
                data: stories,
                pageSize: 100,
                remoteSort:false
            });
        
        if (!this.down('#grid')){
         c.add({
            xtype: 'rallygrid',
            itemId: 'grid',
            store: this._store,
            columnCfgs: [
                {
                   text: 'Formatted ID', dataIndex: 'FormattedID', xtype: 'templatecolumn',
                    tpl: Ext.create('Rally.ui.renderer.template.FormattedIDTemplate')
                },
                {
                    text: 'Name', dataIndex: 'Name'
                },
		 {
                    text: 'Defect Count', dataIndex: 'DefectCount'
                },
                {
                    text: 'Defects', dataIndex: 'Defects', 
                    renderer: function(value) {
                        var html = [];
                        Ext.Array.each(value, function(defect){
                            html.push('<a href="' + Rally.nav.Manager.getDetailUrl(defect) + '">' + defect.FormattedID + '</a>')
                        });
                        return html.join(', ');
                    }
                }
            ]
            
        });
        }
        else{
            this.down('#grid').reconfigure(this._store);
        }
    }
});