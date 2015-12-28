import { ChangeType } from "data/observable-array";
import { Observable } from "data/observable";
import { ObservableSectionArray as IObservableSectionArray, ChangedData, GroupedArray } from "observable-sectioned-array";
export class ObservableSectionArray<T> extends Observable implements IObservableSectionArray<T> {
    
    private _data : Array<Array<T>>;
    private _titles : Array<string>;
    private _addArgs: ChangedData<T> = {
        eventName : ObservableSectionArray.CHANGE,
        object: this,
        action: ChangeType.Add,
        row: null,
        section: null,
        removed: [],
        addedCount: 1
    }
    
    private _deleteArgs: ChangedData<T> = {
        eventName : ObservableSectionArray.CHANGE,
        object: this,
        action: ChangeType.Add,
        row: null,
        section: null,
        removed: null,
        addedCount: 0
    }
    
    public static CHANGE: string = "change";
    
    constructor(items: T[], title:string = "") {
        super();
        this._data = [];
        this._titles = [];
        if(arguments.length > 1 && Array.isArray(items)) {
            this._data.push(items);
            this._titles.push(title);    
        }
    }
    
    getNoOfSections() : number {
        return this._data.length;
    }
    
    getNoOfItemsInSection(section: number): number {
        return this._data[section].length;
    }
    
    getItem(row: number, section: number): T {
        return this._data[section][row];   
    }
    
    setItem(row: number, section: number, item: T): void {
        let oldValue: T = this._data[section][row];
        this._data[section][row] = item;
        this.notify({
            eventName: ObservableSectionArray.CHANGE,
            object: this,
            action: ChangeType.Update,
            row: row,
            section: section,
            removed: [oldValue],
            addedCount: 1
        });
    }
    
    getTitle(section: number): string {
        return this._titles[section];
    }
    
    /**
     * TODO: Add an event type for section title update.
     */
    setTitle(section: number, title: string) {
        let oldValue = this._titles[section];
        this._titles[section] = title;
        this.notify({
            eventName: ObservableSectionArray.CHANGE,
            object: this,
            action: ChangeType.Update,
            row: 0,
            section: section,
            removed: [oldValue],
            addedCount: 1
        });
    }
    
    addSection(title: string, items: T[]) {
        this._titles.push(title);
        this._data.push(items);
        this.notify({
            eventName: ObservableSectionArray.CHANGE,
            object: this,
            action: ChangeType.Add,
            row: 0,//Start row for the change
            section: this._titles.length-1,
            removed: null,
            addedCount: items.length
        });
    }
    
    push(): number {
        let section: number = 0;
        let items: Array<T> = [];
        
        if ( arguments.length >= 1 && Array.isArray(arguments[0])) {
            items = <Array<T>>arguments[0];
            if (arguments.length > 1) {
                section = arguments[1] || section;
            }
        } else if ( arguments.length > 1 && Array.isArray(arguments[1])){
            section = arguments[0] || section;
            items = <Array<T>>arguments[1];
        }
        this._addArgs.row = this._data[section].length;
        this._addArgs.section = section;
        for(let i=0; i<items.length; i++) {
            this._data[section].push(items[i]); 
        }
        
        this._addArgs.addedCount = this._data[section].length - this._addArgs.row;
        this.notify(this._addArgs);
        return this._data[section].length;
    }

    forEach(callbackfn: (value: T, row: number, section: number, array: GroupedArray<T>) => void, thisArg: any = undefined): void {
        for(let section: number = 0; section< this._data.length; section++) {
            for( let row: number= 0; row< this._data[section].length; row++) {
                callbackfn.apply(thisArg, [this._data[section][row], section, row, this]);
            }
        }
    }
}