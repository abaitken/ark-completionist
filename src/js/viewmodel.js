ko.bindingHandlers.position = {
	init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
	},
	update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
		let value = ko.unwrap(valueAccessor());
		ko.unwrap(vm.resizedNotifier());
		let parent = bindingContext['$parent'];
		let rect = $('#mapImage').position();
		let topOffset = rect.top;
		let leftOffset = rect.left;
		ko.unwrap(value.Found());
		let visibility = value.IsHidden() ? 'hidden': 'visible';
		$(element).css({
			top: parent.ConvertLatToX(value.Lat()) + topOffset,
			left: parent.ConvertLonToY(value.Lon()) + leftOffset,
			visibility: visibility
		});
	}
};

ko.bindingHandlers.top = {
	init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
	},
	update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
		let value = ko.unwrap(valueAccessor());
		ko.unwrap(vm.resizedNotifier());
		let rect = $('#mapImage').position();
		let topOffset = rect.top;		
		$(element).css({
			top: vm.ConvertLatToX(value) + topOffset
		});
	}
};

ko.bindingHandlers.left = {
	init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
	},
	update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
		let value = ko.unwrap(valueAccessor());
		ko.unwrap(vm.resizedNotifier());
		let rect = $('#mapImage').position();
		let leftOffset = rect.left;		
		$(element).css({
			left: vm.ConvertLonToY(value) + leftOffset
		});
	}
};

let NOTE_TYPES = {
	NOTE: 0,
	DOSSIER: 1,
	GLITCH: 2
};

function Compare(left, right) {
	if (left < right)
		return -1;

	if (left > right)
		return 1;

	return 0;
}

const markerSize = 6;
function ViewModel() {
	let self = this;
	self.dataReady = ko.observable(false);
	self.messages = ko.observable('Fetching...');
	self.maps = [];
	self.selectedMap = ko.observable(null);
	self.selectedMap.subscribe(function (newValue) {
		self.LoadData(newValue);
	});
	self.notes = ko.observableArray([]);
	self._foundData = new EmptyFoundNotesData();
	self.SaveValue = function (item) {
		let newValue = item.Found();
		self._foundData.SetFound(item._type, item._index, newValue);
	};
	self.SetMyCoodinates = function (lat, lon) {
		self.MyLat(lat);
		self.MyLon(lon);
	};
	self.OnItemFound = function (item) {
		self.SaveValue(item);
		if (self.UpdateMyCoordinates() && item.Found())
			self.SetMyCoodinates(item._inner.lat, item._inner.lon);
		self._updateCounts();
	};
	self.KnownLocations = ko.observableArray([]);
	self.SelectedLocation = ko.observable();
	self.SelectedLocation.subscribe(function (newValue) {
		if (newValue) {
			self.SetMyCoodinates(newValue.lat, newValue.lon);
			self.SelectedLocation(null);
		}
	});
	self.ShowMap = ko.observable(true);
	self.HideFound = ko.observable(true);
	self.UpdateMyCoordinates = ko.observable(true);
	self.SortByDistance = ko.observable(true);
	self.ShowNotes = ko.observable(true);
	self.ShowNotes.subscribe(function (newValue) {
		self._updateCounts();
	});
	self.ShowDossiers = ko.observable(true);
	self.ShowDossiers.subscribe(function (newValue) {
		self._updateCounts();
	});
	self.ShowGlitches = ko.observable(false);
	self.ShowGlitches.subscribe(function (newValue) {
		self._updateCounts();
	});
	self.MyLon = ko.observable(50.0);
	self.MyLat = ko.observable(50.0);
	self.sortedNotes = ko.pureComputed(function () {
		let notes = self.notes();

		if (self.SortByDistance()) {
			notes.sort(function (left, right) {
				return Compare(left.DistanceValue(), right.DistanceValue());
			});
		} else {
			notes.sort(function (left, right) {
				let typeCompare = Compare(left._type, right._type);
				if (typeCompare === 0)
					return Compare(left._index, right._index);

				return typeCompare;
			});

		}

		return notes;
	}, self);

	self._typesFilter = function () {
		let types = [];
		if (self.ShowGlitches())
			types.push(NOTE_TYPES.GLITCH);
		if (self.ShowDossiers())
			types.push(NOTE_TYPES.DOSSIER);
		if (self.ShowNotes())
			types.push(NOTE_TYPES.NOTE);
		return types;
	};

	self.TypeCounts = {};
	self.foundCount = ko.observable(0);
	self.totalCount = ko.observable(0);
	self.remainingCount = ko.pureComputed(function () {
		let foundCount = self.foundCount();
		let totalCount = self.totalCount();
		return totalCount - foundCount;
	});
	self.percentageValue = ko.pureComputed(function () {
		let foundCount = self.foundCount();
		let totalCount = self.totalCount();
		if (totalCount == 0)
			return 0;
		if (foundCount == totalCount)
			return 100;
		return Math.floor((foundCount / totalCount) * 100);
	});
	self.percentageComplete = ko.computed(function () {
		return self.percentageValue() + '%';
	});
	self._updateCounts = function () {
		let types = self._typesFilter();
		self.foundCount(self._foundData.FoundCount(types));

		let total = 0;
		for (let index = 0; index < types.length; index++) {
			const noteType = types[index];
			if (self.TypeCounts['type' + noteType])
				total += self.TypeCounts['type' + noteType];
		}
		self.totalCount(total);
	};

	self.ConvertLatToX = function (lat) {
		let map = self.selectedMap();
		let originalHeight = map.ImageOriginalHeight;
		let currentHeight = $("#mapImage").height();
		let scale = currentHeight / originalHeight;
		let factor = map.ScaleFactor;
		let imageTopOffset = map.ImageOffsetTop;
		return (imageTopOffset + (factor * lat) - (markerSize / 2)) * scale;
	};
	self.ConvertXToLon = function (x) {
		let map = self.selectedMap();
		let originalHeight = map.ImageOriginalHeight;
		let currentHeight = $("#mapImage").height();
		let scale = currentHeight / originalHeight;
		let factor = map.ScaleFactor;
		let imageTopOffset = map.ImageOffsetTop;
		return ((x / scale) - imageTopOffset) / factor;
	};
	self.ConvertLonToY = function (lon) {
		let map = self.selectedMap();
		let originalWidth = map.ImageOriginalWidth;
		let currentWidth = $("#mapImage").width();
		let scale = currentWidth / originalWidth;
		let factor = map.ScaleFactor;
		let imageLeftOffset = map.ImageOffsetLeft;
		return (imageLeftOffset + (factor * lon) - (markerSize / 2)) * scale;
	};
	self.ConvertYToLat = function (y) {
		let map = self.selectedMap();
		let originalWidth = map.ImageOriginalWidth;
		let currentWidth = $("#mapImage").width();
		let scale = currentWidth / originalWidth;
		let factor = map.ScaleFactor;
		let imageLeftOffset = map.ImageOffsetLeft;
		return ((y / scale) - imageLeftOffset) / factor;
	};
    
	self.resizedNotifier = ko.observable();
    self.UpdateCoordinateDots = function() {
        self.resizedNotifier.valueHasMutated();
    };

	self.fetchData = function (url) {
		return new Promise((resolve, reject) => {
			$.ajax({
				type: 'GET',
				url: url,
				dataType: 'json',
				mimeType: 'application/json',
				success: function (data) {
					resolve(data);
				},
				error: function (error) {
					reject(error);
				}
			});
		});
	};

	self.LoadData = function (map) {
		self.fetchData(map.Data)
			.then((data) => {
				self._foundData = new FoundNotesData(map.LocalStorageId);
				let notes = [];
				for (let index = 0; index < data['notes'].length; index++) {
					const element = data['notes'][index];
					notes.push(new NoteItem(self, element, self._foundData.GetFound(NOTE_TYPES.NOTE, index), NOTE_TYPES.NOTE, index));
				}
				for (let index = 0; index < data['dossiers'].length; index++) {
					const element = data['dossiers'][index];
					notes.push(new NoteItem(self, element, self._foundData.GetFound(NOTE_TYPES.DOSSIER, index), NOTE_TYPES.DOSSIER, index));
				}
				for (let index = 0; index < data['glitches'].length; index++) {
					const element = data['glitches'][index];
					notes.push(new NoteItem(self, element, self._foundData.GetFound(NOTE_TYPES.GLITCH, index), NOTE_TYPES.GLITCH, index));
				}

				self.TypeCounts = {};
				self.TypeCounts['type' + NOTE_TYPES.NOTE] = data['notes'].length;
				self.TypeCounts['type' + NOTE_TYPES.DOSSIER] = data['dossiers'].length;
				self.TypeCounts['type' + NOTE_TYPES.GLITCH] = data['glitches'].length;

				self.notes(notes);

				let locations = [];
				locations.push(new KnownLocation("Center of map", 50.0, 50.0));
				for (let index = 0; index < data['obelisks'].length; index++) {
					const element = data['obelisks'][index];

					locations.push(new KnownLocation(element.name, element.lat, element.lon));
				}
				for (let index = 0; index < data['artifacts'].length; index++) {
					const element = data['artifacts'][index];

					locations.push(new KnownLocation(element.name, element.lat, element.lon));
				}
				for (let index = 0; index < data['cave-entrances'].length; index++) {
					const element = data['cave-entrances'][index];

					if (element.name)
						locations.push(new KnownLocation(element.name, element.lat, element.lon));
				}
				self.KnownLocations(locations);
				self._updateCounts();
				self.dataReady(true);
			
                window.setTimeout(function(){
                    self.UpdateCoordinateDots();
                }, 500);
			})
			.catch((errors) => {

				let error = '';

				for (let index = 0; index < errors.length; index++) {
					const element = errors[index];
					error += element;
				}

				self.messages(error);
				$('#messages').attr("class", "alert alert-danger");
			});
	};

	self.deleteData = function () {
		self._foundData.DeleteAll();
		location.reload();
	};

	self.Init = function () {
        self.fetchData('data/maps.json')
        .then((maps) => {
            
            let selectedMaps = [];
            
            for(let i = 0; i < maps.length; i ++) {
                let item = maps[i];
                
                if(!item.Hidden)
                    selectedMaps.push(item);
            }
        
            self.maps = selectedMaps;
            self.selectedMap(self.maps[0]);
            ko.applyBindings(self);
            //self.LoadData(self.selectedMap());
            window.addEventListener('resize', function(){
                self.UpdateCoordinateDots();
            });
        });
	};
}

function KnownLocation(text, lat, lon) {
	let self = this;
	self.Text = text;
	self.lat = lat;
	self.lon = lon;
}

function NoteItem(parent, data, found, type, index) {
	let self = this;
	self._inner = data;
	self._index = index;
	self._parent = parent;
	self.Lat = function () { return self._inner.lat; };
	self.Lon = function () { return self._inner.lon; };
	self.Coordinates = 'lat: ' + self._inner.lat + ', lon: ' + self._inner.lon;
	self.CompassDirection = ko.computed(function () {
		let result = '';
		let myLat = parent.MyLat();
		let myLon = parent.MyLon();
		let threshold = 0.2;
		result += Math.abs(self._inner.lat - myLat) < threshold ? '' : (self._inner.lat < myLat) ? 'N' : 'S';
		result += Math.abs(self._inner.lon - myLon) < threshold ? '' : (self._inner.lon > myLon) ? 'E' : 'W';
		if (result.length === 0)
			return 'X';
		return result;
	}, self);
	self.Found = ko.observable(found);
	self.Found.subscribe(function (newValue) {
		parent.OnItemFound(self);
	});
	self.DistanceValue = function () {
		let a = Math.abs(self._inner.lat - parent.MyLat());
		let b = Math.abs(self._inner.lon - parent.MyLon());
		let c = Math.pow(a, 2) + Math.pow(b, 2);
		return Math.sqrt(c);
	};
	self.Distance = ko.computed(function () {
        ko.unwrap(parent.MyLat());
        ko.unwrap(parent.MyLon())
		return '~' + Math.round(self.DistanceValue()) + ' units';
	}, self);
	self._type = type;
	self.Name = ko.computed(function () {
		let result = self._inner.name;
		if (self._inner.author)
			result = self._inner.author + ' ' + result;
		if (self._type === NOTE_TYPES.DOSSIER)
			result = 'Dossier: ' + result;
		return result;
	}, self);
	self.CaveText = ko.computed(function () {
		if (self._inner['in-cave'])
			return ' (' + self._inner['in-cave'] + ')';
		return '';
	}, self);
	self.IsHidden = ko.computed(function () {
		return (self.Found() && self._parent.HideFound())
			|| (self._type == NOTE_TYPES.GLITCH && !self._parent.ShowGlitches())
        	|| (self._type == NOTE_TYPES.DOSSIER && !self._parent.ShowDossiers())
        	|| (self._type == NOTE_TYPES.NOTE && !self._parent.ShowNotes());
	}, self);
}

function EmptyFoundNotesData() {
	let self = this;
	self.FoundCount = function (types) { return 0; };
	self.GetFound = function (type, key) { return false; };
	self.SetFound = function (type, key, value) { throw 'Unsupported'; };
	self.DeleteAll = function () { throw 'Unsupported'; };
}

function FoundNotesData(storeId) {
	let self = this;

	let data = localStorage.getItem(storeId);

	if (data) {
		self._inner = JSON.parse(data);

		if (!self._inner['version'])
			self._inner['version'] = 0;

		if (self._inner['version'] < 1) {
			self._inner['type' + NOTE_TYPES.GLITCH] = {};
			self._inner['version'] = 1;
		}
	}
	else {
		self._inner = {};
		self._inner['version'] = 1;
		self._inner['type' + NOTE_TYPES.NOTE] = {};
		self._inner['type' + NOTE_TYPES.DOSSIER] = {};
		self._inner['type' + NOTE_TYPES.GLITCH] = {};
	}

	self.FoundCount = function (types) {
		let result = 0;

		for (let index = 0; index < types.length; index++) {
			const noteType = types[index];

			if (!self._inner['type' + noteType])
				continue;

			result += Object.keys(self._inner['type' + noteType]).length;
		}

		return result;
	};

	self.GetFound = function (type, key) {
		let hive = self._inner['type' + type];
		let value = hive['key' + key];
		if (value)
			return value;
		return false;
	}

	self.SetFound = function (type, key, value) {
		let hive = self._inner['type' + type];
		if (value)
			hive['key' + key] = value;
		else
			delete hive['key' + key];
		let storeJson = JSON.stringify(self._inner);
		localStorage.setItem(storeId, storeJson);
	}

	self.DeleteAll = function () { localStorage.removeItem(storeId); };
}

let vm = new ViewModel();
vm.Init();