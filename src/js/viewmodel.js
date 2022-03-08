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
						notes.push(new NoteItem(element, false, NOTE_TYPES.NOTE));
					}
					for (let index = 0; index < data['dossiers'].length; index++) {
						const element = data['dossiers'][index];
						notes.push(new NoteItem(element, false, NOTE_TYPES.DOSSIER));
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

function NoteItem(data, found, type) {
	let self = this;
	self._inner = data;
	self.Coordinates = 'lon: ' + self._inner.lon + '; lat: ' + self._inner.lat
	self.Found = ko.observable(found);
	self._type = type;
	self.ToggleFound = function() {
		self.Found(!self.Found());
	};
	self.Name = ko.computed(function() {
		let result = self._inner.name;
		if(self._inner.author)
			result = self._inner.author + ' ' + result;
		if(self._type === NOTE_TYPES.DOSSIER)
			result = 'Dossier: ' + result;
		if(!self.Found())
			result = result + ' (' + self.Coordinates + ')';
		return result;
	}, self);
}
var vm = new ViewModel();
vm.Init();