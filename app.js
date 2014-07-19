var TurtleIO = require( "turtle.io" ),
    keigai   = require( "keigai" ),
    filesize = require("filesize" ),
    moment   = require( "moment" ),
    os       = require( "os" ),
    config   = require( "./config.json" ),
    app      = new TurtleIO(),
    array    = keigai.util.array,
    csv      = keigai.util.json.csv,
    merge    = keigai.util.merge,
    stats    = [];

function cpu () {
	return array.keySort( stats.map( function ( i ) {
		return merge( {"cpu": i.time}, i.cpu );
	} ), "cpu asc" );
}

function memory () {
	return array.keySort( stats.map( function ( i ) {
		return merge( {"memory": i.time}, i.memory );
	} ), "memory asc" );
}

function table () {
	return array.last( stats, 10 ).reverse().map( function ( i ) {
		return {
			cpu    : i.cpu["1 min"],
			memory : filesize( i.memory.used, {base: 2} )
		};
	} );
}

function transform ( title, data ) {
	var sequences = [];

	return {
		"graph"         : title,
		"total"         : true,
		"type"          : "line",
		"datasequences" : sequences
	}
}

function stat () {
	var cpu = os.loadavg();

	stats.push( {
		time   : moment().format( "h:mm:ss" ),
		cpu    : {
			"1 min"  : cpu[0].toFixed( 2 ),
			"5 min"  : cpu[1].toFixed( 2 ),
			"15 min" : cpu[2].toFixed( 2 )
		},
		memory : {
			used : os.totalmem() - os.freemem(),
			free : os.freemem()
		}
	} );

	// Holding an hour of stats
	if ( stats.length > 3600 ) {
		stats = array.limit( stats, 3600 );
	}
}

app.get( "/cpu.csv", function ( req, res ) {
	app.respond( req, res, csv( cpu() ), 200, {"content-type": "text/csv"} );
} );

app.get( "/cpu.json", function ( req, res ) {
	app.respond( req, res, transform( "CPU Load", cpu() ) );
} );

app.get( "/memory.csv", function ( req, res ) {
	app.respond( req, res, csv( memory() ), 200, {"content-type": "text/csv"} );
} );

app.get( "/memory.json", function ( req, res ) {
	app.respond( req, res, transform( "Memory", memory() ) );
} );

app.get( "/table.csv", function ( req, res ) {
	app.respond( req, res, csv( table() ), 200, {"content-type": "text/csv"} );
} );

app.get( "/table.json", function ( req, res ) {
	app.respond( req, res, transform( "Server", table() ) );
} );

app.start( config );

setInterval( stat, 1000 );
