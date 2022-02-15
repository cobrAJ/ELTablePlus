# ELTablePlus

## Description

The Component developed based on ElementUI , just add one simple function for `el-table`,
when the table need to face on million & billion datas ， how can let it be more faster. That's what it doing.

## How To Use

Just like how do you use el-table, all the same. Row-key is the attribution what definitely needed, that's all.

## New Addition

Add an new way to load datas. The import data didn't need to loaded in once, you can set a **BufferDataPages** & a **GetMassDataCallback** to let the table automaticly load the next data.**BufferDataPages** means how much loaded pages you want buffered, **GetMassDataCallback** is the load data callback.

### For Example

```html
<ElTablePlus
  ref="testTable"
  :max-height="maxHeight"
  row-key="id"
  :getMassDataCallback="getData"
  :bufferDataPages="10"
>
</ElTablePlus>
```

```javascript
 getData (pageInfo, callback) {
      setTimeout(() => {
        let getData = massData.nodes.slice((pageInfo.currentPage - 1) * pageInfo.pageSize, pageInfo.pageSize * pageInfo.currentPage)
        callback(getData);
      }, 10)
    },
```
