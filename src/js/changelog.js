
function ViewModel() {
	let self = this;
	self.dataReady = ko.observable(false);
	self.messages = ko.observable('Fetching...');
	
	self.fetchPage = function (url) {
		return new Promise((resolve, reject) => {
			$.ajax({
				type: 'GET',
				url: url,
				dataType: 'text',
				mimeType: 'text/plain',
				success: function (data) {
					resolve(data);
				},
				error: function (error) {
					reject(error);
				}
			});
		});
	};
    
	self.Init = function () {
        ko.applyBindings(self);

        self.fetchPage('changelog.md')
            .then((text) => {
                let converter = new showdown.Converter();
                let html = converter.makeHtml(text);
                $('#contentContainer').html(html);
                self.dataReady(true);
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
}

let vm = new ViewModel();
vm.Init();