var TurtleIO = require( "turtle.io" ),
    keigai   = require( "keigai" ),
    moment   = require( "moment" ),
    os       = require( "os" ),
    config   = require( "./config.json" ),
    app      = new TurtleIO(),
    root     = __dirname + "/www",
    array    = keigai.util.array,
    csv      = keigai.util.json.csv,
    merge    = keigai.util.merge,
    stats    = [],
    CHART    = 1800,
    TABLE    = 10,
    GB       = Math.pow( 2, 30 );

function prepare ( key ) {
	return array.keySort( stats.map( function ( i ) {
		return merge( {"time": i.time, "unix": i.unix}, i[key] );
	} ), "unix" ).map( function ( i ) {
		var obj = i;

		delete obj.unix;

		return obj;
	} );
}

function transform ( title, unit, data ) {
	var keys      = data.length > 0 ? array.keys( data[0] ) : [],
	    sequences = [],
	    obj;

	array.remove( keys, "time" );

	array.each( keys, function ( k, kdx ) {
		sequences.push( {
			title      : k,
			color      : config.colors[kdx],
			datapoints : data.map( function ( i ) {
				return {
					title : i.time,
					value : i[k]
				};
			} )
		} );
	} );

	obj = {
		graph : {
			title                : title,
			total                : false,
			type                 : "line",
			yAxis                : {units: {suffix: unit}},
			refreshEveryNSeconds : config.refresh,
			datasequences        : sequences
		}
	};

	if ( title = "Memory" && obj.graph.datasequences[0] && obj.graph.datasequences[1] ) {
		obj.graph.yAxis.minValue = 0;
		obj.graph.yAxis.maxValue = Math.ceil( parseFloat( obj.graph.datasequences[0].datapoints[0].value ) + parseFloat( obj.graph.datasequences[1].datapoints[1].value ) );
	}

	return obj;
}

function stat () {
	var cpu = os.loadavg(),
		time = moment().format( config.time );

	stats.push( {
		time   : moment().format( config.time ),
		unix   : new Date().getTime(),
		cpu    : {
			"1 min"  : cpu[0].toFixed( 2 ),
			"5 min"  : cpu[1].toFixed( 2 ),
			"15 min" : cpu[2].toFixed( 2 )
		},
		memory : {
			used : ( ( os.totalmem() - os.freemem() ) / GB ).toFixed( 2 ),
			free : ( os.freemem() / GB ).toFixed( 2 )
		}
	} );

	if ( stats.length > CHART ) {
		stats = array.last( stats, CHART );
	}
}

app.get( "/cpu.csv", function ( req, res ) {
	app.respond( req, res, csv( array.last( prepare( "cpu" ), TABLE ).map( function ( i ) {
		var obj = i;

		obj["1 min"] += " %";
		obj["5 min"] += " %";
		obj["15 min"] += " %";

		return obj;
	} ).reverse() ), 200, {"cache-control": "no-cache", "content-type": "text/csv"} );
} );

app.get( "/cpu.json", function ( req, res ) {
	app.respond( req, res, transform( "CPU Load", "%", prepare( "cpu" ) ), 200, {"cache-control": "no-cache"} );
} );

app.get( "/memory.csv", function ( req, res ) {
	app.respond( req, res, csv( array.last( prepare( "memory" ), TABLE ).map( function ( i ) {
		var obj = i;

		obj.used += " GB";
		obj.free += " GB";

		return obj;
	} ).reverse() ), 200, {"cache-control": "no-cache", "content-type": "text/csv"} );
} );

app.get( "/memory.json", function ( req, res ) {
	app.respond( req, res, transform( "Memory", "GB", prepare( "memory" ) ), 200, {"cache-control": "no-cache"} );
} );

app.get( "/summary.csv", function ( req, res ) {
	app.respond( req, res, csv( array.last( stats, TABLE ).reverse().map( function ( i ) {
		return {
			time   : i.time,
			cpu    : i.cpu["1 min"] + " %",
			memory : i.memory.used + " GB"
		};
	} ) ), 200, {"cache-control": "no-cache", "content-type": "text/csv"} );
} );

config.root = root;
app.start( config );

setInterval( stat, 1000 );
