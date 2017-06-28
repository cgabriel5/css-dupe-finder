// blocks array will contain all the CSS blocks found within the CSS string
var blocks = [];
/**
 * @description [Contains the counter, container, and different RegExp patterns used to
 *               placehold.]
 * @type {Object}
 */
var regexp = {
    "counter": -1,
    "container": [],
    "info": {
        "content": {
            // "content": new RegExp(/content:.*?(?=;\s*(\w|\}))/, "gi"),
            "pattern": new RegExp(/(?!((\{|;)\s*?))content:(.*?)(?=;\s*(-|\w|\}))/, "gi")
        },
        "entity": {
            // https://en.wikipedia.org/wiki/List_of_XML_and_HTML_character_entity_references
            "pattern": new RegExp(/&#?x?([\da-f]|[a-z])+;/, "gi")
        },
        "parens": {
            // "parens": new RegExp(/\([^\(\)]*?\)/, "g"),
            // "parens": new RegExp(/(?![:|\s*])(?!\w+)\(.*?\)(?=(,|"|'|;|\s|\{|\}))/, "g"),
            // http://stackoverflow.com/questions/17333124/using-regex-to-match-function-calls-containing-parentheses/17333209#17333209
            "pattern": new RegExp(/\(([^()]*|\([^()]*\))*?\)/, "g")
        }
    }
};
