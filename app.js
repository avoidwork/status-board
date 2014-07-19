var TurtleIO = require( "turtle.io" ),
    keigai   = require( "keigai" ),
    filesize  = require("filesize" ),
    os       = require( "os" ),
    config   = require( "./config.json" ),
    app      = new TurtleIO(),
    array    = keigai.util.array,
    csv      = keigai.util.json.csv
    stats    = [];

function chart () {
	return stats.reverse();
}

function table () {
	return array.last( stats, 10 ).reverse();
}

function stat () {
	stats.push( {
		uptime : os.uptime(),
		cpu    : os.loadavg()[0].toFixed( 2 ),
		memory : filesize( os.totalmem() - os.freemem() )
	} );

	if ( stats.length > 100 ) {
		stats = array.limit( stats, 100 );
	}
}

app.get( "/chart.csv", function ( req, res ) {
	app.respond( req, res, csv( chart() ), 200, {"content-type": "text/csv"} );
} );

app.get( "/chart.json", function ( req, res ) {
	app.respond( req, res, chart() );
} );

app.get( "/table.csv", function ( req, res ) {
	app.respond( req, res, csv( table() ), 200, {"content-type": "text/csv"} );
} );

app.get( "/table.json", function ( req, res ) {
	app.respond( req, res, table() );
} );

app.start( config );

setInterval( stat, 1000 );
