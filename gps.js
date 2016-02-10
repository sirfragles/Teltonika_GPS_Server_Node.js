/*jslint node: true */
"use strict";

var net = require('net');
var mysql = require('mysql');
var crc = require('crc');
var fs = require('fs');
var util = require('util');

var db_config = {
    host: '',
    user: '',
    password: '',
    database: 'GPS_DATA',
    insecureAuth: true
};

var log_file = fs.createWriteStream(__dirname + '/gps.log', {flags : 'w'});

console.log = function(d) {
    var currentDate = '[' + new Date().toUTCString() + '] ';
    log_file.write(currentDate + util.format(d) + '\n');
};

var connection = mysql.createConnection(db_config);

var connectDB = connection.connect( function(error) {
    if(error) {
        console.log('Error connecting to db. Błąd podczas łączenia do bazy danych:', error);
        setTimeout(connectDB, 5000);
    } else {
        console.log('Connection established. Połączono do bazy danych.');
    }
});

connection.on('error', function(error) {
    console.log('Database error. Błąd bazy danych:', error);
    if(error.code === 'PROTOCOL_CONNECTION_LOST') {
        connectDB();
    } else {
        throw error;
    }
});

var isValidIMEI = function (IMEI, socket){
    var imei_answer = new Buffer(1);
    connection.query('SELECT count(*) as w from IMEI_ALLOW where imei=? and allow=1', [ IMEI ], function(error, rows, fields) {
        if (error) {
            console.log('Błąd w funkcji isValidIMEI '+error);
            throw error;
        }
        if (rows[0].w == 1) {
            console.log('Allow IMEI. Dozwolony IMEI: '+IMEI);
            socket.imei = IMEI;
            imei_answer[0] = 1;
            socket.write(imei_answer);
        } else {
            console.log('Disallow IMEI. Odrzucony IMEI: '+IMEI);
            imei_answer[0] = 0;
            socket.end(imei_answer);
         }
    });
};

var saveGPS = function ( timestamp, latitude, longitude, altitude, angle, sattelites, speed ) {
    connection.query('REPLACE into GPS_DATA (timestamp, latitude, longitude, altitude, angle, sattelites, speed ) values (FROM_UNIXTIME(?),?,?,?,?,?,?)', [ timestamp, latitude, longitude, altitude, angle, sattelites, speed ], function(error, rows, fields) {
        if (error) {
            console.log('Błąd w funkcji saveGPS '+error);
            throw error;
        }
    });
};

var saveIO = function ( bytes, timestamp, id, value ) {
    connection.query('REPLACE into IO_DATA_'+bytes+' (timestamp, id, value ) values (FROM_UNIXTIME(?),?,?)', [ timestamp, id, value ], function(error, rows, fields) {
        if (error) {
            console.log('Błąd w funkcji saveIO '+error);
            throw error;
        }
    });
};

var s = function (socket) {
    console.log('New connection. Nowe połączenie '+socket.remoteAddress);
    socket.imei = undefined;

    var socketOnData = function (data) {
        var processIO = function (n_bytes) {

            var io_id;
            var io_value;
            var n_byte_io = parseInt(data.slice(0,1).toString('hex'), 16);

            for (var i = 0; i < n_byte_io; i++) {
                io_id = parseInt(data.slice(1 + (i*(n_bytes+1)), 2 + (i*(n_bytes+1))).toString('hex'), 16);
                io_value = parseInt(data.slice(2 + (i*(n_bytes+1)), (2 + n_bytes) + (i*(n_bytes+1))).toString('hex'), 16);
                saveIO(n_bytes, timestamp, io_id, io_value);
            }
            data = data.slice(1 + (n_byte_io * (1 + n_bytes)));
        };

        if (socket.imei === undefined) {
            // IMEI jeszcze nie przypisany
            if (data[0] === 0 && data[1] == 15){
                // Identyfikator prawidłowy
                if (data.length == 17) {
                    // Ilość danych prawidłowa
                    isValidIMEI(data.toString().substr(2,15), socket);
                } else {
                    // Ilość danych nieprawidłowa zakończ połączenie
                    socket.end();
                }
            } else {
                // Identyfikator nieprawidłowy zakończ połączenie
                socket.end();
            }

        } else {
            // IMEI już przypisany
            //console.log("Dane z IMEI: " + socket.imei + "\n\r");
            socket.avl_data_array_length = 0;
            if (socket.avl_data_array_length === 0) {
                if (data.length > 8) {
                    //console.time("Dane AVL");
                    if (data[0] === 0 && data[1] === 0 && data[2] === 0 && data[3] === 0) {
                        // Następne 4 bajty to długość tablicy AVL DATA
                        var buf = new Buffer(4);
                        buf = data.slice(4, 8);
                        socket.avl_data_array_length = buf.readUInt32BE(0);
                        if (data.length == socket.avl_data_array_length + 12){
                            // Ilość danych prawidłowa
                            var avl_packet_crc = new Buffer(4);
                            avl_packet_crc = data.slice(-4);
                            var calc_crc = crc.crc16(data.slice(8,-4));
                            var acknowledges = new Buffer(4);
                            if (avl_packet_crc.readUInt32BE(0) == calc_crc) {
                                // CRC poprawne
                                data = data.slice(8,-4);
                                if (data[0] == 8){
                                    // Protokół w wersji 08
                                    var number_of_data = data[1];
                                    data = data.slice(2);

                                    for (var data_no = 0; data_no < number_of_data; data_no ++) {
                                        var timestamp = parseInt(data.slice(0,8).toString('hex'), 16) / 1000;
                                        var longitude = parseInt(data.slice(9,13).toString('hex'), 16);
                                        var latitude = parseInt(data.slice(13,17).toString('hex'), 16);
                                        var altitude = parseInt(data.slice(17,19).toString('hex'), 16);
                                        var angle = parseInt(data.slice(19,21).toString('hex'), 16);
                                        var sattelites = parseInt(data.slice(21,22).toString('hex'), 16);
                                        var speed = parseInt(data.slice(22,24).toString('hex'), 16);
                                        saveGPS(timestamp, latitude, longitude, altitude, angle, sattelites, speed);

                                        data = data.slice(24);

                                        var event_io_id = data.slice(0,1).toString('hex');
                                        var n_of_total_io = data.slice(1,2).toString('hex');

                                        data = data.slice(2);
                                        processIO(1);
                                        processIO(2);
                                        processIO(4);
                                        processIO(8);
                                    }

                                    if (number_of_data == data.readUInt8(0)) {
                                        var nod = new Buffer(4);
                                        nod[0] = 0;
                                        nod[1] = 0;
                                        nod[2] = 0;
                                        nod[3] = number_of_data;
                                        socket.write(nod);
                                    }


                                } else {
                                    // Nieznana wersja protokołu
                                    socket.end();
                                }


                            } else {
                                // CRC niepoprawne
                                acknowledges[0] = 0;
                                acknowledges[1] = 0;
                                acknowledges[2] = 0;
                                acknowledges[3] = 0;
                                socket.end(acknowledges);
                            }
                        } else {
                            //console.log ("Nieprawidłowa ilość danych. Odebrano: " + data.length + ", wymagane: " + socket.avl_data_array_length);
                            socket.end();
                        }
                    }
                    //console.timeEnd("Dane AVL");
                } else {
                    socket.end();
                }
            } else {

            }

        }
    };

    var socketOnClose = function(error) {
        console.log("Connection closed. Zamknięto połączenie IMEI" + ":" + socket.imei + " - " + error);
    };

    var socketOnError = function(error) {
        console.log("Error cocket IMEI. Błąd socket IMEI" + ":" + socket.imei + " - " + error);
    };

    socket.on('data', socketOnData);
    socket.on('error', socketOnError);
    socket.on('close', socketOnClose);

};

var server = net.createServer();
server.on('connection', s);
server.listen(5002);
