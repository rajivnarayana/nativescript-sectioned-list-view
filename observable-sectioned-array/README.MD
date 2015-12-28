# Observable sectioned array.

A nativescript plugin to use sections of items for data binding.  This can be used alongside [Sectioned List View](https://npmjs.com/package/nativescript-sectioned-list-view) to support sections.

## Installation

Run the following command from the root of your project

```
$ tns plugin add observable-sectioned-array
```
This command automatically installs the necessary files, as well as stores observable-sectioned-array as a dependency in your project's `package.json` file.

## Examples

Following code imports the module
```js
var observableSectionArrayModule = require("observable-sectioned-array");
```

Following code creates an array and adds sections to it.
 
```js
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

    sectionedArray.on(observableSectionArrayModule.ObservableSectionArray.CHANGE, function (args) {
        //Fired when we add "Eve" below.
    	console.log("Event name: " + args.eventName + ", action: " + args.action);
        //Event name: change, action: add
        
    	console.log("args.row: " + args.row + ", args.section: " + args.section + ", added count: "+args.addedCount);
        //args.row: 2, args.section: null, added count: 1
	});

	console.log('No of sections: ' + sectionedArray.getNoOfSections());
    //No of sections: 2
    
    console.log('No of items in section 1: ' + sectionedArray.getNoOfItemsInSection(1));
    //No of items in section 1: 2
    
    console.log('Item at {1,1}: ' + JSON.stringify(sectionedArray.getItem(1,1)));
    //Item at {1,1}: { "name": "Brittany", gender: "female" }

    //Now add a new student "Eve" to girls after some delay. 
    setTimeout(function() {
    	sectionedArray.push([{"name": "Eve", gender:"female"}], 1);
    }, 3000);
    
```
