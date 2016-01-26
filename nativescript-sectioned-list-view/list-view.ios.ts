import observable = require("data/observable");
import definition = require("nativescript-sectioned-list-view");
import common = require("./list-view-common");
import utils = require("utils/utils");
import view = require("ui/core/view");
import proxy = require("ui/core/proxy");
import dependencyObservable = require("ui/core/dependency-observable");
import * as colorModule from "color";
import { Label } from "ui/label";
import { FormattedString } from "text/formatted-string";
import { Span } from "text/span";
import { FontAttributes } from "ui/enums";

var CELLIDENTIFIER = "cell";
var HEADERIDENTIFIER = "header";
var ITEMLOADING = common.SectionedListView.itemLoadingEvent;
var HEADERLOADING = common.SectionedListView.headerLoadingEvent;
var LOADMOREITEMS = common.SectionedListView.loadMoreItemsEvent;
var ITEMTAP = common.SectionedListView.itemTapEvent;
var DEFAULT_HEIGHT = 44;

global.moduleMerge(common, exports);

var infinity = utils.layout.makeMeasureSpec(0, utils.layout.UNSPECIFIED);

class SectionedListViewCell extends UITableViewCell {
    public willMoveToSuperview(newSuperview: UIView): void {
        let parent: SectionedListView = <SectionedListView>(this.view ? this.view.parent : null);

        // When inside ListView and there is no newSuperview this cell is 
        // removed from native visual tree so we remove it from our tree too.
        if (parent && !newSuperview) {
            parent._removeContainer(this);
        }
    }

    public get view(): view.View {
        return this.owner ? this.owner.get() : null
    }

    public owner: WeakRef<view.View>;
}

class SectionedListViewHeaderView extends UITableViewHeaderFooterView {
    
    public willMoveToSuperview(newSuperview: UIView): void {
        let parent: SectionedListView = <SectionedListView>(this.view ? this.view.parent : null);

        // When inside ListView and there is no newSuperview this cell is 
        // removed from native visual tree so we remove it from our tree too.
        if (parent && !newSuperview) {
            parent._removeContainer(this);
        }
    }
    
    public get view(): view.View {
        return this.owner ? this.owner.get() : null
    }

    public owner: WeakRef<view.View>;
}

function notifyForItemAtIndex(listView: definition.SectionedListView, cell: any, view: view.View, eventName: string, indexPath: NSIndexPath) {
    let args = <definition.ItemEventData>{ eventName: eventName, object: listView, row: indexPath.row, section: indexPath.section, view: view, ios: cell, android: undefined };
    listView.notify(args);
    return args;
}

function notifyForHeaderAtSection(listView: definition.SectionedListView, header: any, view: view.View, eventName: string, section: number) {
    let args = <definition.ItemEventData>{ eventName: eventName, object: listView, row: 0, section: section, view: view, ios: header, android: undefined };
    listView.notify(args);
    return args;
}

class SectionedDataSource extends NSObject implements UITableViewDataSource {
    public static ObjCProtocols = [UITableViewDataSource];

    private _owner: WeakRef<SectionedListView>;

    public static initWithOwner(owner: WeakRef<SectionedListView>): SectionedDataSource {
        let dataSource = <SectionedDataSource>SectionedDataSource.new();
        dataSource._owner = owner;
        return dataSource;
    }

    public numberOfSectionsInTableView(tableView: UITableView) {
        let owner = this._owner.get();
        if (owner && owner.items && owner.items.getNoOfSections) {
            return (<definition.ObservableSectionArray<any, any>>(owner.items)).getNoOfSections();
        }
        return 1;
    }
    
    public tableViewNumberOfRowsInSection(tableView: UITableView, section: number) {
        let owner = this._owner.get();
        if(owner && owner.items && owner.items.getNoOfItemsInSection) {
            return (<definition.ObservableSectionArray<any, any>>(owner.items)).getNoOfItemsInSection(section);
        }
        return (owner && owner.items) ? owner.items.length : 0;
    }

    public tableViewCellForRowAtIndexPath(tableView: UITableView, indexPath: NSIndexPath): UITableViewCell {
        // We call this method because ...ForIndexPath calls tableViewHeightForRowAtIndexPath immediately (before we can prepare and measure it).
        let cell = <SectionedListViewCell>(tableView.dequeueReusableCellWithIdentifier(CELLIDENTIFIER) || SectionedListViewCell.new());
        let owner = this._owner.get();
        if (owner) {
            owner._prepareCell(cell, indexPath);

            let cellView: view.View = cell.view;
            if (cellView) {
                // Arrange cell views. We do it here instead of _layoutCell because _layoutCell is called 
                // from 'tableViewHeightForRowAtIndexPath' method too (in iOS 7.1) and we don't want to arrange the fake cell.
                let width = utils.layout.getMeasureSpecSize(owner.widthMeasureSpec);
                let rowHeight = owner._nativeView.rowHeight;
                let cellHeight = rowHeight > 0 ? rowHeight : owner.getHeight(indexPath.row);
                view.View.layoutChild(owner, cellView, 0, 0, width, cellHeight);
            }
        }
        return cell;
    }
}

class SectionedTableViewDelegateImpl extends NSObject implements UITableViewDelegate {
    public static ObjCProtocols = [UITableViewDelegate];

    private _owner: WeakRef<SectionedListView>;
    private _measureCell: SectionedListViewCell;

    public static initWithOwner(owner: WeakRef<SectionedListView>): SectionedTableViewDelegateImpl {
        let delegate = <SectionedTableViewDelegateImpl>SectionedTableViewDelegateImpl.new();
        delegate._owner = owner;
        return delegate;
    }

    public tableViewWillDisplayCellForRowAtIndexPath(tableView: UITableView, cell: UITableViewCell, indexPath: NSIndexPath) {
        let owner = this._owner.get();
        if (owner && (indexPath.row === owner.items.length - 1)) {
            owner.notify(<observable.EventData>{ eventName: LOADMOREITEMS, object: owner });
        }
    }

    public tableViewWillSelectRowAtIndexPath(tableView: UITableView, indexPath: NSIndexPath): NSIndexPath {
        let cell = <SectionedListViewCell>tableView.cellForRowAtIndexPath(indexPath);
        let owner = this._owner.get();
        if (owner) {
            notifyForItemAtIndex(owner, cell, cell.view, ITEMTAP, indexPath);
        }
        return indexPath;
    }

    public tableViewDidSelectRowAtIndexPath(tableView: UITableView, indexPath: NSIndexPath): NSIndexPath {
        tableView.deselectRowAtIndexPathAnimated(indexPath, true);
   
        return indexPath;
    }

    public tableViewHeightForRowAtIndexPath(tableView: UITableView, indexPath: NSIndexPath): number {
        let owner = this._owner.get();
        if (!owner) {
            return 44;
        }

        let height = undefined;
        if (utils.ios.MajorVersion >= 8) {
            height = owner.getHeight(indexPath.row);
        }

        if (utils.ios.MajorVersion < 8 || height === undefined) {
            // in iOS 7.1 (or iOS8+ after call to scrollToRowAtIndexPath:atScrollPosition:animated:) this method is called before tableViewCellForRowAtIndexPath so we need fake cell to measure its content.
            let cell = this._measureCell;
            if (!cell) {
                this._measureCell = tableView.dequeueReusableCellWithIdentifier(CELLIDENTIFIER) || SectionedListViewCell.new();
                cell = this._measureCell;
            }

            height = owner._prepareCell(cell, indexPath);
        }

        return height;
    }
}

class SectionedUITableViewRowHeightDelegateImpl extends NSObject implements UITableViewDelegate {
    public static ObjCProtocols = [UITableViewDelegate];

    private _owner: WeakRef<SectionedListView>;

    public static initWithOwner(owner: WeakRef<SectionedListView>): SectionedUITableViewRowHeightDelegateImpl {
        let delegate = <SectionedUITableViewRowHeightDelegateImpl>SectionedUITableViewRowHeightDelegateImpl.new();
        delegate._owner = owner;
        return delegate;
    }

    public tableViewWillDisplayCellForRowAtIndexPath(tableView: UITableView, cell: UITableViewCell, indexPath: NSIndexPath) {
        let owner = this._owner.get();
        if (owner && (indexPath.row === owner.items.length - 1)) {
            owner.notify(<observable.EventData>{ eventName: LOADMOREITEMS, object: owner });
        }
    }

    public tableViewWillSelectRowAtIndexPath(tableView: UITableView, indexPath: NSIndexPath): NSIndexPath {
        let cell = <SectionedListViewCell>tableView.cellForRowAtIndexPath(indexPath);
        let owner = this._owner.get();
        if (owner) {
            notifyForItemAtIndex(owner, cell, cell.view, ITEMTAP, indexPath);
        }
        return indexPath; 
    }

    public tableViewHeightForRowAtIndexPath(tableView: UITableView, indexPath: NSIndexPath): number {
        let owner = this._owner.get();
        if (!owner) {
            return DEFAULT_HEIGHT;
        }

        return owner.rowHeight;
    }
    
    public tableViewViewForHeaderInSection(tableView:UITableView, section: number) {
        
        let headerView = <SectionedListViewHeaderView>(tableView.dequeueReusableHeaderFooterViewWithIdentifier(HEADERIDENTIFIER) || SectionedListViewHeaderView.new());
        let owner = this._owner.get();
        if (owner) {
            owner._prepareHeaderView(headerView, section);

            let cellView: view.View = headerView.view;
            if (cellView) {
                // Arrange cell views. We do it here instead of _layoutCell because _layoutCell is called 
                // from 'tableViewHeightForRowAtIndexPath' method too (in iOS 7.1) and we don't want to arrange the fake cell.
                let width = utils.layout.getMeasureSpecSize(owner.widthMeasureSpec);
                let headerHeight = owner.headerHeight;
                view.View.layoutChild(owner, cellView, 0, 0, width, headerHeight);
            }
        }
        return headerView;
    }
    
    public tableViewHeightForHeaderInSection(tableView:UITableView, section: number) {
        let owner = this._owner.get();
        return owner.headerHeight;
    }
}

function onSeparatorColorPropertyChanged(data: dependencyObservable.PropertyChangeData) {
    var bar = <SectionedListView>data.object;
    if (!bar.ios) {
        return;
    }

    var color: typeof colorModule = require("color");

    if (data.newValue instanceof color.Color) {
        bar.ios.separatorColor = data.newValue.ios;
    }
}

// register the setNativeValue callbacks
(<proxy.PropertyMetadata>common.SectionedListView.separatorColorProperty.metadata).onSetNativeValue = onSeparatorColorPropertyChanged;

export class SectionedListView extends common.SectionedListView {
    private _ios: UITableView;
    private _dataSource;
    private _delegate;
    private _heights: Array<number>;
    private _preparingCell: boolean = false;
    private _isDataDirty: boolean = false;
    private _map: Map<SectionedListViewCell, view.View>;
    widthMeasureSpec: number = 0;

    constructor() {
        super();

        this._ios = UITableView.new();
        this._ios.registerClassForCellReuseIdentifier(SectionedListViewCell.class(), CELLIDENTIFIER);
        this._ios.autoresizingMask = UIViewAutoresizing.UIViewAutoresizingNone;
        this._ios.estimatedRowHeight = DEFAULT_HEIGHT;
        this._ios.rowHeight = UITableViewAutomaticDimension;
        this._ios.dataSource = this._dataSource = SectionedDataSource.initWithOwner(new WeakRef(this));
        this._delegate = SectionedTableViewDelegateImpl.initWithOwner(new WeakRef(this));
        this._heights = new Array<number>();
        this._map = new Map<SectionedListViewCell, view.View>();
    }

    public onLoaded() {
        super.onLoaded();
        if (this._isDataDirty) {
            this.refresh();
        }
        this._ios.delegate = this._delegate;
    }

    public onUnloaded() {
        this._ios.delegate = null;
        super.onUnloaded();
    }

    get ios(): UITableView {
        return this._ios;
    }

    public scrollToIndexPath(index: number) {
        if (this._ios) {
            this._ios.scrollToRowAtIndexPathAtScrollPositionAnimated(NSIndexPath.indexPathForItemInSection(index, 0),
                UITableViewScrollPosition.UITableViewScrollPositionTop, false);
        }
    }

    public refresh() {
        if (this.isLoaded) {
            this._ios.reloadData();
            this.requestLayout();
            this._isDataDirty = false;
        } else {
            this._isDataDirty = true;
        }
    }

    public getHeight(index: number): number {
        return this._heights[index];
    }

    public setHeight(index: number, value: number): void {
        this._heights[index] = value;
    }

    public _onRowHeightPropertyChanged(data: dependencyObservable.PropertyChangeData) {
        if (data.newValue < 0) {
            this._nativeView.rowHeight = UITableViewAutomaticDimension;
            this._nativeView.estimatedRowHeight = DEFAULT_HEIGHT;
            this._delegate = SectionedTableViewDelegateImpl.initWithOwner(new WeakRef(this));
        }
        else {
            this._nativeView.rowHeight = data.newValue;
            this._nativeView.estimatedRowHeight = data.newValue;
            this._delegate = SectionedUITableViewRowHeightDelegateImpl.initWithOwner(new WeakRef(this));
        }
        if (this.isLoaded) {
            this._nativeView.delegate = this._delegate;
        }
        super._onRowHeightPropertyChanged(data);
    }

    public requestLayout(): void {
        // When preparing cell don't call super - no need to invalidate our measure when cell desiredSize is changed.
        if (!this._preparingCell) {
            super.requestLayout();
        }
    }

    public measure(widthMeasureSpec: number, heightMeasureSpec: number): void {
        this.widthMeasureSpec = widthMeasureSpec;
        var changed = this._setCurrentMeasureSpecs(widthMeasureSpec, heightMeasureSpec);
        super.measure(widthMeasureSpec, heightMeasureSpec);
        if (changed) {
            this._ios.reloadData();
        }
    }

    private _layoutCell(cellView: view.View, indexPath: NSIndexPath): number {

        if (cellView) {
            var measuredSize = view.View.measureChild(this, cellView, this.widthMeasureSpec, infinity);
            var height = measuredSize.measuredHeight;
            this.setHeight(indexPath.row, height);
            return height;
        }

        return 0;
    }

    public _prepareCell(cell: SectionedListViewCell, indexPath: NSIndexPath): number {
        let cellHeight: number;

        try {
            this._preparingCell = true;
            let view : view.View = cell.view;
            if (!view) {
                view = this._getItemTemplateContent(indexPath.row, indexPath.section);
            }

            let args = notifyForItemAtIndex(this, cell, view, ITEMLOADING, indexPath);
            view = args.view || this._getDefaultItemContent(indexPath.row);

            // If cell is reused be have old content - remove it first.
            if (!cell.view) {
                cell.owner = new WeakRef(view);
            }
            else if (cell.view !== view) {
                this._removeContainer(cell);
                (<UIView>cell.view._nativeView).removeFromSuperview();
                cell.owner = new WeakRef(view);
            }

            this._prepareItem(view, indexPath.row, indexPath.section);
            this._map.set(cell, view);
            // We expect that views returned from itemLoading are new (e.g. not reused).
            if (view && !view.parent && view._nativeView) {
                cell.contentView.addSubview(view._nativeView);
                this._addView(view);
            }

            cellHeight = this._layoutCell(view, indexPath);
        }
        finally {
            this._preparingCell = false;
        }
        return cellHeight;
    }
    
    public _prepareHeaderView(headerView: SectionedListViewHeaderView, section: number) : void {
        let view = headerView.view;
        if (!view) {
            view = this._getHeaderTemplateContent(section);
        }
        
        let args = notifyForHeaderAtSection(this, headerView, view, HEADERLOADING, section);
        view = args.view;
        if (!view) {
            let defaultContent = this._getDefaultHeaderContent(section);
            defaultContent.marginLeft = this.ios.separatorInset.left;
            view = defaultContent;
        }
        
        if (!headerView.view) {
            headerView.owner = new WeakRef(view);
        }
        else if (headerView.view !== view) {
            this._removeContainer(headerView);
            (<UIView>headerView.view._nativeView).removeFromSuperview();
            headerView.owner = new WeakRef(view);
        }

        this._prepareHeader(view, section);
        this._map.set(headerView, view);//ignore this warning for now. Rajiv.
        // We expect that views returned from itemLoading are new (e.g. not reused).
        if (view && !view.parent && view._nativeView) {
            headerView.contentView.addSubview(view._nativeView);
            this._addView(view);
        }
    }

    public _removeContainer(cell: SectionedListViewCell): void {
        this._removeView(cell.view)
        this._map.delete(cell);
    }
    
    public _getDefaultHeaderContent(row: number, section:number = 0): view.View {
        var lbl = new Label();
        let formattedString = new FormattedString();
        let span = new Span();
        span.fontSize = 16;
        span.bind({
            targetProperty: "text",
            sourceProperty: "$value"
        });
        span.fontAttributes = FontAttributes.Bold;
        formattedString.spans.push(span);
        lbl.formattedText = formattedString;
        return lbl;
    }
}
