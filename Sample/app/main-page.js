var sectionedListViewModule = require("nativescript-sectioned-list-view");
var observableSectionArrayModule = require("observable-sectioned-array");

function pageLoaded(args) {
    var page = args.object;

    var students = [
    	{"name" : "Alice", gender:"female"},
    	{"name": "Adam", gender: "male"},
    	{"name": "Bob", gender: "male"},
    	{"name": "Brittany", gender: "female"},
    	{"name": "Evan", gender: "male"}
    ];

    var boys = students.filter(function(student) { return student.gender ==="male";});

    var girls = students.filter(function(student) { return student.gender ==="female";});

    var sectionedArray = new observableSectionArrayModule.ObservableSectionArray();
    sectionedArray.addSection("Boys", boys);
    sectionedArray.addSection("Girls", girls);

    //Now add a new student "Eve" to girls after some delay. 
    setTimeout(function() {
    	//Notice how pushing new item to section array reloads the view and adds Eve as a new row.
    	sectionedArray.push([{"name": "Eve", gender:"female"}], 1);
    }, 3000);

	page.bindingContext = {items: sectionedArray};    

    // page.bindingContext = {items:{
    // 	getTitle: function(section) { return "Section "+section;},
    // 	getNoOfSections: function() { return 2;}, 
    // 	getNoOfItemsInSection: function(section) {return 3;}, 
    // 	getItem: function(row, section) { return "Item {"+row+", "+section+"}";}
    // }};

    // page.bindingContext = {
    // 	items : {
    // 		length : 10,
    // 		getItem : function(row) {
    // 			return "Item "+row;
    // 		}
    // 	}
    // }
}
exports.pageLoaded = pageLoaded;
