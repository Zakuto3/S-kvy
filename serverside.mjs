var express = require('express');
var bodyParser = require('body-parser');
var pg = require('pg');
var app = express();

var DBobj = require('./DBinfo');

//import DBobj from './DBinfo';


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


app.get('/geoportia', function (req, res) {
    var pool = new pg.Pool(DBobj.config_geoportia);
    pool.connect(function (err, client, done)
    {
        if (err)
        {
            return console.error('error fetching client from pool', err);
        }
        client.query('SELECT name, public_title, postgis_view_where_condition, postgis_table_name FROM layer_specification ORDER BY name', function (err, result) 
		{
            //call `done()` to release the client back to the pool
            done();
            if (err)
            {
                return console.error('error running query', err);
            }
            else
            {
                console.log("skickar nu return med result för geoporto");
                console.log(result);
                res.send(result.rows); //alla akt_bet. För första raden så .rows[0]
            }         
        });
    });
    pool.on('error', function (err, client) {
        console.error('idle client error', err.message, err.stack)
    })
});

app.get('/eskilstuna/:tabell', function (req, res) {
    var pool = new pg.Pool(DBobj.config_eskilstuna);
    pool.connect(function (err, client, done) 
	{
        if (err) 
		{
            return console.error('error fetching client from pool', err);
        }
        console.log(req.params.tabell);
        var str = req.params.tabell; // Finns en OBJECTID för vissa lager, ex ÖP. filtreras även bort?
        //Hämtar kolumnnamn via information_schema.columns, minus geom och geodb_oid. De hämtas aldrig ens till applikationen så behöver inte filtreras bort senare.
        client.query("SELECT column_name FROM information_schema.columns WHERE table_Schema = 'public' AND column_name <> 'geom' AND column_name <> 'geodb_oid' AND table_name = '" + str + "'", function (err, result) 
		{  //Strängen behöver vara inom ' ', annars blir den tydligen gemen.
            done();

            if (err) 
			{
                return console.error('error running query', err);
            } 
			else 
			{
                console.log("skickar nu return med result för eskilstuna");
                console.log(result.rows);
                res.send(result.rows); //alla akt_bet. För första raden så .rows[0]
            }
            
        });
    });
    pool.on('error', function (err, client) {
        console.error('idle client error', err.message, err.stack)
    })
});


app.post('/sovy_testo', function (req, res){
	var pool = new pg.Pool(DBobj.config_eskilstuna);
    pool.connect(function (err, client, done) 
	{
        if (err) 
		{
            return console.error('error fetching client from pool', err);
        }
		client.query(req.body.query, function (err, result) 
		{ 
            done();
			if (err) 
			{
				res.send(err);
                return console.error('error running query', err);
            }
			else
			{
				res.send();
			}
		});
	});
});



app.listen(1337);



