var express = require('express');                //Modulo express (framework de NodeJS)
var app = express();
var http = require('http')                       //Modulo http para el servidor.
var fs = require('fs');                          //Modulo para acceder los archivos del sistema.
var request = require('request')                 // Modulo para descargar archivos.
var path = require('path');
var url = require('url');
var server = require('http').Server(app);
var io = require('socket.io')(server);
var progress = require('request-progress');
var childProcess = require('child_process');

childProcess.exec('start "" "C:/Program Files (x86)/Google/Chrome/Application/chrome" -kiosk -incognito -fullscreen http://localhost:8080');

app.use(express.static(__dirname + '/Public'));

io.on('connection', function(socket) {

  console.log("Alguien se ha conectado con Sockets");

});

app.get('/', function (req, res) {

    res.sendFile(path.join(__dirname, '/Public/index.html'));

});

app.get('/PlayList.json', function (req, res) {

    fs.stat(path.join(__dirname, '/Public/PlayList.json'), function (err, stat) {

        if (err == null) {
            console.log("Ya se ha descargado el archivo PlayList.json");
            fs.readFile(path.join(__dirname, '/Public/PlayList.json'), (err, data) => {
                if (err) throw err;
                var SetList = JSON.parse(data);
                console.log(SetList);
                console.log("Se imprimio el SetList");
                res.send(SetList);

            });
        } else {
            var file = fs.createWriteStream(path.join(__dirname, '/Public/PlayList.json'));
            http.get("http://cdn.tekus.co/Media/PlayList.json", function (res) {
                res.pipe(file);
            });
        }
    });

});

app.get('/Download/:number', function (req, res) {

    fs.readFile(path.join(__dirname, '/Public/PlayList.json'), (err, data) => {
        if (err) throw err;
        var SetList = JSON.parse(data);
        console.log(SetList);

        console.log("Descargando el item #" + (req.params.number).toString());
        download("http://cdn.tekus.co/Media/" + SetList[req.params.number].Name, SetList[req.params.number].Name, function (response) {
            console.log('Elemento # ' + (req.params.number).toString() + ' decargado.');
            res.end();
        });


    });
});

app.get('/Check/:number', function (req, res) {


    fs.readFile(path.join(__dirname, '/Public/PlayList.json'), (err, data) => {
        if (err) throw err;
        var SetList = JSON.parse(data);
        console.log(SetList);

        fs.open(path.join(__dirname, '/Public/Media/' + SetList[req.params.number].Name) , 'r', (err, fd) => {
            if (err) {
                if (err.code === 'ENOENT') {

                    console.log('Elemento # ' + (req.params.number).toString() + ' no estaba decargado.');
                    res.writeHead(404);
                    res.end();

                }
            } else {

                console.log('Elemento # ' + (req.params.number).toString() + ' ya estaba decargado.');
                res.writeHead(200);
                res.end();

            }
        });
    });
});

var download = function (uri, filename, callback) {
    request.head(uri, function (err, res, body) {
        console.log('content-type:', res.headers['content-type']);
        console.log('content-length:', res.headers['content-length']);

        progress(request(uri)).on('progress', function (state) {

              console.log('progress', state.percent);
              io.sockets.emit('percentage', (state.percent*100));

        }).pipe(fs.createWriteStream(path.join(__dirname, '/Public/Media/' + filename))).on('close', callback);

    });
};


server.listen(8080, function() {
  console.log("Servidor corriendo en http://localhost:8080");
});
