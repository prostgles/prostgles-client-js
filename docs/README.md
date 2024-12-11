## db.tableName.getInfo()
Retrieves the table/view info
```typescript
  (lang?: string): Promise<TableInfo>
  ```
#### Arguments
 - `lang: string` - Language code for i18n data
```typescript
  "en"
```

## db.tableName.getColumns()
Retrieves columns metadata of the table/view
```typescript
  (lang?: string, params?: GetColumnsParams): Promise<ValidatedColumnInfo[]>
  ```
#### Arguments
 - `lang: string` - 
 - `params: GetColumnsParams` - Dynamic/filter based rules allow limit what columns can be updated based on the request data/filter
This allows parameter allows identifying the columns that can be updated based on the request data
   - `rule: "update"` - 
   - `data: AnyObject` - 
   - `filter: AnyObject` - 

## db.tableName.find()
Retrieves a list of matching records from the view/table
```typescript
  (filter?: FullFilter<T, S> | undefined, selectParams?: SelectParams): Promise<GetSelectReturnType<S, P, T, true>>
  ```
#### Arguments
 - `filter: FullFilter<T, S> | undefined` - 
 - `selectParams: SelectParams<T, S>` - 
   - `limit: number | null | undefined` - Max number of rows to return
- If undefined then 1000 will be applied as the default
- On client publish rules can affect this behaviour: cannot request more than the maxLimit (if present)
   - `offset: number` - Number of rows to skip
   - `groupBy: false` - Will group by all non aggregated fields specified in select (or all fields by default)
   - `returnType: "row" | "value" | "values" | "statement" | "statement-no-rls" | "statement-where" | undefined` - Result data structure/type:
- row: the first row as an object
- value: the first value from of first field
- values: array of values from the selected field
- statement: sql statement
- statement-no-rls: sql statement without row level security
- statement-where: sql statement where condition
   - `select: Select<T, S>` - Fields/expressions/linked data to select
- If empty then all fields will be selected
- If "*" then all fields will be selected
- If { field: 0 } then all fields except the specified field will be selected
- If { field: 1 } then only the specified field will be selected
- If { field: { funcName: [args] } } then the field will be selected with the specified function applied
- If { field: { nestedTable: { field: 1 } } } then the field will be selected with the nested table fields
   - `orderBy: OrderBy<S extends DBSchema ? T : void>` - Order by options
- If array then the order will be maintained
   - `having: FullFilter<T, S> | undefined` - Filter applied after any aggregations (group by)

## db.tableName.findOne()
Retrieves a record from the view/table
```typescript
  (filter?: FullFilter<T, S> | undefined, selectParams?: SelectParams): Promise<GetSelectReturnType<S, P, T, false> | undefined>
  ```
#### Arguments
 - `filter: FullFilter<T, S> | undefined` - 
 - `selectParams: SelectParams<T, S>` - 
   - `limit: number | null | undefined` - Max number of rows to return
- If undefined then 1000 will be applied as the default
- On client publish rules can affect this behaviour: cannot request more than the maxLimit (if present)
   - `offset: number` - Number of rows to skip
   - `groupBy: false` - Will group by all non aggregated fields specified in select (or all fields by default)
   - `returnType: "row" | "value" | "values" | "statement" | "statement-no-rls" | "statement-where" | undefined` - Result data structure/type:
- row: the first row as an object
- value: the first value from of first field
- values: array of values from the selected field
- statement: sql statement
- statement-no-rls: sql statement without row level security
- statement-where: sql statement where condition
   - `select: Select<T, S>` - Fields/expressions/linked data to select
- If empty then all fields will be selected
- If "*" then all fields will be selected
- If { field: 0 } then all fields except the specified field will be selected
- If { field: 1 } then only the specified field will be selected
- If { field: { funcName: [args] } } then the field will be selected with the specified function applied
- If { field: { nestedTable: { field: 1 } } } then the field will be selected with the nested table fields
   - `orderBy: OrderBy<S extends DBSchema ? T : void>` - Order by options
- If array then the order will be maintained
   - `having: FullFilter<T, S> | undefined` - Filter applied after any aggregations (group by)

## db.tableName.subscribe()
Retrieves a list of matching records from the view/table and subscribes to changes
```typescript
  (filter: FullFilter, params: SelectParams, onData: (items: GetSelectReturnType<S, P, T, true>) => any, onError?: OnError): Promise<SubscriptionHandler>
  ```
#### Arguments
 - `filter: FullFilter<T, S>` - 
 - `params: SelectParams<T, S>` - 
   - `limit: number | null | undefined` - Max number of rows to return
- If undefined then 1000 will be applied as the default
- On client publish rules can affect this behaviour: cannot request more than the maxLimit (if present)
   - `offset: number` - Number of rows to skip
   - `groupBy: false` - Will group by all non aggregated fields specified in select (or all fields by default)
   - `returnType: "row" | "value" | "values" | "statement" | "statement-no-rls" | "statement-where" | undefined` - Result data structure/type:
- row: the first row as an object
- value: the first value from of first field
- values: array of values from the selected field
- statement: sql statement
- statement-no-rls: sql statement without row level security
- statement-where: sql statement where condition
   - `select: Select<T, S>` - Fields/expressions/linked data to select
- If empty then all fields will be selected
- If "*" then all fields will be selected
- If { field: 0 } then all fields except the specified field will be selected
- If { field: 1 } then only the specified field will be selected
- If { field: { funcName: [args] } } then the field will be selected with the specified function applied
- If { field: { nestedTable: { field: 1 } } } then the field will be selected with the nested table fields
   - `orderBy: OrderBy<S extends DBSchema ? T : void>` - Order by options
- If array then the order will be maintained
   - `having: FullFilter<T, S> | undefined` - Filter applied after any aggregations (group by)
 - `onData: (items: GetSelectReturnType<S, P, T, true>) => any` - 
 - `onError: OnError` - 

## db.tableName.subscribeOne()
Retrieves first matching record from the view/table and subscribes to changes
```typescript
  (filter: FullFilter, params: SelectParams, onData: (item: GetSelectReturnType<S, P, T, false> | undefined) => any, onError?: OnError): Promise<SubscriptionHandler>
  ```
#### Arguments
 - `filter: FullFilter<T, S>` - 
 - `params: SelectParams<T, S>` - 
   - `limit: number | null | undefined` - Max number of rows to return
- If undefined then 1000 will be applied as the default
- On client publish rules can affect this behaviour: cannot request more than the maxLimit (if present)
   - `offset: number` - Number of rows to skip
   - `groupBy: false` - Will group by all non aggregated fields specified in select (or all fields by default)
   - `returnType: "row" | "value" | "values" | "statement" | "statement-no-rls" | "statement-where" | undefined` - Result data structure/type:
- row: the first row as an object
- value: the first value from of first field
- values: array of values from the selected field
- statement: sql statement
- statement-no-rls: sql statement without row level security
- statement-where: sql statement where condition
   - `select: Select<T, S>` - Fields/expressions/linked data to select
- If empty then all fields will be selected
- If "*" then all fields will be selected
- If { field: 0 } then all fields except the specified field will be selected
- If { field: 1 } then only the specified field will be selected
- If { field: { funcName: [args] } } then the field will be selected with the specified function applied
- If { field: { nestedTable: { field: 1 } } } then the field will be selected with the nested table fields
   - `orderBy: OrderBy<S extends DBSchema ? T : void>` - Order by options
- If array then the order will be maintained
   - `having: FullFilter<T, S> | undefined` - Filter applied after any aggregations (group by)
 - `onData: (item: GetSelectReturnType<S, P, T, false> | undefined) => any` - 
 - `onError: OnError` - 

## db.tableName.count()
Returns the number of rows that match the filter
```typescript
  (filter?: FullFilter<T, S> | undefined, selectParams?: SelectParams): Promise<number>
  ```
#### Arguments
 - `filter: FullFilter<T, S> | undefined` - 
 - `selectParams: SelectParams<T, S>` - 
   - `limit: number | null | undefined` - Max number of rows to return
- If undefined then 1000 will be applied as the default
- On client publish rules can affect this behaviour: cannot request more than the maxLimit (if present)
   - `offset: number` - Number of rows to skip
   - `groupBy: false` - Will group by all non aggregated fields specified in select (or all fields by default)
   - `returnType: "row" | "value" | "values" | "statement" | "statement-no-rls" | "statement-where" | undefined` - Result data structure/type:
- row: the first row as an object
- value: the first value from of first field
- values: array of values from the selected field
- statement: sql statement
- statement-no-rls: sql statement without row level security
- statement-where: sql statement where condition
   - `select: Select<T, S>` - Fields/expressions/linked data to select
- If empty then all fields will be selected
- If "*" then all fields will be selected
- If { field: 0 } then all fields except the specified field will be selected
- If { field: 1 } then only the specified field will be selected
- If { field: { funcName: [args] } } then the field will be selected with the specified function applied
- If { field: { nestedTable: { field: 1 } } } then the field will be selected with the nested table fields
   - `orderBy: OrderBy<S extends DBSchema ? T : void>` - Order by options
- If array then the order will be maintained
   - `having: FullFilter<T, S> | undefined` - Filter applied after any aggregations (group by)

## db.tableName.size()
Returns result size in bits
```typescript
  (filter?: FullFilter<T, S> | undefined, selectParams?: SelectParams): Promise<string>
  ```
#### Arguments
 - `filter: FullFilter<T, S> | undefined` - 
 - `selectParams: SelectParams<T, S>` - 
   - `limit: number | null | undefined` - Max number of rows to return
- If undefined then 1000 will be applied as the default
- On client publish rules can affect this behaviour: cannot request more than the maxLimit (if present)
   - `offset: number` - Number of rows to skip
   - `groupBy: false` - Will group by all non aggregated fields specified in select (or all fields by default)
   - `returnType: "row" | "value" | "values" | "statement" | "statement-no-rls" | "statement-where" | undefined` - Result data structure/type:
- row: the first row as an object
- value: the first value from of first field
- values: array of values from the selected field
- statement: sql statement
- statement-no-rls: sql statement without row level security
- statement-where: sql statement where condition
   - `select: Select<T, S>` - Fields/expressions/linked data to select
- If empty then all fields will be selected
- If "*" then all fields will be selected
- If { field: 0 } then all fields except the specified field will be selected
- If { field: 1 } then only the specified field will be selected
- If { field: { funcName: [args] } } then the field will be selected with the specified function applied
- If { field: { nestedTable: { field: 1 } } } then the field will be selected with the nested table fields
   - `orderBy: OrderBy<S extends DBSchema ? T : void>` - Order by options
- If array then the order will be maintained
   - `having: FullFilter<T, S> | undefined` - Filter applied after any aggregations (group by)

## db.tableName.getJoinedTables()

```typescript
  (): string[]
  ```
#### Arguments





## db.tableName.sync()

```typescript
  (basicFilter: EqualityFilter, options: SyncOptions, onChange: (data: SyncDataItem<Required<T>, false>[], delta?: Partial<T>[] | undefined) => any, onError?: (error: any) => void): Promise<{ $unsync: () => void; $upsert: (newData: T[]) => any; getItems: () => T[]; }>
  ```
#### Arguments
 - `basicFilter: EqualityFilter<T>` - Equality filter used for sync
Multiple columns are combined with AND
 - `options: SyncOptions` - 
 - `onChange: (data: SyncDataItem<Required<T>, false>[], delta?: Partial<T>[] | undefined) => any` - 
 - `onError: (error: any) => void` - 

## db.tableName.useSync()
Retrieves rows matching the filter and keeps them in sync
- use { handlesOnData: true } to get optimistic updates method: $update
- any changes to the row using the $update method will be reflected instantly
   to all sync subscribers that were initiated with the same syncOptions
```typescript
  (basicFilter: EqualityFilter, syncOptions: SyncOptions): { data: SyncDataItem<Required<T>>[] | undefined; isLoading: boolean; error?: any; }
  ```
#### Arguments
 - `basicFilter: EqualityFilter<T>` - Equality filter used for sync
Multiple columns are combined with AND
 - `syncOptions: SyncOptions` - 

## db.tableName.syncOne()

```typescript
  (basicFilter: Partial, options: SyncOneOptions, onChange: (data: SyncDataItem<Required<T>, false>, delta?: Partial<T> | undefined) => any, onError?: (error: any) => void): Promise<SingleSyncHandles<T, false>>
  ```
#### Arguments
 - `basicFilter: Partial<T>` - 
 - `options: SyncOneOptions` - 
 - `onChange: (data: SyncDataItem<Required<T>, false>, delta?: Partial<T> | undefined) => any` - 
 - `onError: (error: any) => void` - 

## db.tableName.useSyncOne()
Retrieves the first row matching the filter and keeps it in sync
- use { handlesOnData: true } to get optimistic updates method: $update
- any changes to the row using the $update method will be reflected instantly
   to all sync subscribers that were initiated with the same syncOptions
```typescript
  (basicFilter: EqualityFilter, syncOptions: SyncOneOptions): { data: SyncDataItem<Required<T>> | undefined; isLoading: boolean; error?: any; }
  ```
#### Arguments
 - `basicFilter: EqualityFilter<T>` - Equality filter used for sync
Multiple columns are combined with AND
 - `syncOptions: SyncOneOptions` - 



## db.tableName.useSubscribe()
Retrieves a list of matching records from the view/table and subscribes to changes
```typescript
  (filter?: FullFilter<T, S> | undefined, options?: SubscribeParams): { data: GetSelectReturnType<S, SubParams, T, true> | undefined; error?: any; isLoading: boolean; }
  ```
#### Arguments
 - `filter: FullFilter<T, S> | undefined` - 
 - `options: SubscribeParams<T, S>` - 
   - `limit: number | null | undefined` - Max number of rows to return
- If undefined then 1000 will be applied as the default
- On client publish rules can affect this behaviour: cannot request more than the maxLimit (if present)
   - `offset: number` - Number of rows to skip
   - `groupBy: false` - Will group by all non aggregated fields specified in select (or all fields by default)
   - `returnType: "row" | "value" | "values" | "statement" | "statement-no-rls" | "statement-where" | undefined` - Result data structure/type:
- row: the first row as an object
- value: the first value from of first field
- values: array of values from the selected field
- statement: sql statement
- statement-no-rls: sql statement without row level security
- statement-where: sql statement where condition
   - `select: Select<T, S>` - Fields/expressions/linked data to select
- If empty then all fields will be selected
- If "*" then all fields will be selected
- If { field: 0 } then all fields except the specified field will be selected
- If { field: 1 } then only the specified field will be selected
- If { field: { funcName: [args] } } then the field will be selected with the specified function applied
- If { field: { nestedTable: { field: 1 } } } then the field will be selected with the nested table fields
   - `orderBy: OrderBy<S extends DBSchema ? T : void>` - Order by options
- If array then the order will be maintained
   - `having: FullFilter<T, S> | undefined` - Filter applied after any aggregations (group by)
   - `throttle: number` - If true then the subscription will be throttled to the provided number of milliseconds
   - `throttleOpts: { skipFirst?: boolean | undefined; }` - 

## db.tableName.useSubscribeOne()
Retrieves a matching record from the view/table and subscribes to changes
```typescript
  (filter?: FullFilter<T, S> | undefined, options?: SubscribeParams): { data: GetSelectReturnType<S, SubParams, T, false> | undefined; error?: any; isLoading: boolean; }
  ```
#### Arguments
 - `filter: FullFilter<T, S> | undefined` - 
 - `options: SubscribeParams<T, S>` - 
   - `limit: number | null | undefined` - Max number of rows to return
- If undefined then 1000 will be applied as the default
- On client publish rules can affect this behaviour: cannot request more than the maxLimit (if present)
   - `offset: number` - Number of rows to skip
   - `groupBy: false` - Will group by all non aggregated fields specified in select (or all fields by default)
   - `returnType: "row" | "value" | "values" | "statement" | "statement-no-rls" | "statement-where" | undefined` - Result data structure/type:
- row: the first row as an object
- value: the first value from of first field
- values: array of values from the selected field
- statement: sql statement
- statement-no-rls: sql statement without row level security
- statement-where: sql statement where condition
   - `select: Select<T, S>` - Fields/expressions/linked data to select
- If empty then all fields will be selected
- If "*" then all fields will be selected
- If { field: 0 } then all fields except the specified field will be selected
- If { field: 1 } then only the specified field will be selected
- If { field: { funcName: [args] } } then the field will be selected with the specified function applied
- If { field: { nestedTable: { field: 1 } } } then the field will be selected with the nested table fields
   - `orderBy: OrderBy<S extends DBSchema ? T : void>` - Order by options
- If array then the order will be maintained
   - `having: FullFilter<T, S> | undefined` - Filter applied after any aggregations (group by)
   - `throttle: number` - If true then the subscription will be throttled to the provided number of milliseconds
   - `throttleOpts: { skipFirst?: boolean | undefined; }` - 

## db.tableName.useFind()
Retrieves a list of matching records from the view/table
```typescript
  (filter?: FullFilter<T, S> | undefined, selectParams?: SelectParams): { data: GetSelectReturnType<S, P, T, true> | undefined; isLoading: boolean; error?: any; }
  ```
#### Arguments
 - `filter: FullFilter<T, S> | undefined` - 
 - `selectParams: SelectParams<T, S>` - 
   - `limit: number | null | undefined` - Max number of rows to return
- If undefined then 1000 will be applied as the default
- On client publish rules can affect this behaviour: cannot request more than the maxLimit (if present)
   - `offset: number` - Number of rows to skip
   - `groupBy: false` - Will group by all non aggregated fields specified in select (or all fields by default)
   - `returnType: "row" | "value" | "values" | "statement" | "statement-no-rls" | "statement-where" | undefined` - Result data structure/type:
- row: the first row as an object
- value: the first value from of first field
- values: array of values from the selected field
- statement: sql statement
- statement-no-rls: sql statement without row level security
- statement-where: sql statement where condition
   - `select: Select<T, S>` - Fields/expressions/linked data to select
- If empty then all fields will be selected
- If "*" then all fields will be selected
- If { field: 0 } then all fields except the specified field will be selected
- If { field: 1 } then only the specified field will be selected
- If { field: { funcName: [args] } } then the field will be selected with the specified function applied
- If { field: { nestedTable: { field: 1 } } } then the field will be selected with the nested table fields
   - `orderBy: OrderBy<S extends DBSchema ? T : void>` - Order by options
- If array then the order will be maintained
   - `having: FullFilter<T, S> | undefined` - Filter applied after any aggregations (group by)

## db.tableName.useFindOne()
Retrieves first matching record from the view/table
```typescript
  (filter?: FullFilter<T, S> | undefined, selectParams?: SelectParams): { data: GetSelectReturnType<S, P, T, false> | undefined; isLoading: boolean; error?: any; }
  ```
#### Arguments
 - `filter: FullFilter<T, S> | undefined` - 
 - `selectParams: SelectParams<T, S>` - 
   - `limit: number | null | undefined` - Max number of rows to return
- If undefined then 1000 will be applied as the default
- On client publish rules can affect this behaviour: cannot request more than the maxLimit (if present)
   - `offset: number` - Number of rows to skip
   - `groupBy: false` - Will group by all non aggregated fields specified in select (or all fields by default)
   - `returnType: "row" | "value" | "values" | "statement" | "statement-no-rls" | "statement-where" | undefined` - Result data structure/type:
- row: the first row as an object
- value: the first value from of first field
- values: array of values from the selected field
- statement: sql statement
- statement-no-rls: sql statement without row level security
- statement-where: sql statement where condition
   - `select: Select<T, S>` - Fields/expressions/linked data to select
- If empty then all fields will be selected
- If "*" then all fields will be selected
- If { field: 0 } then all fields except the specified field will be selected
- If { field: 1 } then only the specified field will be selected
- If { field: { funcName: [args] } } then the field will be selected with the specified function applied
- If { field: { nestedTable: { field: 1 } } } then the field will be selected with the nested table fields
   - `orderBy: OrderBy<S extends DBSchema ? T : void>` - Order by options
- If array then the order will be maintained
   - `having: FullFilter<T, S> | undefined` - Filter applied after any aggregations (group by)

## db.tableName.useCount()
Returns the total number of rows matching the filter
```typescript
  (filter?: FullFilter<T, S> | undefined, selectParams?: SelectParams): { data: number | undefined; isLoading: boolean; error?: any; }
  ```
#### Arguments
 - `filter: FullFilter<T, S> | undefined` - 
 - `selectParams: SelectParams<T, S>` - 
   - `limit: number | null | undefined` - Max number of rows to return
- If undefined then 1000 will be applied as the default
- On client publish rules can affect this behaviour: cannot request more than the maxLimit (if present)
   - `offset: number` - Number of rows to skip
   - `groupBy: false` - Will group by all non aggregated fields specified in select (or all fields by default)
   - `returnType: "row" | "value" | "values" | "statement" | "statement-no-rls" | "statement-where" | undefined` - Result data structure/type:
- row: the first row as an object
- value: the first value from of first field
- values: array of values from the selected field
- statement: sql statement
- statement-no-rls: sql statement without row level security
- statement-where: sql statement where condition
   - `select: Select<T, S>` - Fields/expressions/linked data to select
- If empty then all fields will be selected
- If "*" then all fields will be selected
- If { field: 0 } then all fields except the specified field will be selected
- If { field: 1 } then only the specified field will be selected
- If { field: { funcName: [args] } } then the field will be selected with the specified function applied
- If { field: { nestedTable: { field: 1 } } } then the field will be selected with the nested table fields
   - `orderBy: OrderBy<S extends DBSchema ? T : void>` - Order by options
- If array then the order will be maintained
   - `having: FullFilter<T, S> | undefined` - Filter applied after any aggregations (group by)

## db.tableName.useSize()
Returns result size in bits matching the filter and selectParams
```typescript
  (filter?: FullFilter<T, S> | undefined, selectParams?: SelectParams): { data: string | undefined; isLoading: boolean; error?: any; }
  ```
#### Arguments
 - `filter: FullFilter<T, S> | undefined` - 
 - `selectParams: SelectParams<T, S>` - 
   - `limit: number | null | undefined` - Max number of rows to return
- If undefined then 1000 will be applied as the default
- On client publish rules can affect this behaviour: cannot request more than the maxLimit (if present)
   - `offset: number` - Number of rows to skip
   - `groupBy: false` - Will group by all non aggregated fields specified in select (or all fields by default)
   - `returnType: "row" | "value" | "values" | "statement" | "statement-no-rls" | "statement-where" | undefined` - Result data structure/type:
- row: the first row as an object
- value: the first value from of first field
- values: array of values from the selected field
- statement: sql statement
- statement-no-rls: sql statement without row level security
- statement-where: sql statement where condition
   - `select: Select<T, S>` - Fields/expressions/linked data to select
- If empty then all fields will be selected
- If "*" then all fields will be selected
- If { field: 0 } then all fields except the specified field will be selected
- If { field: 1 } then only the specified field will be selected
- If { field: { funcName: [args] } } then the field will be selected with the specified function applied
- If { field: { nestedTable: { field: 1 } } } then the field will be selected with the nested table fields
   - `orderBy: OrderBy<S extends DBSchema ? T : void>` - Order by options
- If array then the order will be maintained
   - `having: FullFilter<T, S> | undefined` - Filter applied after any aggregations (group by)

## db.tableName.update()
Updates a record in the table based on the specified filter criteria
- Use { multi: false } to ensure no more than one row is updated
```typescript
  (filter: FullFilter, newData: Partial, params?: SelectParams): Promise<GetUpdateReturnType<P, T, S> | undefined>
  ```
#### Arguments
 - `filter: FullFilter<T, S>` - 
 - `newData: Partial<UpsertDataToPGCast<T>>` - 
 - `params: SelectParams<T, S>` - 
   - `limit: number | null | undefined` - Max number of rows to return
- If undefined then 1000 will be applied as the default
- On client publish rules can affect this behaviour: cannot request more than the maxLimit (if present)
   - `offset: number` - Number of rows to skip
   - `groupBy: false` - Will group by all non aggregated fields specified in select (or all fields by default)
   - `returnType: "row" | "value" | "values" | "statement" | "statement-no-rls" | "statement-where" | undefined` - Result data structure/type:
- row: the first row as an object
- value: the first value from of first field
- values: array of values from the selected field
- statement: sql statement
- statement-no-rls: sql statement without row level security
- statement-where: sql statement where condition
   - `select: Select<T, S>` - Fields/expressions/linked data to select
- If empty then all fields will be selected
- If "*" then all fields will be selected
- If { field: 0 } then all fields except the specified field will be selected
- If { field: 1 } then only the specified field will be selected
- If { field: { funcName: [args] } } then the field will be selected with the specified function applied
- If { field: { nestedTable: { field: 1 } } } then the field will be selected with the nested table fields
   - `orderBy: OrderBy<S extends DBSchema ? T : void>` - Order by options
- If array then the order will be maintained
   - `having: FullFilter<T, S> | undefined` - Filter applied after any aggregations (group by)

## db.tableName.updateBatch()
Updates multiple records in the table in a batch operation.
- Each item in the `data` array contains a filter and the corresponding data to update.
```typescript
  (data: [FullFilter<T, S>, Partial<UpsertDataToPGCast<T>>][], params?: SelectParams): Promise<void | GetUpdateReturnType<P, T, S>>
  ```
#### Arguments
 - `data: [FullFilter<T, S>, Partial<UpsertDataToPGCast<T>>][]` - 
 - `params: SelectParams<T, S>` - 
   - `limit: number | null | undefined` - Max number of rows to return
- If undefined then 1000 will be applied as the default
- On client publish rules can affect this behaviour: cannot request more than the maxLimit (if present)
   - `offset: number` - Number of rows to skip
   - `groupBy: false` - Will group by all non aggregated fields specified in select (or all fields by default)
   - `returnType: "row" | "value" | "values" | "statement" | "statement-no-rls" | "statement-where" | undefined` - Result data structure/type:
- row: the first row as an object
- value: the first value from of first field
- values: array of values from the selected field
- statement: sql statement
- statement-no-rls: sql statement without row level security
- statement-where: sql statement where condition
   - `select: Select<T, S>` - Fields/expressions/linked data to select
- If empty then all fields will be selected
- If "*" then all fields will be selected
- If { field: 0 } then all fields except the specified field will be selected
- If { field: 1 } then only the specified field will be selected
- If { field: { funcName: [args] } } then the field will be selected with the specified function applied
- If { field: { nestedTable: { field: 1 } } } then the field will be selected with the nested table fields
   - `orderBy: OrderBy<S extends DBSchema ? T : void>` - Order by options
- If array then the order will be maintained
   - `having: FullFilter<T, S> | undefined` - Filter applied after any aggregations (group by)

## db.tableName.insert()
Inserts a new record into the table.
```typescript
  (data: UpsertDataToPGCast | UpsertDataToPGCast<T>[], params?: SelectParams): Promise<GetInsertReturnType<D, P, T, S>>
  ```
#### Arguments
 - `data: InsertData<T>` - 
 - `params: SelectParams<T, S>` - 
   - `limit: number | null | undefined` - Max number of rows to return
- If undefined then 1000 will be applied as the default
- On client publish rules can affect this behaviour: cannot request more than the maxLimit (if present)
   - `offset: number` - Number of rows to skip
   - `groupBy: false` - Will group by all non aggregated fields specified in select (or all fields by default)
   - `returnType: "row" | "value" | "values" | "statement" | "statement-no-rls" | "statement-where" | undefined` - Result data structure/type:
- row: the first row as an object
- value: the first value from of first field
- values: array of values from the selected field
- statement: sql statement
- statement-no-rls: sql statement without row level security
- statement-where: sql statement where condition
   - `select: Select<T, S>` - Fields/expressions/linked data to select
- If empty then all fields will be selected
- If "*" then all fields will be selected
- If { field: 0 } then all fields except the specified field will be selected
- If { field: 1 } then only the specified field will be selected
- If { field: { funcName: [args] } } then the field will be selected with the specified function applied
- If { field: { nestedTable: { field: 1 } } } then the field will be selected with the nested table fields
   - `orderBy: OrderBy<S extends DBSchema ? T : void>` - Order by options
- If array then the order will be maintained
   - `having: FullFilter<T, S> | undefined` - Filter applied after any aggregations (group by)

## db.tableName.upsert()
Inserts or updates a record in the table.
- If a record matching the `filter` exists, it updates the record.
- If no matching record exists, it inserts a new record.
```typescript
  (filter: FullFilter, newData: Partial, params?: SelectParams): Promise<GetUpdateReturnType<P, T, S> | undefined>
  ```
#### Arguments
 - `filter: FullFilter<T, S>` - 
 - `newData: Partial<UpsertDataToPGCast<T>>` - 
 - `params: SelectParams<T, S>` - 
   - `limit: number | null | undefined` - Max number of rows to return
- If undefined then 1000 will be applied as the default
- On client publish rules can affect this behaviour: cannot request more than the maxLimit (if present)
   - `offset: number` - Number of rows to skip
   - `groupBy: false` - Will group by all non aggregated fields specified in select (or all fields by default)
   - `returnType: "row" | "value" | "values" | "statement" | "statement-no-rls" | "statement-where" | undefined` - Result data structure/type:
- row: the first row as an object
- value: the first value from of first field
- values: array of values from the selected field
- statement: sql statement
- statement-no-rls: sql statement without row level security
- statement-where: sql statement where condition
   - `select: Select<T, S>` - Fields/expressions/linked data to select
- If empty then all fields will be selected
- If "*" then all fields will be selected
- If { field: 0 } then all fields except the specified field will be selected
- If { field: 1 } then only the specified field will be selected
- If { field: { funcName: [args] } } then the field will be selected with the specified function applied
- If { field: { nestedTable: { field: 1 } } } then the field will be selected with the nested table fields
   - `orderBy: OrderBy<S extends DBSchema ? T : void>` - Order by options
- If array then the order will be maintained
   - `having: FullFilter<T, S> | undefined` - Filter applied after any aggregations (group by)

## db.tableName.delete()
Deletes records from the table based on the specified filter criteria.
- If no filter is provided, all records may be deleted (use with caution).
```typescript
  (filter?: FullFilter<T, S> | undefined, params?: SelectParams): Promise<GetUpdateReturnType<P, T, S> | undefined>
  ```
#### Arguments
 - `filter: FullFilter<T, S> | undefined` - 
 - `params: SelectParams<T, S>` - 
   - `limit: number | null | undefined` - Max number of rows to return
- If undefined then 1000 will be applied as the default
- On client publish rules can affect this behaviour: cannot request more than the maxLimit (if present)
   - `offset: number` - Number of rows to skip
   - `groupBy: false` - Will group by all non aggregated fields specified in select (or all fields by default)
   - `returnType: "row" | "value" | "values" | "statement" | "statement-no-rls" | "statement-where" | undefined` - Result data structure/type:
- row: the first row as an object
- value: the first value from of first field
- values: array of values from the selected field
- statement: sql statement
- statement-no-rls: sql statement without row level security
- statement-where: sql statement where condition
   - `select: Select<T, S>` - Fields/expressions/linked data to select
- If empty then all fields will be selected
- If "*" then all fields will be selected
- If { field: 0 } then all fields except the specified field will be selected
- If { field: 1 } then only the specified field will be selected
- If { field: { funcName: [args] } } then the field will be selected with the specified function applied
- If { field: { nestedTable: { field: 1 } } } then the field will be selected with the nested table fields
   - `orderBy: OrderBy<S extends DBSchema ? T : void>` - Order by options
- If array then the order will be maintained
   - `having: FullFilter<T, S> | undefined` - Filter applied after any aggregations (group by)