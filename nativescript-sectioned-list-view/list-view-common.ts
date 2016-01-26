import observable = require("data/observable");
import view = require("ui/core/view");
import proxy = require("ui/core/proxy");
import definition = require("nativescript-sectioned-list-view");
import dependencyObservable = require("ui/core/dependency-observable");
import color = require("color");
import * as builderModule from "ui/builder";
import * as labelModule from "ui/label";
import * as observableArrayModule from "data/observable-array";
import * as weakEventsModule from "ui/core/weak-event-listener";

var ITEMS = "items";
var ITEMTEMPLATE = "itemTemplate";
var HEADER_TEMPLATE = "headerTemplate";
var ISSCROLLING = "isScrolling";
var LISTVIEW = "SectionedListView";
var SEPARATORCOLOR = "separatorColor";
var ROWHEIGHT = "rowHeight";
var HEADER_HEIGHT = "headerHeight";

export module knownTemplates {
    export var itemTemplate = "itemTemplate";
    export var headerTemplate = "headerTemplate";
}

function onItemsPropertyChanged(data: dependencyObservable.PropertyChangeData) {
    var listView = <SectionedListView>data.object;
    listView._onItemsPropertyChanged(data);
}

function onItemTemplatePropertyChanged(data: dependencyObservable.PropertyChangeData) {
    var listView = <definition.SectionedListView>data.object;
    listView.refresh();
}

function onRowHeightPropertyChanged(data: dependencyObservable.PropertyChangeData) {
    var listView = <SectionedListView>data.object;
    listView._onRowHeightPropertyChanged(data);
}

export class SectionedListView extends view.View implements definition.SectionedListView {
    public static itemLoadingEvent = "itemLoading";
    public static headerLoadingEvent = "headerLoading";
    public static itemTapEvent = "itemTap";
    public static loadMoreItemsEvent = "loadMoreItems";

    public static separatorColorProperty = new dependencyObservable.Property(
        SEPARATORCOLOR,
        LISTVIEW,
        new proxy.PropertyMetadata(undefined));

    public static itemsProperty = new dependencyObservable.Property(
        ITEMS,
        LISTVIEW,
        new proxy.PropertyMetadata(
            undefined,
            dependencyObservable.PropertyMetadataSettings.AffectsLayout,
            onItemsPropertyChanged
            )
        );

    public static itemTemplateProperty = new dependencyObservable.Property(
        ITEMTEMPLATE,
        LISTVIEW,
        new proxy.PropertyMetadata(
            undefined,
            dependencyObservable.PropertyMetadataSettings.AffectsLayout,
            onItemTemplatePropertyChanged
            )
        );
    public static headerTemplateProperty = new dependencyObservable.Property(
        HEADER_TEMPLATE,
        LISTVIEW,
        new proxy.PropertyMetadata(
            undefined,
            dependencyObservable.PropertyMetadataSettings.AffectsLayout,
            onItemTemplatePropertyChanged
            )
        );
        
    public static isScrollingProperty = new dependencyObservable.Property(
        ISSCROLLING,
        LISTVIEW,
        new proxy.PropertyMetadata(
            false,
            dependencyObservable.PropertyMetadataSettings.None
            )
    );

    public static rowHeightProperty = new dependencyObservable.Property(
        ROWHEIGHT,
        LISTVIEW,
        new proxy.PropertyMetadata(
            -1,
            dependencyObservable.PropertyMetadataSettings.AffectsLayout,
            onRowHeightPropertyChanged
            )
    );
    
    public static headerHeightProperty = new dependencyObservable.Property(
        HEADER_HEIGHT,
        LISTVIEW,
        new proxy.PropertyMetadata(
            28,
            dependencyObservable.PropertyMetadataSettings.AffectsLayout,
            onRowHeightPropertyChanged
            )
    );

    get items(): any {
        return this._getValue(SectionedListView.itemsProperty);
    }
    set items(value: any) {
        this._setValue(SectionedListView.itemsProperty, value);
    }

    get itemTemplate(): string | view.Template {
        return this._getValue(SectionedListView.itemTemplateProperty);
    }
    set itemTemplate(value: string | view.Template) {
        this._setValue(SectionedListView.itemTemplateProperty, value);
    }
    
    get headerTemplate(): string | view.Template {
        return this._getValue(SectionedListView.headerTemplateProperty);
    }
    set headerTemplate(value: string | view.Template) {
        this._setValue(SectionedListView.headerTemplateProperty, value);
    }

    get isScrolling(): boolean {
        return this._getValue(SectionedListView.isScrollingProperty);
    }
    set isScrolling(value: boolean) {
        this._setValue(SectionedListView.isScrollingProperty, value);
    }

    get separatorColor(): color.Color {
        return this._getValue(SectionedListView.separatorColorProperty);
    }
    set separatorColor(value: color.Color) {
        this._setValue(SectionedListView.separatorColorProperty,
            value instanceof color.Color ? value : new color.Color(<any>value));
    }

    get rowHeight(): number {
        return this._getValue(SectionedListView.rowHeightProperty);
    }
    set rowHeight(value: number) {
        this._setValue(SectionedListView.rowHeightProperty, value);
    }
    
    get headerHeight(): number {
        return this._getValue(SectionedListView.headerHeightProperty);
    }
    
    set headerHeight(value : number) {
        this._setValue(SectionedListView.headerHeightProperty, value);
    }

    public refresh() {
        //
    }

    public scrollToIndex(index: number) {
        //
    }

    public _getItemTemplateContent(row: number, section:number =0): view.View {
        var v;

        if (this.itemTemplate && this.items) {
            var builder : typeof builderModule = require("ui/builder");

            v = builder.parse(this.itemTemplate, this);
        }

        return v;
    }
    
    public _getHeaderTemplateContent(section:number =0): view.View {
        var v;

        if (this.headerTemplate) {
            var builder : typeof builderModule = require("ui/builder");

            v = builder.parse(this.headerTemplate, this);
        }

        return v;
    }

    public _prepareItem(item: view.View, row: number, section: number) {
        if (item) {
            var dataItem = this._getDataItem(row, section);
            if (!(dataItem instanceof observable.Observable)) {
                item.bindingContext = null;
            }
            item.bindingContext = dataItem;
            item._inheritProperties(this);
        }
    }
    
    public _prepareHeader(item: view.View, section: number) {
        if (item) {
            var dataItem = this._getHeaderItem(section);
            if (!(dataItem instanceof observable.Observable)) {
                item.bindingContext = null;
            }
            item.bindingContext = dataItem;
            item._inheritProperties(this);
        }
    }

    private _getDataItem(row: number, section:number = 0): any {
        if(this.items.getNoOfSections) {
            return this.items.getItem(row, section);
        }
        return this.items.getItem ? this.items.getItem(row) : this.items[row];
    }
    
    private _getHeaderItem(section: number) : any {
        if (this.items && this.items.getTitle) {
            return this.items.getTitle(section);
        }
        return "";
    }

    public _getDefaultItemContent(row: number, section:number = 0): view.View {
        var label: typeof labelModule = require("ui/label");

        var lbl = new label.Label();
        lbl.bind({
            targetProperty: "text",
            sourceProperty: "$value"
        });
        return lbl;
    }
    
    public _getDefaultHeaderContent(row: number, section:number = 0): view.View {
        var label: typeof labelModule = require("ui/label");

        var lbl = new label.Label();
        lbl.bind({
            targetProperty: "text",
            sourceProperty: "$value"
        });
        return lbl;
    }

    public _onItemsPropertyChanged(data: dependencyObservable.PropertyChangeData) {
        var observableArray: typeof observableArrayModule = require("data/observable-array");
        var weakEvents: typeof weakEventsModule = require("ui/core/weak-event-listener");

        if (data.oldValue instanceof observable.Observable) {
            weakEvents.removeWeakEventListener(data.oldValue, observableArray.ObservableArray.changeEvent, this._onItemsChanged, this);
        }

        if (data.newValue instanceof observable.Observable) {
            weakEvents.addWeakEventListener(data.newValue, observableArray.ObservableArray.changeEvent, this._onItemsChanged, this);
        }

        this.refresh();
    }

    private _onItemsChanged(args: observable.EventData) {
        this.refresh();
    }

    public _onRowHeightPropertyChanged(data: dependencyObservable.PropertyChangeData) {
        this.refresh();
    }

    public _propagateInheritableProperties(view: view.View) {
        // do not get binding context from parent when adding items, since the binding context of the items will be different.
    }
}
