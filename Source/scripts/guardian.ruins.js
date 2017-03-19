Guardian = function Guardian(my) {
my.getRuin = function (setOptions) {
	var setOpt = { }

	setOpt.panzoom = setOptions.panzoom || null;
	setOpt.zoomIn = setOptions.zoomIn || null;
	setOpt.zoomOut = setOptions.zoomOut || null;
	setOpt.reset = setOptions.reset || null;
	setOpt.onMapReady = setOptions.onMapReady || function onMapReady(type){ };
	setOpt.onObeliskSelected = setOptions.onObeliskSelected || function onObeliskSelected(type,group,number){}

	var newRuin = function(){
		this.options = setOpt;
		this.panZoomComp = null;
		this.typeData = {
			'none':'',
			'alpha':'abcdefghijklmnopqrstuvwxyz'
		}
		this.ruinData = {
			type: 'none',
			groups: {}
		}
		this.ruinType = 'none';

		this.types = function(){

			this.addType = function(typeName,groups){
				ruinData.typeData[typeName]=groups;
			}

			return this;
		}();

		this.groups = function(){

			this.addGroup = function(designation,obelisks){
				console.log('adding group ' + designation);
				ruinData.groups[designation]=obelisks;
			}

			this.hideAll = function(){
				var groupList = typeData[ruinData.type];

				console.log('group list for hiding:' + ruinData.type);

				for (var i = 0, len = groupList.length; i < len; i++) {
	        		designation = groupList[i].toLowerCase();
	        		$('.ruin-group-' + designation).hide();
				};
			}

			this.showAll = function(){
				//Show those that have been added
				$.each( ruins.ruinData.groups , function( designation, value ) {
				  $('.ruin-group-' + designation).show();
				});

			}

			return this;
		}();

		this.itemInteractionSelect = function(e){
			//Get the components
			var clicked = e.target.id.split('-');

			//obelisk-alpha-b-20
			if(clicked.length >= 4){
				if('obelisk' === clicked[0]){
					options.onObeliskSelected(clicked[1],clicked[2],clicked[3]);
				}
				
			}
		}

		this.prepSVG = function(){
			var registerTouch = 0;
			//Mouse wheel zoom
			panZoomComp.parent().on('mousewheel.focal', function( e ) {
				e.preventDefault();
				var delta = e.delta || e.originalEvent.wheelDelta;
				var zoomOut = delta ? delta < 0 : e.originalEvent.deltaY > 0;
				panZoomComp.panzoom('zoom', zoomOut, {
				  increment: 0.1,
				  animate: false,
				  focal: e
				});
			});		


			//Touch specific event handling
	      	$('.ruin-obelisk').on('mousedown touchstart',function(e){
	      		registerTouch = 1;
	      	});
	      	$('.ruin-obelisk').on('touchmove',function(e){
	      		registerTouch = 0;
	      	})	          
	      	$('.ruin-obelisk').on('touchend',function(e){
	      		if(registerTouch == 0){
	      			e.preventDefault();
	      			return;
	      		}
	      		registerTouch = 0;
	      		itemInteractionSelect(e);
	      	});

	      	//Click handlers
	      	$('.ruin-obelisk').on('click',function(e){
	      		itemInteractionSelect(e);
	      	});

	      	//Pointer to visualize that the item can be "clicked"
	      	$('.ruin-obelisk').css( 'cursor', 'pointer' );

	      	//Ensure that non interactive items don't interefere
	      	$('.ruin-inactive').css('pointer-events','none');
		}

		this.setPanZoom = function(panZoomElement){
			panZoomComp = panZoomElement.panzoom({
				cursor: "-webkit-grab",
				minScale: 1,
				maxScale: 50,
				increment: 1,
				duration: 10,
				$zoomIn: options.zoomIn,
				$zoomOut: options.zoomOut,
				$zoomRange: options.zoomRange,
				$reset: options.reset,
				$set: panZoomElement
			});
		}

		this.setRuinType = function(typeName,data){

			ruinData.type = typeName;

			$.get("maps/" + ruinData.type + ".svg", function(data) {
				//Empty and then set the data
				options.panzoom.empty().append(data.documentElement);

				setPanZoom(options.panzoom);
				prepSVG();

				//And note that the map is ready
				options.onMapReady(ruinData.type);

			});
		}

		return this;
	}();

	console.log('new ruin');
	console.log(newRuin);

	return newRuin;
}


return my;
}({});


