/**
 * @description [Prepares the string by removing comments, terminating lines, and
 *               running a slue of placeholder functions. Once prepared the string
 *               is the turned over to the main() function.]
 * @param  {String} string [The string to prepare.]
 * @return {String}        [The prepared string.]
 */
function string_preparation(string) {
    // remove comments from CSS string
    string = string.replace(/\/\*.*?\*\//g, ""); // \/\*[^\/\*]?.*?\*\/
    // add semicolons to last declarations in CSS blocks
    // http://stackoverflow.com/questions/26984415/matching-ending-css-curly-brace-when-it-ends-without-a-semicolon/26984572#26984572
    // regexp explained: ([^{};\s])(\s*})
    // first capture group gets anything by a space or the literal characters {};
    // second capture group gets any amount of space and a closing brace
    // the replacement then puts a semicolon between the first two groups
    string = string.replace(/([^{};\s])(\s*})/g, "$1;$2");
    // replace everything in the CSS string that is in parenthesis,
    // replacing it prevents the detection of false semicolon endings. for example,
    // the semicolon found in a base64 URL found after the mimetype is not an endpoint
    // this short replacement will avoid situations like that.
    // https://dev.w3.org/html5/html-author/charref
    string = placehold(string, "entity");
    // replace everything in the CSS string that is in parenthesis,
    // replacing it prevents the detection of false semicolon endings. for example,
    // the semicolon found in a base64 URL found after the mimetype is not an endpoint
    // this short replacement will avoid situations like that.
    string = placehold(string, "parens");
    // replace all content properties as they can contain text
    // replacing it prevents the detection of false comment/brace/atsign detections
    string = placehold(string, "content");
    // return the prepared string
    return string;
}
/**
 * @description [Replaces placeholder with its original content.]
 * @param  {String} string [The string to work with.]
 * @return {String}        [String with its original contents.]
 */
function cleanup(string) {
    return string.replace(/\$\$_placeholder_\[(\d+)\]/g, function() {
        return regexp.container[(arguments[1] * 1)][0];
    });
}
/**
 * @description [Depending on the RegExp pattern used (dependent on the "type"), the matching
 *               pattern contents are replaced with a placeholder. This is done to avoid
 *               detecting false brace/comments/semicolon matches in string.]
 * @param  {String} string                   [The string to work with.]
 * @return {String}                          [The string with placeholder where needed.]
 */
function placehold(string, type) {
    var info = regexp.info[type],
        pattern = info.pattern,
        container = regexp.container;
    return string.replace(pattern, function() {
        // store match + index for later use
        container.push([arguments[0], arguments[arguments.length - 1]]);
        return "$$" + "_placeholder_" + "[" + (++regexp.counter) + "]";
    });
}
/**
 * @description [Function removes all simple selectors (selectors that are not nested, don't
 *               use the "@") from string and appends the new simple selector to string.]
 * @param  {String} selector     [The selector to remove simples selectors and append new
 *                                selector.]
 * @param  {String} text_between [The new simple selector.]
 * @return {String}              [The new selector with all simple selectors removed but with
 *                                new simple selector appended.]
 */
function rem_simple_add_simple_selector(selector, text_between) {
    return selector.split(" / ")
        .filter(function(s) {
            return (s.charAt(0) === "@");
        })
        .join(" / ") + " / " + text_between;
}
/**
 * @description [Goes through the dupe array checking block declarations for duplicate CSS
 *               properties.]
 * @param  {String} selector [The selector corresponding to the CSS code block.]
 * @param  {String} css_text [The CSS code block declarations.]
 * @return {Object}          [Object containing the duplicate properties in for format
 *                            key: value => {dupe_property_name: array_of_dupe_declarations}]
 */
function dupe_check(selector, css_text) {
    // prepare CSS string + define vars
    var declarations = css_text.split(";"),
        frequency = {},
        size = 0;
    // loop vars
    var declaration, colon_index, property, value;
    // loop over declarations
    for (var i = 0, l = declarations.length; i < l; i++) {
        // cache current declaration
        declaration = declarations[i].trim();
        // replace placeholders, if any
        declaration = cleanup(declaration);
        // get colon index to get property and its value
        colon_index = declaration.indexOf(":");
        property = declaration.substring(0, colon_index)
            .trim();
        value = declaration.substring((colon_index + 1), declaration.length)
            .trim();
        // update frequency map
        if (frequency[property]) {
            frequency[property].push([property, value, declaration]); // increase frequency
        } else { // init frequency
            frequency[property] = [
                [property, value, declaration]
            ];
            size++; // increment object size
        }
    }
    // loop through all properties, remove all unique CSS properties
    for (var prop in frequency) {
        // if property is unique remove from object
        if (frequency.hasOwnProperty(prop) && frequency[prop].length <= 1) {
            delete frequency[prop];
            size--; // decrease object size to accommodate prop removal
        }
    }
    // only add to block array if there are any duplicate CSS properties
    if (size) blocks.push([cleanup(selector), css_text, frequency]);
}
/**
 * @description [Cleans up the CSS dupe blocks by prettifying them (adds proper code
 *               indentation).]
 * @param  {Array} blocks [The array of dupe code blocks.]
 * @return {String}        [The prettified dupe code blocks now in a string.]
 */
function prettify(blocks) {
    // formated blocked container
    var formated = [];
    // loop over blocks
    for (var i = 0, l = blocks.length; i < l; i++) {
        var block = blocks[i],
            selector = block[0],
            selectors = selector.split(" / "),
            // var css_text = block[1];
            dupes = block[2],
            // calculate the CSS block indentation by simply repeating
            // join by 4 spaces
            indentation = Array((selectors.length) + 1)
            .join("    ");
        // build the selector
        var build = [],
            ending_braces = [],
            indent;
        for (var j = 0, ll = selectors.length; j < ll; j++) {
            // calculate the selector indentation
            indent = (Array((j) + 1)
                .join("    "));
            // add indented selector + indented closing brace to
            // their respective arrays
            build.push(indent + selectors[j] + " {" + "\n");
            ending_braces.push(indent + "}" + "\n");
        }
        // loop over the duplicate properties
        for (var prop in dupes) {
            if (dupes.hasOwnProperty(prop)) {
                // get the dupes
                var dupe_array = dupes[prop];
                // loop over every dupe prop within each property and log
                for (var j = 0, ll = dupe_array.length; j < ll; j++) {
                    var dupe_declaration = dupe_array[j];
                    build.push(indentation + dupe_declaration[0] + ": ", dupe_declaration[1] + ";\n");
                }
            }
        }
        // join selector, CSS declarations, and closing braces to make
        // the final string, then add to formated array
        formated.push(build.concat(ending_braces.reverse())
            .join(""));
    }
    // finally, join all parts into a final string
    var pretty = [];
    // loop over each block and add to the pretty array
    for (var i = 0, l = formated.length; i < l; i++) {
        pretty.push(formated[i]);
    }
    // return the formated dupes
    return pretty.join("");
}
// /**
//  * @description [Logs the code blocks that contain dupe CSS declarations.]
//  * @param  {Array} blocks [Collection of code blocks containing dupe CSS
//  *                         properties.]
//  * @return {Null}        [Only logs duplicates info onto the console.]
//  */
// function log(dupes) {
//     // log the dupes length
//     console.log(dupes.length);
//     for (var i = 0, l = dupes.length; i < l; i++) {
//         // log the dupe
//         console.log(dupes[i]);
//         // log a space between dupes
//         console.log("");
//     }
// }
