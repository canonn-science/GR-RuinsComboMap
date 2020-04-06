window.systems = {};
window.ruinsIndex = {};
window.ruinsUI = {
	scanListIndex: '',
	groupBand: '',
	systemBand: '',
	ruinBand: '',
	itemBand: ''
}

window.settings = {
	'api': 'https://api.canonn.tech',
	'graphql': 'https://api.canonn.tech/graphql'
}

//Beta api?  If the port is correct
if (window.location.href.indexOf('/beta/') > 0) {
	window.settings.api = 'https://api.canonn.tech:2053';
}


window.nav = {
	obelisk: '',
	filter: ''
}

window.ui = {
	enableTesting: false
}

window.userScans = {}
window.typeData = {
	'none': {}
}

/* Util Util Util Util Util Util Util Util Util Util Util Util Util Util */
/* Util Util Util Util Util Util Util Util Util Util Util Util Util Util */
/* Util Util Util Util Util Util Util Util Util Util Util Util Util Util */

function stringMatchExact(a, b, canIgnoreSpaces) {
	ignoreSpaces = false; //Exact match always checks.  Regardless of what's specified
	return a == b;
}

function stringMatchContains(a, b, canIgnoreSpaces) {
	canIgnoreSpaces = canIgnoreSpaces || false;

	if (canIgnoreSpaces) {
		//Is there a match if we remove spaces?
		if (a.replace(/ /g, '').indexOf(b) > -1) {
			//Yes
			return true;
		}
		//No.  Default to regular comparison
	}

	//Does this contain the value
	return (a.indexOf(b) > -1);

}

/* Mapping Mapping Mapping Mapping Mapping Mapping Mapping Mapping Mapping  */
/* Mapping Mapping Mapping Mapping Mapping Mapping Mapping Mapping Mapping  */
/* Mapping Mapping Mapping Mapping Mapping Mapping Mapping Mapping Mapping  */

function collapseSystemRow(systemId) {
	var row = $('#system-' + systemId);
	//collapse
	row.addClass('collapsed');
	row.removeClass('expanded');
	//Hide all items that are "children" of this
	$('.ruin_system_' + systemId).hide();
}

function expandSystemRow(systemId) {
	var row = $('#system-' + systemId);
	//expand
	row.addClass('expanded');
	row.removeClass('collapsed');
	//Show all items that are "children" of this
	$('.ruin_system_' + systemId).show();
}


function clearRuinList() {
	window.ruinsUI.systemBand = '';
	window.ruinsUI.ruinBand = '';

	//Clear everything
	$('#ruin-list').find("tr:gt(0)").remove();
}

function addSystemToList(systemInfo) {
	//System heading
	var bandClass = '';
	var systemId = $('<div/>').text(systemInfo.systemId).html();

	if (window.ruinsUI.systemBand == '') {
		window.ruinsUI.systemBand = 'band'
	} else {
		window.ruinsUI.systemBand = '';
	}


	var row = $('#ruin-list').append([
		'<tr class="ruin_list_system ' + window.ruinsUI.systemBand + '" id="system-' + systemId + '">',
		'<td colspan="4" class="ruin_list_system_name"><div class="expand_status" alt="expand-collapse icon"/>' + $('<div/>').text(systemInfo.systemName).html() + '</td>',
		'</tr>'
	].join(''));
}

function addRuinToList(systemInfo, ruinInfo) {
	//Add the ruin to the associated Ruins and
	var systemId = $('<div/>').text(systemInfo.systemId).html();
	var ruinId = $('<div/>').text(ruinInfo.ruinId).html();
	var ruinType = $('<div/>').text(ruinInfo.ruinTypeName).html();

	if (window.ruinsUI.ruinBand == '') {
		window.ruinsUI.ruinBand = 'ruinband'
	} else {
		window.ruinsUI.ruinBand = '';
	}


	$('#ruin-list').append([
		'<tr class="ruin_list_ruin ruin_system_' + systemId + ' ruin_' + ruinId + ' ' + window.ruinsUI.ruinBand + '" id="ruin-' + ruinId + '"">',
		'<td class="indented">',
		$('<div/>').text(ruinInfo.bodyName).html(),
		'</td>',
		'<td>' + 'GR' + ruinInfo.ruinId + '</td>',
		'<td>' + ruinType + '</td>',
		'<td>' + $('<div/>').text(ruinInfo.coordinates.join(',')).html() + '</td>',
		'</tr>'
	].join(''));

}

function prepMapUI(completed) {

	window.ruins = Guardian.getRuin({
		panzoom: $(".panzoom"),

		onMapReady: function (type) {

			//Clear existing gropus
			window.ruins.groups.clearGroups();

			//Add those that exist in the current ruin
			$.each(window.currentRuin.obelisks, function (group, obeliskData) {
				window.ruins.groups.addGroup(group, obeliskData);
			})

			//Hide all groups for the given type
			window.ruins.groups.hideAllForType();

			//Now show those we've added
			window.ruins.groups.showAll();

			//Clear info panel listing
			clearScanList();

			//Disable obelisks that are "broken/inactive" and add scan list items
			$.each(window.currentRuin.obelisks, function (group, obeliskData) {

				//Get the scan data for the given group
				//var scanData = window.ruins.typeData[window.ruins.ruinData.type][group];

				//Now for those that are inactive... we disable.  Otherwise if there's a scan we add it
				for (var o = 1; o < obeliskData.length; o++) {
					data = obeliskData[o];
					//Have scan data as well?
					if (data.active == 1) {
						//Add the scan data
						addScanListItem(group, data.number, data.primaryArtifact, data.secondaryArtifact, data.categoryName + ' ' + data.codexNumber);
						$('#ruin-number-' + group + ' .ruin-number-' + data.number).css('fill', '#00d5ff').css('stroke', '#00d5ff');
					} else if (data.broken) {
						//Flag the obelisk as broken
						$('#ruin-number-' + group + ' .ruin-number-' + data.number).css('fill', '#FF0000').css('stroke', '#FF0000');
						//Disable this obelisk
						window.ruins.disableObelisk(group, data.number);
					} else {
						//Disable this obelisk
						window.ruins.disableObelisk(group, data.number);
					}
				};
			});

			if ($.isEmptyObject(window.currentRuin.obelisks)) {
				//Update notice
				showNotice('No scan data currently available for this ruin', false);
			} else {
				//Hide notice
				hideNotice();
			}


			//Reset the zoom
			window.ruins.zoomReset();

			//And present
			showMap();

			//Now jump to a nav if applicable
			if (window.nav.obelisk.length >= 2) {
				//Get the group
				var group = window.nav.obelisk.substring(0, 1);
				group = group.toLowerCase();

				//Valid group?
				if (window.currentRuin.obelisks[group]) {
					//Yes.  Now the number
					var number = parseInt(window.nav.obelisk.substring(1, window.nav.obelisk.length));
					if (!isNaN(number)) {
						window.ruins.focusOnObelisk(group, number);
					}
				}
			}



			/* Map Testing only */
			if (window.ui.enableTesting) {
				//Remove existing
				$('#test-groups').empty();
				var alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
				$.each(alphabet, function (index, letter) {
					$('#test-groups').append([
						'<label for="test-group-' + letter + '">',
						'<input type="checkbox" class="test-letter-group" id="test-group-' + letter + '" value="' + letter + '" checked>' + letter.toUpperCase(),
						'</label><BR/>'
					].join(''));

					//Show it
					$('.ruin-group-' + letter).show();
				});

				//Handle being clicked
				$('.test-letter-group').on('click', function (e) {
					var clickedElement = $(e.target);
					//Show it
					if (e.target.checked) {
						$('.ruin-group-' + clickedElement.val()).show();

					} else {
						$('.ruin-group-' + clickedElement.val()).hide();

					}

				});


				$('#test-groups').show();

			}


		},
		onMapFailed: function (failure) {
			showNotice('Map problem encountered: ' + failure.statusText, false);
		},

		onObeliskFocus: function onObeliskFocus(e, type, group, number) {
			//And "flicker"
			flashObelisk(e, 6);
		},

		onObeliskSelected: onMapSelection,
		onNumberSelected: onMapSelection
	});

	//Get our site scans and store it
	completed();


	//Scan Data menu
	$('#ruin_obelisk_data_close').on('click', function (e) {
		//Hide the popup
		hideScanData();
	});

	//Handle closing if clicked outside
	$(document).on('click', function (event) {
		var clickedItem = $(event.target);
		//Ignore if this is a number or obelisk.  Those we expect to trigger this event or change the scan displayed
		if (clickedItem.hasClass('ruin-number') || clickedItem.hasClass('ruin-obelisk') || clickedItem.parents('.ruin-scan-ui').length > 0) {
			return;
		}

		if (!(clickedItem.id == "ruin_obelisk_data" || clickedItem.parents("#ruin_obelisk_data").length)) {
			if ($('#ruin_obelisk_data').css('display') === 'block') {
				hideScanData();
			}
		}

		if ($('#notice').css('display') === 'flex') {
			hideNotice();
		}

		$('#ruin-scan-selections').hide();
	})

	//Handle escape key
	$(document).keyup(function (e) {
		if (e.keyCode === 27) {
			//Hide any dialogs
			hideInfoBar();
			hideScanData();
		}
	});

	window.flashObelisk = function (obelisk, count) {
		if (count <= 0) {
			//Done
			$(obelisk).show();
			return;
		}

		//Decrement
		count--;

		if (1 == (count % 2)) {
			$(obelisk).fadeOut(200);
		} else {
			$(obelisk).fadeIn(200);
		}

		setTimeout(function () {
			flashObelisk(obelisk, count);
		}, 100);
	}


	function clearScanList() {
		window.ruinsUI.scanListIndex = '';
		window.ruinsUI.groupBand = '';
		window.ruinsUI.itemBand = '';

		//Clear everything
		$('#scan-list').find("tr:gt(0)").remove();
	}

	function addScanListItem(group, number, item1, item2, scan) {
		var numDisplay = padNumber(number);

		//New item?
		if (window.ruinsUI.scanListIndex !== group) {
			//Reset item band
			window.ruinsUI.itemBand = '';

			//alternate band
			if ('' === window.ruinsUI.groupBand) {
				window.ruinsUI.groupBand = 'band';
			} else {
				window.ruinsUI.groupBand = '';
			}

			//New group entry
			$('#scan-list').append([
				'<tr id="group-' + group + '" class="obelisk-group groupitem ' + window.ruinsUI.groupBand + '">',
				'<td colspan="4"><div class="expand_status" alt="expand-collapse icon"/>' + $('<div/>').text(group.toUpperCase()).html() + '</td>',
				'</tr>'
			].join(''));
		}

		//alternate band
		if ('' === window.ruinsUI.itemBand) {
			window.ruinsUI.itemBand = 'scanband';
		} else {
			window.ruinsUI.itemBand = '';
		}

		$('#scan-list').append([
			'<tr class="obelisk-selection indented obelisk-scans-' + group + ' ' + window.ruinsUI.itemBand + '" id="focus-' + group + '-' + number + '">',
			'<td>' + $('<div/>').text(group.toUpperCase() + numDisplay).html() + '</td>',
			'<td>' + $('<div/>').text(item1).html() + '</td>',
			'<td>' + $('<div/>').text((item2 || ' ')).html() + '</td>',
			'<td>' + $('<div/>').text(scan).html() + '</td>',
			'</tr>'
		].join(''));

		//Update
		window.ruinsUI.scanListIndex = group;
	}

	//Bind our more control
	$('#info_bar').on('click', function (e) {
		if ($('#info').hasClass('down')) {
			showInfoBar();
		} else {
			hideInfoBar();
		}
	});

	//Bind our activity list control
	$('#activity_checklist_icon').on('click', function (e) {
		if ($('#activity').hasClass('hidden')) {
			showScanChecklist();
		} else {
			hideScanChecklist();
		}
	});

	//Checklist
	$('#activity_selections td').on('click', function (e) {
		var clickedElement = $(e.target);
		var id = clickedElement.attr('id') || '';
		if (id.indexOf('activity_scan') > -1) {
			//Get the type and number
			var idInfo = id.split('-');
			var type = idInfo[1];
			var num = idInfo[2];

			if (!window.userScans[type]) {
				window.userScans[type] = {};
			}

			window.userScans[type][num] = 1;

			clickedElement.addClass('selected');
		}
	});

	//Scan Filter
	$('#ruin-scan-selections td.scan-selection').on('click', function (e) {
		var clickedElement = $(e.target);
		clickedElement.toggleClass('selected');
		return;
	});

	//Reset Filter button
	$('#ruin-scan-selections button.reset_button').on('click', function (e) {
		//Remove selections
		$('#ruin-scan-selections td.scan-selection').removeClass('selected');
		//Uncheck
		$('#scan-filter-any').prop('checked', false);

		updateScanFilter();
	});

	//Apply Filter button
	$('#ruin-scan-selections button.apply_button').on('click', function (e) {
		updateScanFilter();
	});

	//Added to the table since the elements are dynamically added
	$('#scan-list').on('click', function (e) {
		var clicked = $(e.target);
		var row = $(clicked.closest('tr'));

		if (row.hasClass('groupitem')) {
			//Display all ruins in the given system
			if (row[0].id) {
				//Get the system ID
				var idGroup = row[0].id.split('-');

				if (2 === idGroup.length) {
					if (row.hasClass('expanded')) {
						//collapse
						row.addClass('collapsed');
						row.removeClass('expanded');
						//Hide all items that are "children" of this
						$('.obelisk-scans-' + idGroup[1]).hide();
					} else {
						//expand
						row.addClass('expanded');
						row.removeClass('collapsed');
						//Show all items that are "children" of this
						$('.obelisk-scans-' + idGroup[1]).show();
					}
				}
			}

		} else if (row.hasClass('obelisk-selection')) {
			//Display all ruins in the given system
			if (row[0].id) {
				//Get the system ID
				var obData = row[0].id.split('-');

				if (3 === obData.length) {
					//Hide
					hideInfoBar();

					//Focus on the obelisk
					window.ruins.focusOnObelisk(obData[1], obData[2]);
				}
			}
		}


	});

	//Handle the zoom controls manually
	$("#zoom-in").on('click', function () {
		window.ruins.zoomIn();
	});

	$("#zoom-out").on('click', function () {
		window.ruins.zoomOut();
	});

	$("#zoom-reset").on('click', function () {
		window.ruins.zoomReset();
	});

	$("#return_to_systems").on('click', function () {
		//Enable navigation back
		$('#return_to_map').show();
		//Show listing
		showSystems();
	});


	$("#edbearing").on('click', function () {
		var desc = window.currentRuin.ruinTypeName + ' Ruin at ' + [
			window.currentRuin.systemName,
			window.currentRuin.bodyName,
		].join(' | ');
		var lat = window.currentRuin.coordinates[0];
		var lon = window.currentRuin.coordinates[1];

		var bearingUrl = 'http://hotdoy.ca/ed/bearing/?lat=' + encodeURIComponent(lat) + '&lon=' + encodeURIComponent(lon) + '&title=' + encodeURIComponent(desc);

		window.open(bearingUrl, '_blank');
	});

	$("#edsm").on('click', function () {
		var edsmLink = window.currentRuin.edsmBodyLink;
		if (!edsmLink) {
			edsmLink = window.currentRuin.edsmSystemLink
		}
		window.open(edsmLink, '_blank');
	});


}

function updateScanFilter() {
	//Search for sites with the filter
	var filter = {}
	var filterCount = 0;
	var filterDisplay = '';

	$('#ruin-scan-selections td.scan-selection.selected').each(function (index) {
		filterCount++;
		var elem = $(this);
		var filterInfo = elem.attr('id').split('-');
		if (!(filterInfo[0] in filter)) {
			filter[filterInfo[0]] = [];
		}
		filter[filterInfo[0]].push(filterInfo[1])
	});

	//Sort the filter list by name to build the display icon
	scanKey = [];
	for (k in filter) {
		if (filter.hasOwnProperty(k)) {
			scanKey.push(k);
		}
	}

	scanKey = scanKey.sort();
	$.each(scanKey, function (index, item) {
		if (filterDisplay.length > 0) {
			filterDisplay += '; ';
		}

		filterDisplay += item.substring(0, 3).toUpperCase();

		var scanNumbers = '';

		$.each(filter[item], function (index, item) {
			if (scanNumbers.length > 0) {
				scanNumbers += ', ';
			}

			scanNumbers += item;
		});

		filterDisplay += ' ' + scanNumbers;
	});

	if (filterDisplay.length > 30) {
		filterDisplay = filterDisplay.substring(0, 30) + '...';
	}


	//Update label
	$('#ruin-scan-filter label.scan-label').text('With Scans: ' + filterDisplay);

	if (filterCount > 0) {
		showNotice('Searching Filters', true);
		//TODO: GraphQL equivalent for this
		$.post({
			url: "https://api.canonn.technology/api/v1/ruinsites/searchdata/",
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify(filter)
		}).done(function (results) {
			scanFilterResults(results);
			hideNotice();
		}).fail(function (d, textStatus, error) {
			showNotice("Filter Search failed: " + (error || textStatus), false);
		});
	} else {
		//Show all items
		filterResults('');
	}

	//Close
	$('#ruin-scan-selections').hide();
}

function showMap() {
	//Scroll up
	$(window).scrollTop(0);

	$('#systems').hide();
	$('#map').show();

	//Change history state
	if (window.currentRuin.ruinId) {
		window.history.pushState(null, "Ruin " + window.currentRuin.ruinId, "#GR" + window.currentRuin.ruinId);
	}
}

function showSystems() {
	$('#map').hide();
	$('#systems').show();

	//Change history state
	window.history.pushState(null, "Ruin List", "#");
}

function onMapSelection(e, type, group, number) {
	//Get the scan details for the given obelisk set
	var scanData = window.currentRuin.obelisks[group][number];

	var numDisplay = padNumber(number);

	if (scanData.active) {
		showScanData(group.toUpperCase() + numDisplay, scanData.primaryArtifact, scanData.secondaryArtifact, scanData.categoryName + ' ' + scanData.codexNumber, scanData.verified);
	} else {
		showNotice('No scans available for this obelisk', false, 1000);
	}
}

function hideScanData() {
	$('#ruin_obelisk_data').hide();
}

function showScanData(obelisk, object1, object2, data, verified) {
	//Display
	var object1 = object1 || 'None';
	var object2 = object2 || 'None';

	$('#scan_obelisk').text(obelisk);
	$('#scan_object1').text(object1);
	$('#scan_object1icon').css('background-image', 'url("images/maps/ruin_' + object1.toLowerCase() + '.png")');

	$('#scan_object2').text(object2);
	$('#scan_object2icon').css('background-image', 'url("images/maps/ruin_' + object2.toLowerCase() + '.png")');

	$('#scan_result').text(data);
	if (verified) {
		$('#scan_result').attr('title', 'Verified').addClass('verified');
	} else {
		$('#scan_result').attr('title', 'Not verified').removeClass('verified');
	}


	$('#scan_result_link').attr('href', 'https://github.com/canonn-science/RuinsComboMap/issues/new?title=' + encodeURIComponent('Ruins Invalid Data Report - GR' + window.currentRuin.ruinId + ' - ' + obelisk));
	$('#ruin_obelisk_data').show();
}

window.showInfoBar = function () {
	$('#info').addClass('up');
	$('#info').removeClass('down');
	//Change chevron
	$('#info_bar .chevron').html('&#x25BE');
}

window.hideInfoBar = function () {
	$('#info').addClass('down');
	$('#info').removeClass('up');
	//Change chevron
	$('#info_bar .chevron').html('&#x25B4');
}

window.showScanChecklist = function () {
	$('#activity').addClass('shown');
	$('#activity').removeClass('hidden');
}


window.hideScanChecklist = function () {
	$('#activity').addClass('hidden');
	$('#activity').removeClass('shown');
}

function padNumber(number) {
	var numDisplay = number;

	if (numDisplay < 9) {
		numDisplay = '0' + numDisplay;
	}

	return numDisplay;
}

function ruinSelected(ruinId) {
	//Get the associated system info
	var ruinSystem = window.ruinsIndex[ruinId];
	if (!ruinSystem) {
		showNotice('Unable to find Ruin Info for ID ' + ruinId, true);
		return;
	}

	var systemId = ruinSystem.systemId;
	var type = ruinSystem.ruinTypeName.toLowerCase();

	//Start by loading the map type
	showNotice('Getting Ruin Info', true);

	$.post({
		url: window.settings.graphql,
		data: JSON.stringify({ query: '{grsite (id: ' + parseInt(ruinId) + ') { siteID system{ systemName } body { bodyName } type { type } latitude longitude verified discoveredBy { cmdrName } activeGroups { activeGroup { groupName amount } } activeObelisks { activeObelisk { grObeliskGroup{ groupName } obeliskNumber broken verified grCodexData { grCodexCategory { categoryName } codexNumber grPrimaryArtifact { artifactName } grSecondaryArtifact { artifactName }} } } } }' }),
		dataType: 'json',
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json',
		}
	}).done(function (response) {
		var obeliskData = {};

		//Set obelisk data
		$.each(window.typeData[type], function (group) {
			if (!obeliskData[group]) {
				obeliskData[group] = [];
			}

			for (var o = 1; o < window.typeData[type][group].length; o++) {
				var isBroken = window.typeData[type][group][o].broken || false;

				//Preset the obelisk template info
				obeliskData[group][o] = {
					type: type,
					group: group,
					number: o,
					active: 0,
					broken: isBroken,
					categoryName: '',
					codexNumber: '',
					verified: false,
					primaryArtifact: '',
					secondaryArtifact: ''
				}
			}
		});

		$.each(response.data.grsite.activeObelisks, function (index, data) {
			var groupName = data.activeObelisk.grObeliskGroup.groupName.toLowerCase();
			var categoryName = '';
			var codexNumber = ''
			var primaryArt = '';
			var secondaryArt = '';

			if (data.activeObelisk.grCodexData) {
				categoryName = data.activeObelisk.grCodexData.grCodexCategory.categoryName;
				codexNumber = data.activeObelisk.grCodexData.codexNumber;

				if (data.activeObelisk.grCodexData.grPrimaryArtifact) {
					primaryArt = data.activeObelisk.grCodexData.grPrimaryArtifact.artifactName;
				}

				if (data.activeObelisk.grCodexData.grSecondaryArtifact) {
					secondaryArt = data.activeObelisk.grCodexData.grSecondaryArtifact.artifactName;
				}
			}

			var obeliskItem = obeliskData[groupName][data.activeObelisk.obeliskNumber];

			obeliskItem.active = 1;
			obeliskItem.categoryName = categoryName;
			obeliskItem.codexNumber = codexNumber;
			obeliskItem.verified = data.activeObelisk.isVerified || false;
			obeliskItem.primaryArtifact = primaryArt;
			obeliskItem.secondaryArtifact = secondaryArt;

			obeliskData[groupName][data.activeObelisk.obeliskNumber] = obeliskItem;

		});


		//Add obelisks data
		ruinSystem.obelisks = obeliskData;

		//Store ruin data in currentRuin;
		window.currentRuin = ruinSystem;

		//Update map header info
		$('#map_heading h1').text([
			window.systems[systemId].systemName,
			window.currentRuin.bodyName,
			window.currentRuin.coordinates.join(', ')
		].join(' | ') + ' (' + window.currentRuin.ruinTypeName + ')');

		//And show
		showNotice('Opening Ruin Map', true);
		window.ruins.setRuinType(type);

	}).fail(function (jqXHR, textStatus, errorThrown) {
		var errorDetails = JSON.parse(jqXHR.responseText);

		showNotice("Getting Ruin Info failed: " + errorDetails.errors[0].message, false);
	});

}

/* Selection Selection Selection Selection Selection Selection Selection */
/* Selection Selection Selection Selection Selection Selection Selection */
/* Selection Selection Selection Selection Selection Selection Selection */
/* Selection Selection Selection Selection Selection Selection Selection */
function getSiteScans(completed) {
	//Show status
	showNotice('Getting Scan Listing', true);

	var scanRequest = window.settings.api + "/api/v1/maps/scandata";


	$.post({
		url: window.settings.graphql,
		data: JSON.stringify({ query: '{grsite (id: ' + parseInt(ruinId) + ') { siteID system{ systemName } body { bodyName } type { type } latitude longitude verified discoveredBy { cmdrName } activeGroups { activeGroup { groupName amount } } activeObelisks { activeObelisk { grObeliskGroup{ groupName } obeliskNumber broken verified grCodexData { grCodexCategory { categoryName } codexNumber } } } } }' }),
		dataType: 'json',
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json',
		}
	}).done(function (response) {
		hideNotice();

		//Add our data
		$.each(scanList, function (type, groups) {
			window.ruins.setType(type, groups);
		});
	}).fail(function (jqXHR, textStatus, errorThrown) {
		var errorDetails = JSON.parse(jqXHR.responseText);

		showNotice("Getting Site Scans failed: " + errorDetails.errors[0].message, false);
	}).always(function () {
		completed();
	});


	return;



	$.get(scanRequest, { format: "json" }).done(function (scanList) {
		hideNotice();

		//Add our data
		$.each(scanList, function (type, groups) {
			window.ruins.setType(type, groups);
		});
	})
		.fail(function (d, textStatus, error) {
			showNotice("Getting Site Scans failed: " + error, false);
		}).always(function () {
			completed();
		});



}

function showSystemList(systemList) {
	//Clear everything
	clearRuinList();

	//Have any items?
	if (systemList.length < 1) {
		return false;
	}

	//Sort the system list by name
	systemList = systemList.sort(function (a, b) {
		return a.systemName.localeCompare(b.systemName);
	});

	$.each(systemList, function (index, system) {
		addSystemToList(system);

		window.ruinsUI.ruinBand = '';

		//Sort by ID
		system.ruins = system.ruins.sort(function (a, b) {
			return a.ruinId - b.ruinId;
		});

		$.each(system.ruins, function (rindex, ruin) {
			addRuinToList(system, ruin);
		});



	});
}


function getRuinList() {


	//Show status
	showNotice('Getting Ruin List', true);

	$.post({
		url: window.settings.graphql,
		data: JSON.stringify({ query: '{grobelisks( limit: 1000 sort: "grType" ) { grType{ type } grObeliskGroup { groupName } obeliskNumber broken }  grsites(limit: 1000) {siteID latitude longitude system{id systemName edsmID} body{bodyName edsmID} type{ type }  }   }' }),
		dataType: 'json',
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json',
		}
	}).done(function (response) {
		hideNotice();

		//Clear existing
		window.systems = {};
		window.ruinsIndex = {}

		var currentType = '';
		var typeObelisks = {}

		$.each(response.data.grobelisks, function (index, data) {
			var obeliskType = data.grType.type;
			var obeliskGroup = data.grObeliskGroup.groupName.toLowerCase();
			//var obeliskNumber = data.obeliskNumber;
			//data.broken

			//Change in type?  Let's store what we have
			if (currentType != '' && obeliskType != currentType) {
				//Add the type data
				window.typeData[currentType.toLowerCase()] = typeObelisks;

				//Reset
				typeObelisks = {}
			}

			//Add a group?
			if (!typeObelisks[obeliskGroup]) {
				//Yes. Set an empty array
				typeObelisks[obeliskGroup] = [];
			}

			//Add the obelisk data
			typeObelisks[obeliskGroup][data.obeliskNumber] = {
				type: obeliskType,
				group: obeliskGroup,
				number: data.obeliskNumber,
				broken: data.broken
			}

			currentType = obeliskType;


		});

		//Add the last type
		if (currentType != '') {
			//Add the type data
			window.typeData[currentType.toLowerCase()] = typeObelisks;
		}

		$.each(response.data.grsites, function (index, data) {
			var systemData = {}

			//Check if this system exists
			if (window.systems[data.system.id]) {
				systemData = window.systems[data.system.id];
			} else {
				//Populate system object
				systemData = {
					systemId: data.system.id,
					systemName: data.system.systemName,
					edsmSystemLink: '',
					ruins: []
				}

				if (data.system.edsmID) {
					systemData.edsmSystemLink = "https://www.edsm.net/en/system/id/" + encodeURIComponent(data.system.edsmID) + '/name/' + encodeURIComponent(systemData.systemName);
				}
			}


			//Ruins data
			var ruinData = {
				ruinId: data.siteID,
				systemId: systemData.systemId,
				bodyName: data.body.bodyName.replace(systemData.systemName, ''),
				ruinTypeName: data.type.type,
				coordinates: [data.latitude, data.longitude],
				edsmBodyLink: ''
			}
			if (data.system.edsmID && data.body.edsmID) {
				ruinData.edsmBodyLink = "https://www.edsm.net/en/system/bodies/id/" + encodeURIComponent(data.system.edsmID) + '/name/' + encodeURIComponent(systemData.systemName) + '/details/idB/' + encodeURIComponent(data.body.edsmID) + '/nameB/' + encodeURIComponent(data.body.bodyName);
			}

			//Add the ruin
			systemData.ruins.push(ruinData);
			window.ruinsIndex[ruinData.ruinId] = ruinData;

			//Update the system
			window.systems[systemData.systemId] = systemData;
		});



		//Show all items by filtering with "none"
		filterResults('');

		onRuinListReady();




	}).fail(function (jqXHR, textStatus, errorThrown) {
		var errorDetails = JSON.parse(jqXHR.responseText);

		showNotice("Getting Ruin List failed: " + errorDetails.errors[0].message, false);

	});

}

function prepSelectionUI() {
	//Map Listing
	$('#return_to_map').on('click', function (e) {
		//Show the map
		showMap();
	})


	//Added to the table since the elements are dynamically added
	$('#ruin-list').on('click', function (e) {
		var clicked = $(e.target);
		var row = $(clicked.closest('tr'));

		if (row.hasClass('ruin_list_system')) {
			//Display all ruins in the given system
			if (row[0].id) {
				//Get the system ID
				var idSystem = row[0].id.split('-');

				if (2 === idSystem.length) {
					if (row.hasClass('expanded')) {
						collapseSystemRow(idSystem[1]);
					} else {
						expandSystemRow(idSystem[1]);
					}
				}
			}

		} else if (row.hasClass('ruin_list_ruin')) {
			//Display ruin
			if (row[0].id) {
				var idType = row[0].id.split('-');

				if (2 === idType.length) {
					ruinSelected(idType[1]);
				}
			}
		}
	});

	//Filter handling
	$('#ruin-filter').on('keyup', function (e) {
		filterResults($(e.target).val())
	}
	);
	$('#ruin-filter').on('paste', function (e) {
		setTimeout(function () {
			filterResults($(e.target).val())
		}, 0)
	}
	);

	//Filter for scans
	//

	$('#ruin-scan-filter label.scan-label').on('click', showScanFilterOptions).on('mouseover', showScanFilterOptions);

}

function showScanFilterOptions(e) {
	$('#ruin-scan-selections').toggle();
}

function scanFilterResults(filterResult) {
	var anyScans = ($('#scan-filter-any:checked').length > 0);
	var filterSystems = [];

	if (!anyScans) {
		if ('COMBINED' in filterResult) {
			filterSystems = filterResult['COMBINED'][0];
		}
	} else {
		//Get the different scans
		for (k in filterResult) {
			if (filterResult.hasOwnProperty(k)) {
				if ('COMBINED' !== k) {
					//Enumerate the scans
					$.each(filterResult[k], function (scanNumber, resultArray) {
						//Enumerate the systems
						$.each(resultArray, function (index, result) {
							if (!(result.id in filterSystems)) {
								filterSystems[result.id] = result;
							}
						});

					});
				}
			}
		}
	}


	//Find the matching systems and build a list based on our results
	var foundSystems = [];

	if (filterSystems.length > 0) {
		$.each(filterSystems, function (index, useRuin) {
			if (useRuin) {
				var useRuinId = useRuin.id;
				var ruinLookup = window.ruinsIndex[useRuinId];
				var fullRuin = window.ruinsIndex[useRuinId].ruin;
				var useSystem;


				//Already added?
				if (ruinLookup.systemId in foundSystems) {
					useSystem = foundSystems[ruinLookup.systemId];
				} else {
					useSystem = jQuery.extend({}, window.systems[ruinLookup.systemId]);
					useSystem.ruins = []; //empty ruins... will be populated by matching items
					foundSystems[ruinLookup.systemId] = useSystem;
				}

				//Add the matching ruin
				useSystem.ruins[useSystem.ruins.length] = jQuery.extend({}, fullRuin);
			}
		});
	}

	//Add the systems to the match as an ordered array
	var matchSystems = [];

	$.each(foundSystems, function (index, system) {
		if (system) {
			matchSystems[matchSystems.length] = system;
		}

	});


	showSystemList(matchSystems);
}


function filterResults(inputVal) {
	inputVal = inputVal.toUpperCase();

	//Change?
	if (window.nav.filter !== inputVal || window.nav.filter == '') {
		//Yes
		window.nav.filter = inputVal;

		//Default match
		var compare = stringMatchContains;
		//Specific?
		if (inputVal.indexOf("'") > -1 || inputVal.indexOf('"') > -1) {
			//Yes
			compare = stringMatchExact;
			//Remove any quotes now that we're done checking for specificity
			inputVal = inputVal.replace(/['|"]/g, '');
		}

		//Build a system list of matching systems or ruins
		var matchSystems = []

		//All?
		if (inputVal == '') {
			//Add all
			$.each(window.systems, function (index, system) {
				var useSystem = jQuery.extend({}, system);
				useSystem.expandDisplay = false;
				matchSystems[matchSystems.length] = useSystem;
			});

		} else {
			$.each(window.systems, function (index, system) {
				var useSystem = jQuery.extend({}, system);
				useSystem.expandDisplay = false;

				//Does the name match?
				if (compare(useSystem.systemName, inputVal)) {
					//Yes.  Add it and all ruins
					matchSystems[matchSystems.length] = useSystem;
				} else {
					//Let's search the ruins for a match
					var matchRuins = [];

					$.each(system.ruins, function (rindex, ruin) {
						//Add the system mapping
						var addRuin = false;
						var ruinIdLookup = 'GR' + ruin.ruinId;

						//Matching GRID?
						if (compare(ruinIdLookup, inputVal)) {
							addRuin = true;
						}

						//Matching body?  Allow removal of spaces so that a2 will match A 2
						if (compare(ruin.bodyName, inputVal, true)) {
							addRuin = true;
						}

						if (addRuin) {
							matchRuins[matchRuins.length] = jQuery.extend({}, ruin);
						}
					});

					//Add this system and matching ruins?
					if (matchRuins.length > 0) {
						useSystem.expandDisplay = true;
						//Replace the ruins to those that match
						useSystem.ruins = matchRuins;
						//Add
						matchSystems[matchSystems.length] = useSystem;
					}
				}
			});
		}

		showSystemList(matchSystems);

		//Expand any flagged for expansion
		$.each(matchSystems, function (index, system) {
			//Expand it automatically?
			if (system.expandDisplay) {
				expandSystemRow(system.systemId);
			}
		});



	}
}

function showNotice(noticeText, loading, closeAfter) {
	if (true == loading) {
		$('#notice').addClass('loading');
	} else {
		$('#notice').removeClass('loading');
	}
	$('#notice').text(noticeText, true).show();

	if (closeAfter) {
		setTimeout(function () {
			hideNotice();
		}, closeAfter);
	}
}

function hideNotice() {
	//Don't hide the notice if there's a delayed notice that will do so
	$('#notice').hide();
}


function onRuinListReady() {
	processNavPath();
}

function processNavPath() {
	//Check for navigation
	var navData = String(window.location.hash || '').replace('#', '').split('-');
	var ruinId = String(navData[0] || '').replace('GR', ''); //Handle either GS or GR
	var ruinId = String(ruinId || '').replace('GS', '');

	window.nav.obelisk = String(navData[1] || '');

	var ruinId = parseInt(ruinId);

	if (!isNaN(ruinId)) {
		ruinSelected(ruinId);
	}

}


$(document).ready(function () {
	//Prep the UI's
	prepSelectionUI();
	prepMapUI(function whenReady() {
		//Shared
		$('#notice').on('click', function (e) {
			$('#notice').hide();
		})

		//Load system
		getRuinList();
	});

});   //document ready

$(window).on('hashchange', function () {

	processNavPath();
});