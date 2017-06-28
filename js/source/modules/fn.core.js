// =============================== Core Library Functions
/**
 * @description [Main function loops over provided string to check for any code duplicates.]
 * @param  {String} string [The string to check.]
 * @return {Undefined}   [Nothing is returned.]
 */
function main(string) {
    // flags are used while parsing string in main loop
    var flags = {
        "atsign": null,
        "open": {
            "brace": null,
            "comment": null,
        },
        "closed": {
            "brace": null,
            "comment": null,
        },
        "counter": {
            "brace": null
        },
        "child": {
            "complex": null,
            "simple": null,
        }
    };
    // main loop: loop over string
    for (var i = 0, l = string.length; i < l; i++) {
        // cache the current character in loop
        var char = string.charAt(i),
            char_code = char.charCodeAt(0);
        // look out for these characters: @, {, }, /*, */
        // // check for comments, opening to potential comment
        // // if a comment is found the entire comment is skipped
        // // by forwarding the loop index to the position of the
        // // closing comment characters + 2
        // if (char_code === 47) { // character: /
        //     // check that the next character is an asterisk
        //     if (string.charCodeAt(i + 1) === 42) { // character: *
        //         // **we have the opening of a comment**
        //         // look for the closing comment...
        //         var closing_comment_index = string.indexOf("*/", (i + 1));
        //         // skip loop all the way to the position of the ending closing comment characters
        //         i = closing_comment_index + 2;
        //     }
        // }
        // check for atsigns
        if (char_code === 64) { // character: @
            // check to see that it is not a one-liner (i.e. @charset, @import, @namespace)
            // get the index of the immediate space after the last letter
            var space_index = string.indexOf(" ", (i + 1)),
                atrule_name = string.substring((i + 1), space_index);
            // check if artule is a simple one-liner
            if (-~["charset", "import", "namespace"].indexOf(atrule_name)) {
                // get the index of the next semicolon; meaning the end of the atrule
                // forward loop all the way to the position of the ending of atrule
                i = string.indexOf(";", (i + 1)) + 1;
            } else { // all other CSS atrules
                // get the index of the opening brace + set the brace_open flag
                flags.open.brace = string.indexOf("{", (i + 1));
                // set the atsign flag
                flags.atsign = i;
                // set the brace counter
                flags.counter.brace = 1;
                // forward loop all the way to the position of the start brace
                i = flags.open.brace;
                // grab selector (text between atsign and open brace indices)
                var selector = string.substring(flags.atsign, flags.open.brace)
                    .trim();
                // keep track of the brace indices
                var brace_indices_track = [i];
                // the amount of nested (complex "@") levels
                var nested_levels = 0;
                // start parsing CSS code block...start by getting the next brace index
                while (flags.counter.brace) {
                    // get the indices for the next open and closed brace
                    var start_brace_index = string.indexOf("{", i + 1),
                        end_brace_index = string.indexOf("}", i + 1);
                    // place both indices into an array and then filter array to only
                    // have numbers, -1 will be replaced with null, which will then
                    // get pruned out with the filter function
                    // filter(Number): http://stackoverflow.com/questions/281264/remove-empty-elements-from-an-array-in-javascript/2843625#2843625
                    var brace_indices = [(!-~start_brace_index ? null : start_brace_index), (!-~end_brace_index ? null : end_brace_index)].filter(Number);
                    // get the lowest index number. this index will be the
                    // closest to the first open brace. if there is no brace at all,
                    // null is returned in place of -1.
                    var next_index = (brace_indices.length) ? Math.min.apply(null, brace_indices) : null;
                    // get the last brace index from stored brace indices
                    var last_index = brace_indices_track[brace_indices_track.length - 1];
                    // the text between the last and next brace points. depending on the braces
                    // this could be a selector (simple "s" or complex "@":"x") or a CSS code block
                    var text_between = string.substring((last_index + 1), next_index)
                        .trim();
                    // get the brace character using the last and next index points
                    var first_brace = string.charAt(last_index);
                    var last_brace = string.charAt(next_index);
                    // check if simple or complex, used later on
                    var type = (text_between.charAt(0) === "@") ? "x" : "s";
                    // the types of possible brace match ups
                    // { { --> Start of block (simple or complex)
                    // { } --> CSS code block
                    // } { --> End of code block, start of new code block
                    // } } --> End of complex block
                    // differentiate between brace match ups
                    if (first_brace === "{" && last_brace === "{") { // child selector
                        if (type === "x") {
                            // set the appropriate flag
                            flags.child.complex = true;
                            // increment nested_levels
                            nested_levels++;
                            // add to selector
                            selector += " / " + text_between;
                        } else if (type === "s") {
                            // for simple code blocks remove all preceding simple code block selectors
                            // and only keep the nested parent @ complex selectors
                            selector = rem_simple_add_simple_selector(selector, text_between);
                        }
                    } else if (first_brace === "{" && last_brace === "}") { // code block
                        // this this error gets thrown there is a code block right after a complex selector
                        // this is not valid CSS and messes up the nested level count
                        // this is an example:
                        // @media screen and (max-width: 500px) {
                        //     .option-status {
                        //         padding: 2px 6px 0 6px;
                        //         font-size: 14px;
                        //         font-size: 15px;
                        //     }
                        //     /* --------------------------------- Error Causing CSS*/
                        //     @media screen {
                        //         @media2 {
                        //             width: 200px; <--- this code block must be wrapped in a simple selector
                        //             width: 300px; <--/
                        //         }
                        //     }
                        //     /* --------------------------------- Correct CSS*/
                        //     @media screen {
                        //         @media2 {
                        //             .purple {
                        //                  width: 200px; <--- nested levels can now be accounted for
                        //                  width: 300px; <--/
                        //             }
                        //         }
                        //     }
                        //     /* --------------------------------- */
                        //     .green {
                        //         padding: 2px 6px 0 6px;
                        //         font-size: 14px;
                        //         font-size: 15px;
                        //     }
                        // }
                        // check code block for any duplicate properties
                        dupe_check(selector, text_between);
                        if (type === "s") {
                            // for simple code blocks remove all preceding simple code block selectors
                            // and only keep the nested parent @ complex selectors
                            selector = rem_simple_add_simple_selector(selector, "");
                        }
                    } else if (first_brace === "}" && last_brace === "{") { // end of code block, start of new code block
                        if (type === "x") {
                            // set the appropriate flag
                            flags.child.complex = true;
                            // increment nested_levels
                            nested_levels++;
                            // add to selector
                            selector += " / " + text_between;
                        } else if (type === "s") {
                            // for simple code blocks remove all preceding simple code block selectors
                            // and only keep the nested parent @ complex selectors
                            selector = rem_simple_add_simple_selector(selector, text_between);
                        }
                    } else if (first_brace === "}" && last_brace === "}") { // end of complex code block
                        // remove all the simple CSS selectors
                        selector = selector.split(" / ")
                            .filter(function(s) {
                                return (s.charAt(0) === "@");
                            });
                        // now remove go down one nested level down
                        // http://stackoverflow.com/questions/19544452/remove-last-item-from-array
                        selector.splice(-1, 1);
                        // turn array back to string
                        selector = selector.join(" / ");
                        // finally, decrease nested level
                        nested_levels--;
                    }
                    // add the next brace point to track track it
                    brace_indices_track.push(next_index);
                    // if the index matches the start brace "{", increase the brace counter
                    if (start_brace_index === next_index) flags.counter.brace++;
                    // else if the brace is a closing brace "}", decrease the brace counter
                    else if (end_brace_index === next_index) flags.counter.brace--;
                    // forward loop index to the next brace position
                    i = next_index;
                    // if no more braces are found end the while loop by unsetting the
                    // flags.counter.brace flag
                    if (flags.counter.brace === 0) flags.counter.brace = null; // unset flag
                }
                // unset the flag atsign
                flags.atsign = null;
            }
        }
        // check for braces, this is for simple code blocks
        if (char_code === 123) { // character: {
            // get the indices for the previous closed brace & semicolon
            var end_brace_index = string.lastIndexOf("}", i),
                semicolon_index = string.lastIndexOf(";", i);
            // place both indices into an array
            // filter(Number): http://stackoverflow.com/questions/281264/remove-empty-elements-from-an-array-in-javascript/2843625#2843625
            var prev_indices = [(!-~end_brace_index ? null : end_brace_index), (!-~semicolon_index ? null : semicolon_index)].filter(Number);
            // get the lowest indice in number. this index will be the
            // closest to the first open brace. if there is no brace at all,
            // null is returned in place of -1.
            var prev_index = (prev_indices.length) ? Math.max.apply(null, prev_indices) : null;
            // finally, get selector from CSS string
            var selector = string.substring(((prev_index) ? (prev_index + 1) : 0), i)
                .trim();
            // get the CSS code block by using the current index + 1 as the start
            // and the closing brace index as the end point
            var code_block = string.substring((i + 1), string.indexOf("}", (i + 1)))
                .trim();
            // check code block for any duplicate properties
            dupe_check(selector, code_block);
        }
    }
}
// the worker event listener
self.addEventListener("message", function(e) {
    // cache the data object
    var message = e.data;
    // object collection of actions
    var actions = {
        "start": function() {
            // prepare string
            var string = string_preparation(message.string);
            // run the main function
            main(string);
            // send back data
            self.postMessage({
                "action": "done",
                // blocks contain 3 items per array item
                // [0] => CSS Selector
                // [1] => CSS Text (CSS declarations)
                // [2] => Object containing the properties that have duplicate CSS declarations
                "dupes": blocks,
                "prettified": prettify(blocks)
            });
        },
        "stop": function() {
            // stop the worker
            self.close();
        }
    };
    // run the needed action
    (actions[message.action] || window.Function)();
}, false);
