var NOTE_TYPES = {
	NOTE: 0,
	DOSSIER: 1
};

function Compare(left, right) {
	if (left < right)
		return -1;

	if (left > right)
		return 1;

	return 0;
}

function ViewModel() {
	var self = this;
	self.dataReady = ko.observable(false);
	self.messages = ko.observable('Fetching...');
	self.notes = ko.observableArray([]);
	self._foundData = new FoundNotesData();
	self.SaveValue = function (item) {
		var newValue = item.Found();
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
	};
	self.KnownLocations = ko.observableArray([]);
	self.SelectedLocation = ko.observable();
	self.SelectedLocation.subscribe(function (newValue) {
		if (newValue) {
			self.SetMyCoodinates(newValue.lat, newValue.lon);
			self.SelectedLocation(null);
		}
	});
	self.HideFound = ko.observable(true);
	self.UpdateMyCoordinates = ko.observable(true);
	self.SortByDistance = ko.observable(true);
	self.MyLon = ko.observable(50.0);
	self.MyLat = ko.observable(50.0);
	self.sortedNotes = ko.computed(function () {
		var notes = self.notes();

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

	self.Init = function () {
		ko.applyBindings(self);
		$.ajax({
			type: 'GET',
			url: 'data.json',
			dataType: 'json',
			mimeType: 'application/json',
			success: function (data) {
				let notes = [];
				for (let index = 0; index < data['notes'].length; index++) {
					const element = data['notes'][index];
					notes.push(new NoteItem(self, element, self._foundData.GetFound(NOTE_TYPES.NOTE, index), NOTE_TYPES.NOTE, index));
				}
				for (let index = 0; index < data['dossiers'].length; index++) {
					const element = data['dossiers'][index];
					notes.push(new NoteItem(self, element, self._foundData.GetFound(NOTE_TYPES.DOSSIER, index), NOTE_TYPES.DOSSIER, index));
				}

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

					if(element.name)
						locations.push(new KnownLocation(element.name, element.lat, element.lon));
				}
				self.KnownLocations(locations);
				self.dataReady(true);
			},
			error: function (jqXHR, textStatus, errorThrown) {
				self.messages(errorThrown);
				$('#messages').attr("class", "alert alert-danger");
				// TODO : Text not displaying correctly
				$('#track-info').html("Error: " + errorThrown);
			}
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
	self.DistanceValue = ko.computed(function () {
		let a = Math.abs(self._inner.lat - parent.MyLat());
		let b = Math.abs(self._inner.lon - parent.MyLon());
		let c = Math.pow(a, 2) + Math.pow(b, 2);
		return Math.sqrt(c);
	}, self);
	self.Distance = ko.computed(function () {
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
		return self.Found() && self._parent.HideFound();
	}, self);
}

function FoundNotesData() {
	let self = this;

	let data = localStorage.getItem('foundNotes');

	if (data) {
		self._inner = JSON.parse(data);
	}
	else {
		self._inner = {};
		self._inner['type' + NOTE_TYPES.NOTE] = {};
		self._inner['type' + NOTE_TYPES.DOSSIER] = {};
	}

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
		var storeJson = JSON.stringify(self._inner);
		localStorage.setItem('foundNotes', storeJson);
	}
}

var vm = new ViewModel();
vm.Init();