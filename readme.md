## **Follow this instructions to install and run Closic server** ##
## Install Nodejs ##
```
$ wget https://nodejs.org/dist/v6.3.1/node-v6.3.1-linux-x64.tar.xz;
$ tar -xvf node-v6.3.1-linux-x64.tar.xz;
- Add bin folder to $PATH system variable;
```
## Install MySQL database version 5.6+ ##
## Configure database ##
```
$ sudo vim /etc/mysql/my.cnf
  > Set UTF-8 and the new timestamp behavior adding these properties inside [mysqld] section:
    > explicit_defaults_for_timestamp = 1
    > collation_server                = utf8_unicode_ci
    > character_set_server            = utf8
    > skip-character-set-client-handshake
```
## Setup database ##
```
$ cd coveracademy
$ mysql -u <user> -p
  > create schema coveracademy character set utf8 collate utf8_general_ci;
  > exit
$ mysql -u <user> -p coveracademy < resources/schema.sql
```
## Install Redis ##
```
$ wget http://download.redis.io/releases/redis-3.2.1.tar.gz;
$ tar -xvf redis-3.2.1.tar.gz;
$ cd redis-3.2.1;
$ make; make test; sudo make install;
$ sudo utils/install_server.sh;
```
## Start Redis ##
```
$ sudo service redis_6379 start;
```
## Configure the project ##
```
- Create a copy of config.properties file located in resources/samples and modify the properties according to your environment;
- Move the copy to the project folder;
```
## Install dependencies ##
```
$ npm install
```
## Start Closic server ##
```
$ npm start
```