#!/bin/sh

sshpass -p $SFTPPASS -v sftp -v -oStrictHostKeyChecking=no $SFTPUSRN@$SFTPADDR << !
cd $SFTPDEST
put src/data.json
put src/se-data.json
put src/ab-data.json
put src/index.html
cd $SFTPDEST/img
put src/img/scorched_earth.jpg
put src/img/the_island.jpeg
put src/img/aberration.png
cd $SFTPDEST/css
put src/css/bootstrap-grid.css
put src/css/bootstrap-grid.css.map
put src/css/bootstrap-grid.min.css
put src/css/bootstrap-grid.min.css.map
put src/css/bootstrap-reboot.css
put src/css/bootstrap-reboot.css.map
put src/css/bootstrap-reboot.min.css
put src/css/bootstrap-reboot.min.css.map
put src/css/bootstrap.css
put src/css/bootstrap.css.map
put src/css/bootstrap.min.css
put src/css/bootstrap.min.css.map
put src/css/custom.css
cd $SFTPDEST/css/themes/default
put src/css/themes/default/32px.png
put src/css/themes/default/40px.png
put src/css/themes/default/style.css
put src/css/themes/default/style.min.css
put src/css/themes/default/throbber.gif
cd $SFTPDEST/css/themes/default-dark
put src/css/themes/default-dark/32px.png
put src/css/themes/default-dark/40px.png
put src/css/themes/default-dark/style.css
put src/css/themes/default-dark/style.min.css
put src/css/themes/default-dark/throbber.gif
cd $SFTPDEST/js
put src/js/bootstrap.bundle.js
put src/js/bootstrap.bundle.js.map
put src/js/bootstrap.bundle.min.js
put src/js/bootstrap.bundle.min.js.map
put src/js/bootstrap.js
put src/js/bootstrap.js.map
put src/js/bootstrap.min.js
put src/js/bootstrap.min.js.map
put src/js/jquery-3.4.1.min.js
put src/js/jstree.js
put src/js/jstree.min.js
put src/js/knockout-3.5.0.js
put src/js/popper.min.js
put src/js/viewmodel.js
bye
!