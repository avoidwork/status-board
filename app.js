var TurtleIO = require( "turtle.io" ),
    keigai   = require( "keigai" ),
    moment   = require( "moment" ),
    os       = require( "os" ),
    config   = require( "./config.json" ),
    app      = new TurtleIO(),
    array    = keigai.util.array,
    csv      = keigai.util.json.csv,
    merge    = keigai.util.merge,
    stats    = [],
    HOUR     = 3600,
    GB       = Math.pow( 2, 30 );

function cpu () {
	return array.keySort( stats.map( function ( i ) {
		return merge( {"time": i.time}, i.cpu );
	} ), "time asc" );
}

function memory () {
	return array.keySort( stats.map( function ( i ) {
		return merge( {"time": i.time}, i.memory );
	} ), "time asc" );
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

	if ( title = "Memory" ) {
		obj.graph.yAxis.minValue = 0;
		obj.graph.yAxis.maxValue = Math.ceil( parseFloat( obj.graph.datasequences[0].datapoints[0].value ) + parseFloat( obj.graph.datasequences[1].datapoints[1].value ) );
	}

	return obj;
}

function stat () {
	var cpu = os.loadavg();

	stats.push( {
		time   : moment().format( config.time ),
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

	if ( stats.length > HOUR ) {
		stats = array.last( stats, HOUR );
	}
}

app.get( "/cpu.csv", function ( req, res ) {
	app.respond( req, res, csv( array.last( cpu(), 10 ).map( function ( i ) {
		var obj = i;

		obj["1 min"] += " %";
		obj["5 min"] += " %";
		obj["15 min"] += " %";

		return obj;
	} ) ).reverse(), 200, {"cache-control": "no-cache", "content-type": "text/csv"} );
} );

app.get( "/cpu.json", function ( req, res ) {
	app.respond( req, res, transform( "CPU Load", "%", cpu() ), 200, {"cache-control": "no-cache"} );
} );

app.get( "/memory.csv", function ( req, res ) {
	app.respond( req, res, csv( array.last( memory(), 10 ).map( function ( i ) {
		var obj = i;

		obj.used += " GB";
		obj.free += " GB";

		return obj;
	} ) ).reverse(), 200, {"cache-control": "no-cache", "content-type": "text/csv"} );
} );

app.get( "/memory.json", function ( req, res ) {
	app.respond( req, res, transform( "Memory", "GB", memory() ), 200, {"cache-control": "no-cache"} );
} );

app.get( "/summary.csv", function ( req, res ) {
	app.respond( req, res, csv( array.last( stats, 10 ).reverse().map( function ( i ) {
		return {
			time   : i.time,
			cpu    : i.cpu["1 min"] + " %",
			memory : i.memory.used + " GB"
		};
	} ) ), 200, {"cache-control": "no-cache", "content-type": "text/csv"} );
} );

app.start( config );

setInterval( stat, 1000 );
