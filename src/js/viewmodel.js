function ViewModel()
{
    var self = this;    
    self.dataReady = ko.observable(false);
    self.messages = ko.observable('Fetching...');
	self.notes = ko.observableArray([]);
	self.dossiers = ko.observableArray([]);
    
    self.Init = function ()
    {
        ko.applyBindings(self);
		$.ajax({
				type: 'GET',
				url: 'data.json',
				dataType: 'json',
				mimeType: 'application/json',
				success: function (data) {
					self.notes(data['notes']);
					self.dossiers(data['dossiers']);
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

var vm = new ViewModel();
vm.Init();