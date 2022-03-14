// From https://github.com/grofit/knockout.markdown
// https://github.com/grofit/knockout.markdown/blob/master/src/knockout.markdown.js
(function (factory) {
    // Module systems magic dance.

    if (typeof require === "function" && typeof exports === "object" && typeof module === "object") {
        // CommonJS or Node: hard-coded dependency on "knockout"
        factory(require("knockout"), require("markdown-it"));
    } else if (typeof define === "function" && define["amd"]) {
        // AMD anonymous module with hard-coded dependency on "knockout"
        define(["knockout"], ["markdown-it"], factory);
    } else {
        // <script> tag: use the global `ko` object, attaching a `mapping` property
        factory(ko, markdownit);
    }
}
(function (ko, markdown) {
    ko.markdown = markdown();

	ko.bindingHandlers.markdown = {
		update: function(element, valueAccessor, allBindingsAccessor) {
			var allBindings = allBindingsAccessor();
			var markdownBinding = allBindings.markdown;

            var markdownData = ko.unwrap(markdownBinding);
            var formattedData = ko.markdown.render(markdownData);
            // Custom extension for Trello, to bold any @username tags
            formattedData = formattedData.replace(/(@\w+)/g,"<b>$1</b>");
            element.innerHTML = formattedData;
		}
	};
}));