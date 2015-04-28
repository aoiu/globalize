define([
	"cldr",
	"./common/cache-get",
	"./common/cache-set",
	"./common/runtime-bind",
	"./common/validate/cldr",
	"./common/validate/default-locale",
	"./common/validate/parameter-presence",
	"./common/validate/parameter-type/date",
	"./common/validate/parameter-type/plain-object",
	"./common/validate/parameter-type/string",
	"./core",
	"./date/expand-pattern",
	"./date/format",
	"./date/format-properties",
	"./date/parse",
	"./date/parse-properties",
	"./date/tokenizer",
	"./date/tokenizer-properties",

	"cldr/event",
	"cldr/supplemental",
	"./number"
], function( Cldr, cacheGet, cacheSet, runtimeBind, validateCldr, validateDefaultLocale,
	validateParameterPresence, validateParameterTypeDate, validateParameterTypePlainObject,
	validateParameterTypeString, Globalize, dateExpandPattern, dateFormat, dateFormatProperties,
	dateParse, dateParseProperties, dateTokenizer, dateTokenizerProperties ) {

function validateRequiredCldr( path, value ) {
	validateCldr( path, value, {
		skip: [
			/dates\/calendars\/gregorian\/dateTimeFormats\/availableFormats/,
			/dates\/calendars\/gregorian\/days\/.*\/short/,
			/supplemental\/timeData\/(?!001)/,
			/supplemental\/weekData\/(?!001)/
		]
	});
}

var slice = [].slice;

/**
 * .dateFormatter( options )
 *
 * @options [Object] see date/expand_pattern for more info.
 *
 * Return a date formatter function (of the form below) according to the given options and the
 * default/instance locale.
 *
 * fn( value )
 *
 * @value [Date]
 *
 * Return a function that formats a date according to the given `format` and the default/instance
 * locale.
 */
Globalize.dateFormatter =
Globalize.prototype.dateFormatter = function( options ) {
	var args, cldr, numberFormatters, pad, pattern, properties, returnFn;

	validateParameterTypePlainObject( options, "options" );

	cldr = this.cldr;
	options = options || { skeleton: "yMd" };

	args = slice.call( arguments, 0 );

	validateDefaultLocale( cldr );

	if ( returnFn = cacheGet( "dateFormatter", args, cldr ) ) {
		return returnFn;
	}

	cldr.on( "get", validateRequiredCldr );
	pattern = dateExpandPattern( options, cldr );
	properties = dateFormatProperties( pattern, cldr );
	cldr.off( "get", validateRequiredCldr );

	// Create needed number formatters.
	numberFormatters = properties.numberFormatters;
	delete properties.numberFormatters;
	for ( pad in numberFormatters ) {
		numberFormatters[ pad ] = this.numberFormatter({
			raw: numberFormatters[ pad ]
		});
	}

	returnFn = function dateFormatter( value ) {
		validateParameterPresence( value, "value" );
		validateParameterTypeDate( value, "value" );
		return dateFormat( value, numberFormatters, properties );
	};

	cacheSet( args, cldr, returnFn );

	runtimeBind( args, cldr, {
		numberFormatters: numberFormatters,
		properties: properties
	}, returnFn );

	return returnFn;
};

/**
 * .dateParser( options )
 *
 * @options [Object] see date/expand_pattern for more info.
 *
 * Return a function that parses a string date according to the given `formats` and the
 * default/instance locale.
 */
Globalize.dateParser =
Globalize.prototype.dateParser = function( options ) {
	var args, cldr, numberParser, parseProperties, pattern, tokenizerProperties, returnFn;

	validateParameterTypePlainObject( options, "options" );

	cldr = this.cldr;
	options = options || { skeleton: "yMd" };

	args = slice.call( arguments, 0 );

	validateDefaultLocale( cldr );

	if ( returnFn = cacheGet( "dateParser", args, cldr ) ) {
		return returnFn;
	}

	cldr.on( "get", validateRequiredCldr );
	pattern = dateExpandPattern( options, cldr );
	tokenizerProperties = dateTokenizerProperties( pattern, cldr );
	parseProperties = dateParseProperties( cldr );
	cldr.off( "get", validateRequiredCldr );

	numberParser = this.numberParser({ raw: "0" });

	returnFn = function dateParser( value ) {
		var tokens;

		validateParameterPresence( value, "value" );
		validateParameterTypeString( value, "value" );

		tokens = dateTokenizer( value, numberParser, tokenizerProperties );
		return dateParse( value, tokens, parseProperties ) || null;
	};

	cacheSet( args, cldr, returnFn );

	runtimeBind( args, cldr, {
		numberParser: numberParser,
		parseProperties: parseProperties,
		tokenizerProperties: tokenizerProperties
	}, returnFn );

	return returnFn;
};

/**
 * .formatDate( value, options )
 *
 * @value [Date]
 *
 * @options [Object] see date/expand_pattern for more info.
 *
 * Formats a date or number according to the given options string and the default/instance locale.
 */
Globalize.formatDate =
Globalize.prototype.formatDate = function( value, options ) {
	validateParameterPresence( value, "value" );
	validateParameterTypeDate( value, "value" );

	return this.dateFormatter( options )( value );
};

/**
 * .parseDate( value, options )
 *
 * @value [String]
 *
 * @options [Object] see date/expand_pattern for more info.
 *
 * Return a Date instance or null.
 */
Globalize.parseDate =
Globalize.prototype.parseDate = function( value, options ) {
	validateParameterPresence( value, "value" );
	validateParameterTypeString( value, "value" );

	return this.dateParser( options )( value );
};

return Globalize;

});
