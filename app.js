"use strict";

var TurtleIO = require( "turtle.io" ),
    keigai   = require( "keigai" ),
    moment   = require( "moment" ),
    os       = require( "os" ),
    config   = require( "./config.json" ),
    app      = new TurtleIO(),
    root     = __dirname + "/www",
    array    = keigai.util.array,
    csv      = keigai.util.csv.encode,
    merge    = keigai.util.merge,
    stats    = {cpu: {csv: [], json: []}, memory: {csv: [], json:[]}, summary: {csv: []}},
    CHART    = 1800,
    TABLE    = 10,
    GB       = Math.pow( 2, 30 );

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

	if ( title = "Memory" && obj.graph.datasequences[0] && obj.graph.datasequences[0].datapoints[0] && obj.graph.datasequences[1] && obj.graph.datasequences[1].datapoints[1] ) {
		obj.graph.yAxis.minValue = 0;
		obj.graph.yAxis.maxValue = Math.ceil( parseFloat( obj.graph.datasequences[0].datapoints[0].value ) + parseFloat( obj.graph.datasequences[1].datapoints[1].value ) );
	}

	return obj;
}

function stat () {
	var cpu  = os.loadavg(),
		time = moment().format( config.time ),
		free = ( os.freemem() / GB ).toFixed( 2 ),
		used = ( ( os.totalmem() - os.freemem() ) / GB ).toFixed( 2 );

	cpu[0] = cpu[0].toFixed( 2 );
	cpu[1] = cpu[1].toFixed( 2 );
	cpu[2] = cpu[2].toFixed( 2 );

	stats.cpu.csv.push( {
		time     : time,
		"1 min"  : cpu[0] + " %",
		"5 min"  : cpu[1] + " %",
		"15 min" : cpu[2] + " %"
	} );

	stats.cpu.json.push( {
		time     : time,
		"1 min"  : cpu[0],
		"5 min"  : cpu[1],
		"15 min" : cpu[2]
	} );

	stats.memory.csv.push( {
		time : time,
		used : used + " GB",
		free : free + " GB"
	} );

	stats.memory.json.push( {
		time : time,
		used : used,
		free : free
	} );

	stats.summary.csv.push( {
		time   : time,
		cpu    : cpu[0] + " %",
		memory : used + " GB"
	} );

	if ( stats.summary.csv.length > TABLE ) {
		stats.cpu.csv     = array.last( stats.cpu.csv,     TABLE );
		stats.memory.csv  = array.last( stats.memory.csv,  TABLE );
		stats.summary.csv = array.last( stats.summary.csv, TABLE );
	}

	if ( stats.cpu.json.length > CHART ) {
		stats.cpu.json    = array.last( stats.cpu.json,    CHART );
		stats.memory.json = array.last( stats.memory.json, CHART );
	}
}

app.get( "/cpu.csv", function ( req, res ) {
	app.respond( req, res, csv( stats.cpu.csv.reverse() ), 200, {"cache-control": "no-cache", "content-type": "text/csv"} );
} );

app.get( "/cpu.json", function ( req, res ) {
	app.respond( req, res, transform( "CPU Load", "%", stats.cpu.json ), 200, {"cache-control": "no-cache"} );
} );

app.get( "/memory.csv", function ( req, res ) {
	app.respond( req, res, csv( stats.memory.csv.reverse() ), 200, {"cache-control": "no-cache", "content-type": "text/csv"} );
} );

app.get( "/memory.json", function ( req, res ) {
	app.respond( req, res, transform( "Memory", "GB", stats.memory.json ), 200, {"cache-control": "no-cache"} );
} );

app.get( "/summary.csv", function ( req, res ) {
	app.respond( req, res, csv( stats.summary.csv.reverse() ), 200, {"cache-control": "no-cache", "content-type": "text/csv"} );
} );

config.root = root;
app.start( config );

setInterval( stat, 1000 );
