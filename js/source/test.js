/* jshint shadow:true */
/* jshint bitwise: false */
// http://jshint.com/docs/options/#shadow
document.onreadystatechange = function() {
    "use strict";
    // all resources have loaded (document + sub-resources)
    if (document.readyState === "complete") {
        /**
         * @description [Main app function/textarea event handler.]
         * @return {Undefined} [Nothing is returned.]
         */
        var main = function(e) {
            // Step 1: Get Needed Element(s) & CSS String
            //
            // element that will be injected the highlighted code
            var $output_element = document.getElementById("textarea2");
            // the CSS string to highlight
            var string = document.getElementById("textarea1")
                .value;
            // Step 2: Setup Web Worker
            //
            // create the web worker
            var worker = new Worker("lib/lib.js");
            // listen for web worker messages
            worker.addEventListener("message", function(e) {
                // cache the data object
                var message = e.data;
                // object collection of actions
                var actions = {
                    "done": function() {
                        // inject duplicate CSS
                        $output_element.value = message.prettified;
                        // terminate worker
                        // worker.terminate(); // close worker from main file
                        worker.postMessage({
                            "action": "stop"
                        }); // close worker from worker file
                    }
                };
                // run the needed action
                (actions[message.action] || window.Function)();
            }, false);
            // Step 3: Send Data To Web Worker
            //
            // send data to web worker
            worker.postMessage({
                "action": "start", // required
                "string": string // required; -- [your CSS string]
            });
        };
        // *************************************************************************************
        // run the main function (runs the initial CSS check)
        main();
        // get needed elements
        var $textarea1 = document.getElementById("textarea1");
        // listen to any input changes done on the textarea input and check CSS
        $textarea1.addEventListener("input", main, false);
        $textarea1.addEventListener("focus", main, false);
    }
};
