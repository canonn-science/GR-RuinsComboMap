Guardian = function Guardian(my) {
my.getRuin = function (setOptions) {
	var setOpt = { }

	setOpt.panzoom = setOptions.panzoom || null;
	setOpt.onMapReady = setOptions.onMapReady || function onMapReady(type){ };
	setOpt.onMapFailed = setOptions.onMapFailed || function onMapFailed(status){ };
	setOpt.onObeliskSelected = setOptions.onObeliskSelected || function onObeliskSelected(e,type,group,number){}
	setOpt.onNumberSelected = setOptions.onNumberSelected || function onNumberSelected(e,type,group,number){}
	setOpt.onObeliskFocus = setOptions.onObeliskFocus || function onObeliskFocus(e,type,group,number){}

	var newRuin = function(){
		this.options = setOpt;
        this.panZoomComp = null;
        
		this.ruinData = {
			type: 'none',
			groups: {}
		}
		this.ruinType = 'none';

		this.groups = function(){

			this.clearGroups = function(designation,obelisks){
				ruinData.groups = {}
			}

			this.addGroup = function(designation,obelisks){
				ruinData.groups[designation]=obelisks;
			}

			this.hideAllForType = function(){
				/*
				var groupList = typeData[ruinData.type];

				$.each(groupList,function(designation,obelisks){
					$('.ruin-group-' + designation.toLowerCase()).hide();
				});
				*/

				//Loop through the alphabet until we can confirm that the api contains all scan groups
				var alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
			    $.each(alphabet, function(index,letter) {
			        $('.ruin-group-' + letter).hide();
			    });

			}

			this.showAll = function(showEmptyGroups = false){
				//Show those that have been added and have some active obelisks
				$.each( ruins.ruinData.groups , function( designation, value ) {
					if (showEmptyGroups || value.some(_ => _.active)) {
						$('.ruin-group-' + designation).show();
					}
				});




			}

			return this;
		}();



		this.__obeliskSelect = function(e){
			//Get the components
			var clicked = e.target.id.split('-');

			//Fire
			if(clicked.length >= 4){
				if('obelisk' === clicked[0]){
					options.onObeliskSelected(e,ruinData.type,clicked[2],clicked[3]);
				}

			}
		}

		this.__numberSelect = function(e){
			//Get the components
			var clicked = $(e.target);

			//Get the number
			var labelNum = parseInt(clicked.text());

			//Get the id of it's parent group
			var parentId = $(clicked).closest('g').attr('id');

			//And the piece
			var groupDesignation = parentId.split('-')[2];

			//Fire
			options.onNumberSelected(e,ruinData.type,groupDesignation,labelNum);
		}

		this.__getCoordinates = function(){
			var coords = {
				clientX: (panZoomComp.parent().width() / 2),
				clientY: (panZoomComp.parent().height() / 2)
			}

			return coords;
		}

		this.zoomIn = function(){
			var coords = __getCoordinates();
			panZoomComp.panzoom('zoom',false,{focal: coords, animate:true});
		}

		this.zoomOut = function(){
			var coords = __getCoordinates();
			panZoomComp.panzoom('zoom',true,{focal: coords, animate:true});
		}

		this.zoomReset = function(){
			panZoomComp.panzoom('reset');
		}

		this._prepSVG = function(){
			var registerTouch = 0;
			//Mouse wheel zoom
			panZoomComp.parent().on('wheel.focal', function( e ) {
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
	      		__obeliskSelect(e);
	      	});

	      	//Click handlers
	      	$('.ruin-obelisk').on('click',function(e){
	      		__obeliskSelect(e);
	      	});


	      	$('.ruin-number').on('mousedown touchstart',function(e){
	      		registerTouch = 1;
	      	});
	      	$('.ruin-number').on('touchmove',function(e){
	      		registerTouch = 0;
	      	})
	      	$('.ruin-number').on('touchend',function(e){
	      		if(registerTouch == 0){
	      			e.preventDefault();
	      			return;
	      		}
	      		registerTouch = 0;
	      		__numberSelect(e);
	      	});

	      	$('.ruin-number').on('click',function(e){
	      		__numberSelect(e);
	      	});

	      	//Pointer to visualize that the item can be "clicked"
	      	$('.ruin-obelisk').css( 'cursor', 'pointer' );
	      	$('.ruin-number').css( 'cursor', 'pointer' );

	      	//Ensure that non interactive items don't interefere
	      	$('.ruin-inactive').css('pointer-events','none');
		}

		this._setPanZoom = function(panZoomElement){
			panZoomComp = panZoomElement.panzoom({
				cursor: "-webkit-grab",
				minScale: 1,
				maxScale: 50,
				increment: 1,
				duration: 10,
				transition: true,
				$zoomIn: options.zoomIn,
				$zoomOut: options.zoomOut,
				$zoomRange: options.zoomRange,
				$reset: options.reset,
				$set: panZoomElement
			});
		}

		this.setRuinType = function(typeName,data){

			ruinData.type = typeName;

			$.get("maps/" + ruinData.type + ".svg").done(function(data){
				//Empty and then set the data
				options.panzoom.empty().append(data.documentElement).ready(function(r){

					_setPanZoom(options.panzoom);
					_prepSVG();

					//And note that the map is ready
					options.onMapReady(ruinData.type);

				});

			}).fail(function(failure){
				options.onMapFailed(failure);
			});



		}

		this.__doFocusOnElement = function(elem,group,number){
			//Zoom in
			panZoomComp.panzoom('zoom',10);
      		//Get the a rect
			var cRect = elem.getBoundingClientRect();
			var vRect = panZoomComp[0].getBoundingClientRect();
			var scale = panZoomComp.panzoom('getMatrix')[0];

			//SVG
			var newX = ((cRect.left) + ((cRect.width / 2) )) * -1;
			var newY = ((cRect.top) + ((cRect.height / 2) )) * -1;

			//Adjust for view including element offsets
			newX += ((vRect.width / 2) / scale);
			newY += ((vRect.height / 2) / scale);

			//Now pan to the specific location
			panZoomComp.panzoom('pan',newX,newY,{ relative: true });

			//And flag the event
			options.onObeliskFocus(elem,ruinData.type,group,number);



		}

		this.focusOnObelisk = function(group,number){
			var matching = $('#obelisk-' + ruinData.type + '-' + group + '-' + number);

			if(matching.length > 0){
				__doFocusOnElement(matching[0],group,number);
			}

		}

		this.disableObelisk = function(group,number){
			//Obelisk
			$('#obelisk-' + ruinData.type + '-' + group + '-' + number).css('pointer-events','none').css('opacity',.5);

			//Disable the associated number
			$('#ruin-number-' + group + ' .ruin-number-' + number).css('pointer-events','none').css('opacity',.5);
      	}

		return this;
	}();

	return newRuin;
}


return my;
}({});


