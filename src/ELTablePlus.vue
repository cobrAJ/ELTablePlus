<script>
import "lodash"
// import massData from "@/json/massData2.json"
export default {
  name: "ELTablePlus",
  data () {
    return {
      massData: [],//传入的data数据副本
      tableData: [],//进入表格的数据
      pagination: {
        pageSize: this.$attrs['max-height'] ? Math.ceil(this.$attrs['max-height'] / 500) * 15 : 15,//500px 15条数据
        currentPage: 1,
      },
      massDataTableDom: '',
      lastScrollTop: "",
      lastScrollLeft: "",
      lastSign: "",
      selfMaxHeight: 500,
      selectPageNumChange: false,//阻止多余的selectchange事件触发
      selectionPageMap: [],//已选择的选项
      nextPartData: [],//下一个页面的数据（包括上翻，下翻）
      currentSlotDefault: [],
      needColumnPage: false,
      columnPages: [],
      fixedCols: [],
      colCurrentPage: 1
    }
  },
  watch: {
    "$attrs.data": function (nValue, oValue) {
      this.pagination.currentPage = 1;
      this.dataInit()
    }
  },
  render (h) {
    let finalObj = {};
    if (typeof h != "function") {
      //vue3 代码兼容处理，但是el-table 组件并不兼容
      h = require("vue").h;
      finalObj.attrs = {
        ...this.$attrs,
        'data': this.tableData,
        "max-height": this.$attrs['max-height'] || this.selfMaxHeight,
        "onSelect": this.selfSelect,
        "selectionChange": this.selfSelectionChange
      };
      finalObj.props = { ...this.$props };
    } else {
      finalObj.attrs = { ...this.$attrs, 'data': this.tableData, "max-height": this.$attrs['max-height'] || this.selfMaxHeight };
      finalObj.props = { ...this.$props };
      finalObj.class = {
        'el-table-plus': true, ...this.$class
      };
      finalObj.on = { ...this.$listeners, select: this.selfSelect, "selection-change": this.selfSelectionChange };
    }
    return h("el-table", finalObj, this.currentSlotDefault)
  },
  methods: {
    columnDataSplit () {
      let tmp = _.clone(this.$slots.default);
      let columnMinWidth = 0;
      this.columnPages = [];
      tmp.forEach(col => {
        if (col && col.componentOptions && !col.componentOptions.propsData.fixed) {
          if (col.componentOptions.propsData.width) {
            columnMinWidth += parseFloat(col.componentOptions.propsData.width)
          } else {
            columnMinWidth += 80
          }
          let index = parseInt(columnMinWidth / window.innerWidth);
          this.columnPages[index] ? '' : this.columnPages[index] = [];
          this.columnPages[index].push(col);
        }
      });
    },
    columnRenderCheck () {
      let tmp = _.clone(this.$slots.default);
      let outPutTmp = [];
      let columnMinWidth = 0;
      tmp.forEach(col => {
        if (col && col.componentOptions && col.componentOptions.propsData.fixed) {
          this.fixedCols.push(col);
        } else {
          if (col && col.componentOptions && col.componentOptions.propsData.width) {
            columnMinWidth += parseFloat(col.componentOptions.propsData.width)
          } else {
            columnMinWidth += 80
          }
          // 大于屏幕宽度两倍的列数据不渲染
          if (columnMinWidth < window.innerWidth * 2) {
            outPutTmp.push(col)
          } else {
            this.needColumnPage = true
          }
        }
      });
      if (this.needColumnPage) {
        this.columnDataSplit();
      }
      return this.fixedCols.concat(outPutTmp)
    },
    selfSelect (selected, row) {
      let signIndex = -1;
      this.selectionPageMap.forEach((item, index) => {
        if (item[this.$attrs['row-key']] == row[this.$attrs['row-key']]) {
          signIndex = index;
        }
      });
      if (signIndex == -1) {
        this.selectionPageMap.push(row);
      } else {
        this.selectionPageMap.splice(signIndex, 1);
      }
      // console.log("selectionPageMap:", this.selectionPageMap)
      this.$emit("select", this.selectionPageMap);
    },
    selfSelectionChange () {
      if (!this.selectPageNumChange) {
        this.$emit("selection-change", this.selectionPageMap);
        // console.log("selectionPageMap:", this.selectionPageMap)
      }
      this.selectPageNumChange = false;
    },
    selectionReshow () {
      if (this.selectionPageMap.length > 0) {
        this.nextPartData.forEach(row => {
          this.selectionPageMap.forEach(item => {
            if (item[this.$attrs['row-key']] == row[this.$attrs['row-key']]) {
              this.$refs.elTable.toggleRowSelection(item);
              this.selectPageNumChange = true
            }
          })
        })
      }
    },
    dataSplit (pageNum) {
      let res = this.massData.slice(((pageNum || this.pagination.currentPage) - 1) * this.pagination.pageSize, (pageNum || this.pagination.currentPage) * this.pagination.pageSize);
      return res;
    },
    scrollhandler () {
      // console.log("scrollLeft:", this.massDataTableDom.scrollLeft, "lastScrollLeft:", this.lastScrollLeft);
      let needVerticalFresh = true, needHorizontalFresh = false, sign = this.massDataTableDom.scrollTop > this.lastScrollTop ? 'down'
        : this.massDataTableDom.scrollTop < this.lastScrollTop ? "up" : this.massDataTableDom.scrollLeft > this.lastScrollLeft ? 'right' :
          this.massDataTableDom.scrollLeft < this.lastScrollLeft ? 'left' : this.lastSign;
      // console.log("scrollTop:", this.massDataTableDom.scrollTop, "offsetHeight:", this.massDataTableDom.offsetHeight, "scrollHeight:", this.massDataTableDom.scrollHeight, "sign:", sign);
      if (this.pagination.currentPage > 2 && this.massDataTableDom.scrollTop == 0 && sign == "up") {
        this.pagination.currentPage -= 1;
        this.selectPageNumChange = true;
      } else if (this.massDataTableDom.scrollTop + this.massDataTableDom.offsetHeight >= this.massDataTableDom.scrollHeight && sign == "down" &&
        this.pagination.currentPage <= Math.ceil(this.massData.length / this.pagination.pageSize)) {
        this.pagination.currentPage += 1;
        this.selectPageNumChange = true;
      } else {
        needVerticalFresh = false
        if (this.needColumnPage && sign == "left" && this.massDataTableDom.scrollLeft == 0 && this.colCurrentPage > 1) {
          needHorizontalFresh = true;
          this.colCurrentPage -= 1
        } else if (this.needColumnPage && sign == "right" && this.massDataTableDom.scrollLeft >= (window.innerWidth - 80)) {
          needHorizontalFresh = true;
          this.colCurrentPage += 1
        }
      }
      if (needVerticalFresh) {
        let oldScrollTop = this.massDataTableDom.scrollTop;
        let oldScrollHeight = this.massDataTableDom.scrollHeight;
        if (sign == "up") {
          // console.log(this.pagination.currentPage, ':', this.dataSplit());
          this.nextPartData = this.dataSplit(this.pagination.currentPage - 1);
          this.tableData.splice(0, 0, ...this.nextPartData);
        } else {
          this.nextPartData = this.dataSplit(this.pagination.currentPage);
          this.tableData.splice(this.tableData.length, 0, ...this.nextPartData);
        }
        this.selectionReshow();
        this.$nextTick(() => {
          if (sign == "down") {
            // let scrollData = this.massDataTableDom.scrollTop - oldScrollTop;
            let scrollData = this.massDataTableDom.scrollHeight - oldScrollHeight;
            //有两页数据的缓存，所以要从第三页开始删除多余数据
            if (this.pagination.currentPage > 2) {
              this.tableData.splice(0, this.pagination.pageSize);
            }
            this.massDataTableDom.scrollTop = oldScrollTop - scrollData;
          } else if (sign == "up") {
            if (this.tableData.length > 2 * this.pagination.pageSize) {
              let scrollData = this.massDataTableDom.scrollHeight - oldScrollHeight;
              this.tableData.splice(this.tableData.length - this.pagination.pageSize, this.pagination.pageSize);
              this.massDataTableDom.scrollTop = scrollData;
            }
          }
        })
      }
      if (needHorizontalFresh) {
        this.currentSlotDefault = this.fixedCols.concat(this.columnPages[this.colCurrentPage - 1], this.columnPages[this.colCurrentPage]);
        this.$nextTick(() => {
          if (sign == 'right') {
            this.massDataTableDom.scrollLeft = 0;
          } else if (sign == 'left') {
            this.massDataTableDom.scrollLeft = window.innerWidth - 80;
          }
        })
      }
      this.lastSign = sign;
      this.lastScrollTop = this.massDataTableDom.scrollTop;
      this.lastScrollLeft = this.massDataTableDom.scrollLeft;
    },
    dataInit () {
      this.massData = JSON.parse(JSON.stringify(this.$attrs.data));
      let initData = this.dataSplit(this.pagination.currentPage);
      initData.splice(initData.length, 0, ...this.dataSplit(this.pagination.currentPage + 1));
      this.tableData = initData;
      this.pagination.currentPage += 1
    }
  },
  mounted () {
    this.currentSlotDefault = this.columnRenderCheck(0)
    // console.log("pagination.pageSize:", this.pagination.pageSize)
    if (this.$attrs.data && this.$attrs.data.length > 0) {
      this.dataInit();
    }
    this.massDataTableDom = document.querySelector('.el-table__body-wrapper');
    this.massDataTableDom.onscroll = _.debounce(this.scrollhandler, 200)
  },
}
</script>

<style>
.el-table-plus {
  /* position: absolute; */
  height: 100%;
  width: 100%;
  overflow: auto;
}
</style>