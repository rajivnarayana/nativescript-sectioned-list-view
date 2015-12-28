declare module "observable-sectioned-array" {
    
    import { EventData, Observable } from "data/observable";
    
    /**
     * Event args for "changed" event.
     */
    export interface ChangedData<T> extends EventData {
        /**
         * Change type.
         */
        action: string;

        /**
         * Start row.
         */
        row: number;

        /**
         * Section
         */
        section: number;
        
        /**
         * Removed items.
         */
        removed: Array<T>;

        /**
         * Number of added items.
         */
        addedCount: number;
    }

    export interface GroupedArray<T> {
        
        getNoOfSections() : number;
        
        getNoOfItemsInSection(section: number): number;
        
        getItem(row: number, section: number): T;        
    }
    
    export class ObservableSectionArray<T> extends Observable implements GroupedArray<T> {
        
        /**
         * Construtor to create an ObservableSectionArray with a single section.
         */
        constructor(items: T[], title?: string);
        
        /**
         * Constructor to initialize multiple sections at once.
         */
        constructor(...item:T[]);
        
        /**
         * returns the number of groups (or sections) in this data.
         */
        getNoOfSections() : number;
        
        /**
         * @param section The number of the section. Starts from 0;
         */
        getNoOfItemsInSection(section: number): number;
        
        /**
         * @param section The index of section.
         * @param row The index of element in the section.
         * @return T Object contained at the given location.
         */
        getItem(row: number, section: number): T;        
        
        /**
         * @param section Section index
         * @param row Element index
         * @param item Data to be modified. 
         */
        setItem(row: number, section: number, item: T): void;
        
        /**
         * @return string Stored title of section at given index. 
         */
        getTitle(section: number) : string;
        
        /**
         * Modify the ittle of section at the given index.
         */
        setTitle(section: number, title: string): void;
        
        /**
         * Adds a new section with the given title and elements.
         */
        addSection(title: string, items: T[]);
        
        /**
         * Appends new elements to an array, and returns the new length of the array.
         * @param items New elements of the Array.
         */
        push(items: T[], section?:number): number;
        /**
         * Appends new elements to an array, and returns the new length of the array.
         * @param items New elements of the Array.
         */
        push(section:number, ...items: T[]): number;
                
        /**
         * Performs the specified action for each element in the data.
         * @param callbackfn  A function that accepts up to four arguments. forEach calls the callbackfn function one time for each element in each section of the data. 
         * @param thisArg  An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
         */
        forEach(callbackfn: (value: T, row: number, section: number, array: GroupedArray<T>) => void, thisArg?: any): void;
        
        /**
         * The name of the event fired when data is changed.
         */
        public static changeEvent: string;
        
                /**
         * A basic method signature to hook an event listener (shortcut alias to the addEventListener method).
         * @param eventNames - String corresponding to events (e.g. "propertyChange"). Optionally could be used more events separated by `,` (e.g. "propertyChange", "change"). 
         * @param callback - Callback function which will be executed when event is raised.
         * @param thisArg - An optional parameter which will be used as `this` context for callback execution.
         */
        on(eventNames: string, callback: (data: EventData) => void, thisArg?: any);

        /**
         * Raised when a change occurs.
         */
        on(event: "change", callback: (args: ChangedData<T>) => void, thisArg?: any);
    }
}