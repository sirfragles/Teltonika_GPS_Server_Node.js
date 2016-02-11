# Teltonika_GPS_Server_Node.js
Simple GPS server for Teltonika's FMXXXX GPS device in Node.js

## INSTALL

* Create database in mysql
* Run GPS_DATA.sql script
* Insert IMEI in IMEI_ALLOW table and set allow to 1
* Configure a connection in gps.js
```javascript
var db_config = {
    host: '',
    user: '',
    password: '',
    database: '',
    insecureAuth: true
};
```
* Run nodejs gps.js
