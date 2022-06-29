#!/bin/sh

sshpass -p $SFTPPASS -v sftp -v -oStrictHostKeyChecking=no $SFTPUSRN@$SFTPADDR << !
cd $SFTPDEST
put src/index.html
put src/changelog.html
put src/changelog.md
put -R src/css/
put -R src/data/
put -R src/img/
put -R src/js/
put -R src/lib/
bye
!