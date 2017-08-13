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
		this.typeData = {
			'none':{}
		}
		this.ruinData = {
			type: 'none',
			groups: {}
		}
		this.ruinType = 'none';

		this.types = function(){

			this.addType = function(typeName,groups){
				typeData[typeName]=groups;
			}

			return this;
		}();

		this.groups = function(){

			this.clearGroups = function(designation,obelisks){
				ruinData.groups = {}
			}

			this.addGroup = function(designation,obelisks){
				ruinData.groups[designation]=obelisks;
			}

			this.hideAllForType = function(){
				//Loop through the alphabet until we can confirm that the api contains all scan groups
				var alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
			    $.each(alphabet, function(index,letter) {
			    	$('#group-'+letter).hide();
			    });

			}

			this.showAll = function(){
				//Show those that have been added
				$.each( ruins.ruinData.groups , function( designation, value ) {
					$('#group-'+designation).show();
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
			var groupDesignation = parentId.split('-')[1];

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
			/*
			TODO: Test and enable on mobile

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
			*/

	      	//Click handlers
	      	$('[id*="obelisk-on-"]').on('click',function(e){
	      		__obeliskSelect(e);
	      	}).css( 'cursor', 'pointer' );	      	

	      	//Number selection (add handler, cursor/pointer and class for checking elements)
	      	$('[id^="group-"][id$="-numbers"] text tspan').on('mousedown touchstart',function(e){
	      		registerTouch = 1;
	      	}).on('touchmove',function(e){
	      		registerTouch = 0;
	      	}).on('touchend',function(e){
	      		if(registerTouch == 0){
	      			e.preventDefault();
	      			return;
	      		}
	      		registerTouch = 0;
	      		__numberSelect(e);
	      	}).on('click',function(e){
	      		__numberSelect(e);
	      	}).css( 'cursor', 'pointer' ).addClass('ruin-number')


			
	      	//Ensure that overlaid paths (cirles and pointers) don't interfere
	      	$('g path[id*="circle"]').closest('g').css('pointer-events','none');

	      	//Ensure that letters don't handle pointer events
	      	//$('[id^="group-"][id$="-numbers"]').css('pointer-events','none');
	      	
			$('[id^="group-"][id$="-numbers"] text tspan').each(function( index ) {
        		var elem = $( this );
        		var display = elem.text().trim();
        		if(display.match(/[a-z]+/i)){
        			//This is one of the character overlays.  Disable it
        			elem.css('pointer-events','none').css( 'cursor', 'auto' );
        		}else if(display.match(/[0-9]+/)){
        			var parentLetter = elem.closest('g').attr('id');
        			parentLetter = parentLetter.split('-')[1];
        			elem.attr('id','number-' + parentLetter + '-' + parseInt(display));
        			console.log(elem.attr('id'));
        		}
			});
	      	

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
			var matching = $('#obelisk-on-' + group + '-' + number);

			if(matching.length > 0){
				__doFocusOnElement(matching[0],group,number);
			}

		}

		this.setObeliskState = function(group,number,state){
			if(state == 'a'){
				$('#obelisk-on-' + group + '-' + number).show();
			}else{
				$('#obelisk-on-' + group + '-' + number).hide();
			}

			if(state == 'i'){
				$('#obelisk-off-' + group + '-' + number).show();
			}else{
				$('#obelisk-off-' + group + '-' + number).hide();
			}

			if(state == 'b'){
				$('#obelisk-broken-' + group + '-' + number).show();
			}else{
				$('#obelisk-broken-' + group + '-' + number).hide();
			}

			//Disable the associated number
			if(state != 'a'){
				$('#number-' + group + '-' + number).css('pointer-events','none').css('opacity',.5);	
			}
			
			
      	}


		return this;
	}();

	return newRuin;
}


return my;
}({});


