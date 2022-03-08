var NOTE_TYPES = {
	NOTE: 0,
	DOSSIER: 1
};

function ViewModel()
{
    var self = this;    
    self.dataReady = ko.observable(false);
    self.messages = ko.observable('Fetching...');
	self.notes = ko.observableArray([]);
	self._foundData = new FoundNotesData();
	self.ToggleFound = function(item) {
		var newValue = !item.Found();
		item.Found(newValue);
		self._foundData.SetFound(item._type, item._index, newValue);
	};
    
    self.Init = function ()
    {
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
						notes.push(new NoteItem(element, self._foundData.GetFound(NOTE_TYPES.NOTE, index), NOTE_TYPES.NOTE, index));
					}
					for (let index = 0; index < data['dossiers'].length; index++) {
						const element = data['dossiers'][index];
						notes.push(new NoteItem(element, self._foundData.GetFound(NOTE_TYPES.DOSSIER, index), NOTE_TYPES.DOSSIER, index));
					}

					self.notes(notes);
					self.dataReady(true);
				},
				error: function(jqXHR, textStatus, errorThrown) {
					self.messages(errorThrown);
					$('#messages').attr("class","alert alert-danger");
					// TODO : Text not displaying correctly
					$('#track-info').html("Error: " + errorThrown);
				}
			});
	
    };
}

function NoteItem(data, found, type, index) {
	let self = this;
	self._inner = data;
	self._index = index;
	self.Coordinates = 'lon: ' + self._inner.lon + '; lat: ' + self._inner.lat;
	self.Found = ko.observable(found);
	self._type = type;
	self.Name = ko.computed(function() {
		let result = self._inner.name;
		if(self._inner.author)
			result = self._inner.author + ' ' + result;
		if(self._type === NOTE_TYPES.DOSSIER)
			result = 'Dossier: ' + result;
		return result;
	}, self);
	self.CaveText = ko.computed(function() {
		if(self._inner['in-cave'])
			return self._inner['in-cave'];
		return '';
	}, self);
}

function FoundNotesData() {
	let self = this;

	let data = localStorage.getItem('foundNotes');

	if(data)
	{
		self._inner = JSON.parse(data);
	}
	else
	{
		self._inner = { };
		self._inner['type' + NOTE_TYPES.NOTE] = { };
		self._inner['type' + NOTE_TYPES.DOSSIER] = { };
	}

	self.GetFound = function(type, key) {
		let hive = self._inner['type' + type];
		let value = hive['key' + key];
		if(value)
			return value;
		return false;
	}

	self.SetFound = function(type, key, value) {
		let hive = self._inner['type' + type];
		if(value)
			hive['key' + key] = value;
		else
			delete hive['key' + key];
		var storeJson = JSON.stringify(self._inner);
		localStorage.setItem('foundNotes', storeJson);
	}
}

var vm = new ViewModel();
vm.Init();