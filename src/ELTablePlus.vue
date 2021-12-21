<script>
// import massData from "@/json/massData2.json"
export default {
  name: "ELTablePlus",
  data () {
    return {
      massData: [],
      tableData: [],
      pagination: {
        pageSize: this.$attrs['max-height'] ? Math.ceil(this.$attrs['max-height'] / 500) * 15 : 15,
        currentPage: 1,
        total: 0
      },
      massDataTableDom: '',
      lastScrollTop: "",
      lastSign: "",
      selfMaxHeight: 500,
      selectPageNumChange: false,//阻止多余的selectchange事件触发
      selectionPageMap: [],//已选择的选项
      nextPartData: []//下一个页面的数据（包括上翻，下翻）
    }
  },
  render (h) {
    return <el-table
      class="el-table-plus"
      ref="elTable"
      {...{ class: this.$class }}
      {...{ attrs: this.$attrs }}
      {...{ props: this.$props }}
      {...{ on: this.$listeners }}
      data={this.tableData}
      max-height={this.$attrs['max-height'] || this.selfMaxHeight}
      vOn:select={this.selfSelect}
      vOn:selection-change={this.selfSelectionChange}
    >
      {...this.$slots.default}
    </el-table >
  },
  methods: {
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
    scrollDebounce (fn, delay, isImmediate) {
      var timer = null;  //初始化timer，作为计时清除依据
      return function () {
        var context = this;  //获取函数所在作用域this
        var args = arguments;  //取得传入参数
        clearTimeout(timer);
        if (isImmediate && timer === null) {
          //时间间隔外立即执行
          fn.apply(context, args);
          timer = 0;
          return;
        }
        timer = setTimeout(function () {
          fn.apply(context, args);
          timer = null;
        }, delay);
      }
    },
    dataSplit (pageNum) {
      return this.massData.slice(((pageNum || this.pagination.currentPage) - 1) * this.pagination.pageSize, (pageNum || this.pagination.currentPage) * this.pagination.pageSize);
    },
    scrollhandler () {
      // console.log("scrollTop:", this.massDataTableDom.scrollTop, "lastScrollTop:", this.lastScrollTop);
      let needFresh = true, sign = this.massDataTableDom.scrollTop > this.lastScrollTop ? 'down'
        : this.massDataTableDom.scrollTop < this.lastScrollTop ? "up" : this.lastSign;
      // console.log("scrollTop:", this.massDataTableDom.scrollTop, "offsetHeight:", this.massDataTableDom.offsetHeight, "scrollHeight:", this.massDataTableDom.scrollHeight, "sign:", sign);
      if (this.pagination.currentPage > 2 && this.massDataTableDom.scrollTop == 0 && sign == "up") {
        this.pagination.currentPage -= 1;
        this.selectPageNumChange = true;
      } else if (this.massDataTableDom.scrollTop + this.massDataTableDom.offsetHeight >= this.massDataTableDom.scrollHeight && sign == "down") {
        this.pagination.currentPage += 1;
        this.selectPageNumChange = true;
      } else {
        needFresh = false
      }
      if (needFresh) {
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
      this.lastSign = sign;
      this.lastScrollTop = this.massDataTableDom.scrollTop;
    }
  },
  mounted () {
    // console.log("pagination.pageSize:", this.pagination.pageSize)
    if (this.$attrs.data && this.$attrs.data.length > 0) {
      this.massData = JSON.parse(JSON.stringify(this.$attrs.data));
      let initData = this.dataSplit(this.pagination.currentPage);
      initData.splice(initData.length, 0, ...this.dataSplit(this.pagination.currentPage + 1));
      this.tableData = initData;
      this.pagination.currentPage += 1
    }
    this.massDataTableDom = document.querySelector('.el-table__body-wrapper');
    this.massDataTableDom.onscroll = this.scrollhandler
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