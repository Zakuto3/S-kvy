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
        client.query('SELECT name, public_title, postgis_view_where_condition, postgis_table_name FROM layer_specification ORDER BY name', function (err, result) {
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
    pool.connect(function (err, client, done) {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        console.log(req.params.tabell);
        var str = req.params.tabell; // Finns en OBJECTID för vissa lager, ex ÖP. filtreras även bort?
        //Hämtar kolumnnamn via information_schema.columns, minus geom och geodb_oid. De hämtas aldrig ens till applikationen så behöver inte filtreras bort senare.
        client.query("SELECT column_name FROM information_schema.columns WHERE table_Schema = 'public' AND column_name <> 'geom' AND column_name <> 'geodb_oid' AND table_name = '" + str + "'", function (err, result) {  //Strängen behöver vara inom ' ', annars blir den tydligen gemen.
            done();

            if (err) {
                return console.error('error running query', err);
            } else {
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



app.post('/eskilstuna_nyvy', function (req, res) {

    var tabelln = req.body.tabellnamn;
    var sokvyn = req.body.sokvynamn;
    var where = req.body.where;
    var titel = req.body.titel;
    var sokbara = "";
    var sistaknamn = "";
    var skapasokvy_str = "CREATE OR REPLACE VIEW ";
	var finnsSokBar = false;
    skapasokvy_str += sokvyn; //sokvyn
    skapasokvy_str += " AS SELECT ";
    skapasokvy_str += '"' + tabelln + '".geom, ' + '"' + tabelln + '".geodb_oid AS sokid, ';

    //geom och oid behövs inte hämtas eftersom de inte specas i sökvyn.. 
    function process(key, value) {
        console.log("Nyckel: " + key + " : " + "värde: " + value); //stoppa i sträng
        if (key == "kolumn") 
		{
            skapasokvy_str += '"' + tabelln + '"."' + value + '"';
            sistaknamn = value;
        }
        else if (key == "title") 
		{
            if (value == "j") 
			{
				skapasokvy_str += " AS title, ";
			}
            else 
			{
                skapasokvy_str += ", "; //Kan sluta med , om COALESCE eller dylikt sokstrang-skapande kommer efter. Annat scenario är att inget blir sökbart.
            }
        }
        //Eftersom en kolumn-cell skickas åt gången måste sokdel "n" eller "j" sparas i lista som motsvarar rader, eller något
        //Se firefox-D för concat(kol1, kol2..) re coalesce för att undvika null. || är concat-operator i SQL, :: castar om, måste från en till andra till tredje ibland 

        else if(key == "sokdel")// key == "sokdel" 
        {
            if (value == "j") {
                sokbara += '"' + sistaknamn +'",'//'"'+ ",'"+"','"+", "+"',"; // en "," för separa
				finnsSokBar = true;
            }
        }
          
    };
    function traverse(o, func) {
        for (let i in o) {
            if (o[i] !== null && typeof (o[i]) == "object") {
                traverse(o[i], func);
            }
            else if (i == "kolumn" || i == "title" || i == "sokdel") {
                func.apply(this, [i, o[i]]); //http://www.w3schools.com/js/js_function_invocation.asp
            }
        }
    };
    traverse(req.body, process);
    sokbaraArray = sokbara.split(",");
    sokbaraArray.pop();	
	//sokbaraArray.pop();	
	//sokbaraArray.pop();		
	
	
	if(finnsSokBar)	{
		skapasokvy_str += " concat_ws(', '," + sokbaraArray + ")::text AS searchfield ";} 
	else{
		//replace "," with space for correct sql syntax
		skapasokvy_str = skapasokvy_str.substring(0,skapasokvy_str.length-2); 
		skapasokvy_str += " ";
		}	
		
	skapasokvy_str += "FROM " + '"' + tabelln + '";';
    console.log(skapasokvy_str);
    res.send(skapasokvy_str);
});

app.post('/sovy_testo', function (req, res){
	var pool = new pg.Pool(DBobj.config_eskilstuna);
    pool.connect(function (err, client, done) {
        if (err) 
		{
            return console.error('error fetching client from pool', err);
        }
		client.query(req.body.query, function (err, result) { 
            done();
			if (err) 
			{
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










