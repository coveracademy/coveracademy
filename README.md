# Follow this instructions to install and run Cover Academy server #
## Install MySQL database version 5.6+ ##
## Configure database ##
```
$ sudo vim /etc/mysql/my.cnf
  > Change from key_buffer property to key_buffer_size
  > Change from myisam-recover to myisam-recover-options
  > Set UTF-8 and the new timestamp behavior adding these properties after [mysqld] section:
    > explicit_defaults_for_timestamp = 1
    > collation_server                = utf8_unicode_ci
    > character_set_server            = utf8
    > skip-character-set-client-handshake
```
## Set up database ##
```
$ cd coveracademy
$ mysql -u <user> -p
  > create database coveracademy character set utf8 collate utf8_general_ci;
  > exit
$ mysql -u <user> -p coveracademy < resources/schema.sql
$ mysql -u <user> -p coveracademy < resources/data.sql
```
## Install and set up Redis (Check for updates) ##
```
$ wget http://download.redis.io/releases/redis-2.8.17.tar.gz
$ tar -xvf installers/redis-2.8.17.tar.gz
$ cd redis-2.8.17
$ make; make test; sudo make install;
$ sudo utils/install_server.sh
$ sudo service redis_6379 start
```
## Install Nginx ##
```
$ sudo apt-get install nginx
```
## Configure Nginx sites availables ##
```
server {
  listen      80;
  server_name coveracademy.com;
  return      301 $scheme://www.coveracademy.com$request_uri;
}

server {
  listen      80;
  server_name ~^(?<subdomain>.+)\.coveracademy\.com$;
  return      301 $scheme://$subdomain.coveracademy.com$request_uri;
}

server {
  listen      80;
  server_name www.coveracademy.com;

  location / {
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-NginX-Proxy true;
    proxy_set_header Host $http_host;
    proxy_pass       http://127.0.0.1:4000;
    proxy_redirect   off;
  }
}

server {
  listen      80;
  server_name api.coveracademy.com;

  location / {
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-NginX-Proxy true;
    proxy_set_header Host $http_host;
    proxy_pass       http://127.0.0.1:3000;
    proxy_redirect   off;
  }
}
```
## Configure environment ##
* Edit /etc/hosts and add api.coveracademy.com pointing to localhost
* Creates a copy of config.properties located in resources/samples and change the properties according to environment
* Set the environment variable with name CONFIG_FILE referencing the absolute path of the config.properties copy (Defaults to './config.properties')
## Install Cover Academy dependencies ##
```
$ npm install
```
## Start Cover Academy server ##
```
$ npm start
```