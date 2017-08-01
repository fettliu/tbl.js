﻿/* copyright fyter
    2017/1/8
    version 0.1beta
    website:http://fyter.cn, http://loonglang.com
    This is javascript implement of table that based div.
    Designed for Microsoft Edge / Google Chrome.

    modify:
        2017/8/1 clear innerHTML and set className before drow row.

    main features:
        not a number center.
        data bind.
        search and filter.
        paging.
        max length and scroll.
        full table edit, full row edit. text, boolean, enum, date, number, email, etc.
        single select, multiple select.

    doc:
        dom struct:
            [title]
                [title text] [search]
            [header]
                [field] * n
            [body] or [nothing]
                [row] * n
                    [cell] * n
            [footer]
                [info] [paging]

        api:
            new tbl([dom], [option])          create tbl. dom is html container node. option is tbl propertys.
            tbl::add(array|string)                push data to tail.
            tbl::insert(array|string, pos)     insert data to index position. if pos is undefined, insert to top.
            tbl::bind([[],...])                         bind data.
            tbl::delete(index)                      delete from index position.
            tbl::clear()                                init as new tbl.
            tbl::get_related_rowid(dom)     get row index from dom node in tbl/row/cell.
            tbl::edit([index])                         enable edit of row, or edit full table.
            tbl::cancel_edit(index)             cancel edit of row.
            tbl::select(index)                      select row.
            tbl::cancel_select(index)           cancel select row.
            tbl::select_change(func)           set select changed event. function(tbl){event.source is tbl}

            readonly property:
                tbl::selects                                get array of selected row indexes.
                tbl::data                                   get related data of tbl.
                tbl::dom                                    get dom node of tbl.
                tbl::edits                                  get array of edit row indexes.

            option:
                max_height                          max height.
                page_size                             page size. default 0 for no paging.
                data                                      bind data.
                header                                  whether show header.
                footer                                   whether show footer. include info and paging.
                info                                       whether show info of table.
                paging                                  whether show paging bar.
                title                                       whether show title bar. include title text and search box.
                caption                                 title text.
                search                                   whether show search box.
                editable                                enable full table edit.
                select                                    valid value:0, can't select. 1, single select. 2, multiple select.
                select_change                      select changed event.
                must_select                          select at least one.
                format                                  column format.
                    width                                column width. example:  100px or 20%.
                    input                                 use as edit. same as html/input.
                    name                                column name of header.
                    uneditable                        switch off column edit.
                    editable                            column editable always. first than uneditable.
                    nancenter                         not a number center.
                    element                            html element.
        tip:
            select and edit can be cross page.

    warning:
        input[type=radio] can't cross tbl with same name in same form or no form.
        search would lost row edit state.

    example(need include tbl.js):
        example 1 use exist div node and init data:
            html:<html><body><div></div></body></html>
            new tbl(document.body.children[0],{data:[["row1"],["row2"]]});

        example 2 use DOM node and bind data:
            var tb = new tbl();
            with (document.body) { insertBefore(tb.dom, firstChild) };
            tb.bind([["row1"],["row2"]]);

        example 3 multple field:
            var tb = new tbl(undefined, {format:[{width:"20%"},{width:"20%"},{width:"20%"},{width:"20%"},{width:"20%"}]});
            with (document.body) { insertBefore(tb.dom, firstChild) };
            tb.bind([["row1","data","data","data","data"],["row2","data","data","data","data"]]);

        example 4 list style, no header, no search, no title, no footer, no paging bar. delete row, button in row, nancenter:
            html:<html><body><div></div></body></html>
            var tb = new tbl(document.body.children[0], {
            editable: false, max_height: "300px", header: false, title: false, footer: false, data: [[1], [2, "remove"], ["nan - not a number", "del"], [4, "del"], [5, "del"]], page_size: 100,
            format: [
                { width: "90%", nancenter: true, input: {type:"text"}},
                { width: "10%", editable:true, input: { type: "button", value:"del", onclick: function () { tb.delete(tb.get_related_rowid(this));}}}
            ]
        });

        example 5 paging, full table edit, multiple field:
            var tb_data = [];
            for (var i = 0; i < 106; i++) {
                tb_data[i] = [Math.random()>0.5?true:false, Math.random(), "1970-01-01", Math.floor(Math.random()*10), i, 0];
            }
            tb_data[i] = "this is group"; i++;
            tb_data[i] = ["this is text"]; i++;
            for (; i < 578; i++) {
                tb_data[i] = [i, Math.random(), "2017-02-01"];
            }
            var tb = new tbl(document.body.children[0], {
                editable:true,select:tbl.single,must_select:true,paging:true,data:tb_data,page_size:15,
                format: [
                    { width: "5%", input: { type: "checkbox", check: "true" } },
                    { width: "30%", name:"name", uneditable:true },
                    { width: "20%", name:"date", input: { type: "date" } },
                    { width: "10%", name:"select", input: {type:"select", options:[0,1,2,3,4,5,6,7,8,9]} },
                    { width: "20%" },
                    { width: "15%", input: {type:"radio", name:"only"}}
                ]
            });
*/



declare function captureEvents(arg: number): void;

/**
*   DIV表格
*
* @see {@link https://space.loonglang.com/docs/}
*
*/
class tbl {

    static single = 1;
    static multiselect = 2;

    private div: HTMLElement;
    private option: any;
    private header: HTMLDivElement;
    private title: HTMLDivElement;
    private search: HTMLDivElement;
    private body: HTMLDivElement;
    private nothing: HTMLDivElement;
    private footer: HTMLDivElement;
    private info: HTMLDivElement;
    private ph: HTMLDivElement;
    private pp: HTMLDivElement;
    private pn: HTMLDivElement;
    private pe: HTMLDivElement;
    private paging: HTMLDivElement;
    private input_pagenumber: HTMLInputElement;
    private _data: any[][] = [];
    private search_result: any[][] = [];
    private page: number = 0;
    private data_page:number;// for search
    private _selects = [];
    private _edits = [];
    private pages = [];
    private count = 0;

    get data() { return this._data };
    get selects() { return this._selects;}
    get dom() { return this.div;}
    get edits() { return this._edits;}
    /**
    *   DIV表格
    *
    *   @param div HTML DIV节点
    *   @param option 选项，请参考文档
    */
    constructor(div?: HTMLElement | string, option?: any) {
        if(!div)this.div = document.createElement("div");
        else if (typeof div == "string") if (div[0] != '#') throw Error("argument error."); else this.div = document.getElementById(div.substr(1));
        else this.div = <HTMLElement>div;
        if (!option) option = {};// else option = JSON.parse(JSON.stringify(option));// clone(slow but simple)
        if (option.data) this._data = option.data;
        this.page = option.page ? option.page : 0;
        if (!option.format) {
            option.format = [{ width: "100%" }]; option.header = false;
        }
        this.option = option;
        delete this.option.data;
        if (!option.page_size) option.page_size = 0;
        if (option.info == undefined) option.info = true;
        if (option.footer == undefined) if (option.format.length > 1) option.footer = true; else option.footer = false;
        if (option.header == undefined) if (option.format.length > 1) option.header = true; else option.header = false;
        if (option.title == undefined) option.title = true;
        if (option.paging == undefined) option.paging = true;
        if (option.search == undefined) option.search = true;
        if (option.select == undefined) option.select = 0;// 0 for disable select, 1 for single select, 2 for multiple select
        this.init();
    }
    private load_style() {
        for (let s in document.styleSheets) {
            var styles = document.styleSheets[s];
            if (styles.title == "tbl_style" || (styles.href && styles.href.lastIndexOf("tbl.css") != -1)) return;
        }
        var style = document.createElement("style");
        style.setAttribute("type", "text/css");
        style.title = "tbl_style";
        var css = "\
.tbl_title{background-color:black;border-top:1px solid black;border-left:1px solid black;border-right:1px solid black;box-sizing:border-box;padding:5px;}\
.tbl_titletext{color:white;font-weight:bold;float:left}\
.tbl_search{color:black;float:right;height:20px;overflow:hidden;}\
.tbl_search input{float:left;border:0px;background-color:white;height:20px;}\
.tbl_search button{float:right;border:0px;height:20px;}\
.tbl_header{color:white;background-color:#666666;border-top:1px solid black;border-left:1px solid black;border-right:1px solid black;box-sizing:border-box;padding:5px;overflow:hidden}\
.tbl_header_field{float:left;text-overflow:ellipsis;overflow:hidden;min-height:1px}\
.tbl_body{color:black;background-color:white;border-top:1px solid black;border-left:1px solid black;border-right:1px solid black;}\
.tbl_footer{background-color:gray;border-bottom:1px solid black;border-left:1px solid black;border-right:1px solid black;box-sizing:border-box;padding:3px;}\
.tbl_info{color:white;float:left;font-size:-1pt;}\
.tbl_paging{color:black;float:right;height:20px;overflow:hidden;display:table}\
.tbl_paging div{float:left;vertical-align:middle;background-color:#dddddd;width:20px;height:20px;line-height:20px;text-align:center;cursor:default}\
.tbl_paging div:hover{background-color:#eeeeee;}\
.tbl_paging div:active{background-color:#ffffff;}\
.tbl_paging button{height:20px;padding:0px;float:left;border:0px}\
.tbl_paging input{height:20px;padding:0px;width:25px;box-sizing:border-box;border:0px;float:left}\
.tbl_cell{float:left;text-overflow:ellipsis;overflow:hidden;white-space:nowrap;min-height:1px;box-sizing:border-box}\
.tbl_visible{display:normal}\
.tbl_hide{display:none}\
.tbl_row{background-color:#e5e5e5;border-bottom:1px solid black;box-sizing:border-box;overflow:auto;padding:3px;}\
.tbl_rowx{background-color:#f5f5f5;border-bottom:1px solid black;box-sizing:border-box;overflow:auto;padding:3px;}\
.tbl_row_edit{padding:3px!important}\
.tbl_group{font-weight:bold;padding-left:10px!important;background-color:#cccccc!important;color:black!important;}\
.tbl_select{background-color:#999999;color:white;}\
.tbl_over{background-color:#888888;color:white;}\
.tbl_active{background-color:#666666;color:white;}\
.tbl_row_edit div{height:100%}\
.tbl_row_edit div input[type=text]{width:100%;height:100%;box-sizing:border-box;}\
.tbl_row_edit div select{width:100%;height:100%;box-sizing:border-box;}\
.tbl_row_edit div input[type=date]{width:100%;height:100%;box-sizing:border-box;}\
.tbl_row_edit div input[type=number]{width:100%;height:100%;box-sizing:border-box;}\
.tbl_row_edit div input[type=password]{width:100%;height:100%;box-sizing:border-box;}\
.tbl_null{border-bottom:1px solid black;border-top:1px solid black;border-left:1px solid black;border-right:1px solid black;box-sizing:border-box;padding:5px;min-height:30px;}\
";
        if ((<any>style).styleSheet) {
            (<any>style).styleSheet.cssText = css;
        } else {
            var tn = document.createTextNode(css);
            style.appendChild(tn);
        }
        document.head.appendChild(style);
    }
    private tbl_hide(dom) { dom.classList.add("tbl_hide"); }
    private tbl_show(dom) { dom.classList.remove("tbl_hide"); }
    private tidy_info() {
        this.info.textContent = this.count ? ((this.page + 1) + "/" + this.pages.length + " total " + this.count) : "";
        if (this.page > 0) { this.ph.classList.remove("tbl_hide"); this.pp.classList.remove("tbl_hide"); }
        if (this.page < this.pages.length) { this.pn.classList.remove("tbl_hide"); this.pe.classList.remove("tbl_hide"); }
    }
    private set_group(row, title) {
        row.innerHTML = title;
        row.className = "tbl_row tbl_group";
    }
    
    private do_paging() {
        this.pages = [];
        this.count = 0;
        var page: any[] | any = [];
        var curcnt = 0;
        var pointer = this.search_result.length > 0 ? this.search_result : this._data;
        for (let i = 0; i < pointer.length; i++) {
            if (this.option.page_size > 0 && curcnt == this.option.page_size) { page.count = curcnt; this.pages.push(page); page = []; curcnt = 0; }
            if (Array.isArray(this.search_result.length > 0 ? (<any>pointer[i]).data : pointer[i])) { this.count++; curcnt++; }
            page.push(this.search_result.length > 0 ? pointer[i] : { row: i, data: pointer[i] });
        }
        if (page.length > 0) { page.count = curcnt; this.pages.push(page); }
    }
    private remove_select(index) {
        for (let item in this._selects) if (this._selects[item] == index) {
            this._selects.splice(Number(item), 1);
            return true;
        }
    }
    private set_row(row:HTMLDivElement, rdata, colored:boolean) {
        row.innerHTML = "";
        row.className = (this.option.editable || this._edits[(<any>row).tblindex]) ? (colored ? "tbl_row_edit tbl_rowx" : "tbl_row tbl_row_edit") : (colored ? "tbl_rowx" : "tbl_row");
        for (let f in this.option.format) {
            var cell = <any>document.createElement("div");
            cell.className = "tbl_cell";
            var fmt = this.option.format[f];
            if (fmt.width) cell.style.width = fmt.width;
            if (fmt.editable || rdata[f] != undefined && rdata[f] != null) {
                if (fmt.element && rdata[f] instanceof HTMLElement) {
                    cell.appendChild(rdata[f]);
                } else if (fmt.editable || (!fmt.uneditable && (this.option.editable || this._edits[(<any>row).tblindex]))) {
                    var inputattrs = fmt.input, input;
                    if (inputattrs && inputattrs.type && inputattrs.type == "select") {
                        input = document.createElement("select");
                        for (let sel of inputattrs.options) { var op = document.createElement("option"); op.text = sel; op.value = sel; input.add(op) };
                        input.value = rdata[f];
                    } else {
                        input = document.createElement("input");
                        if (!inputattrs) {
                            input.type = "text";
                        } else for (let attr in inputattrs) {
                            input[attr] = inputattrs[attr];
                        }
                        if (inputattrs && inputattrs.type && (inputattrs.type == "checkbox" || inputattrs.type == "radio")) {
                            input.checked = !!rdata[f]; if (inputattrs.type == "radio") { input.tbl = this; if (input.checked) fmt.prev = input; }
                        } else
                            if (rdata[f] != undefined) input.value = rdata[f];
                    }
                    if (inputattrs && inputattrs.type && (inputattrs.type == "checkbox" || inputattrs.type == "radio")) {
                        input.onchange = function () {
                            if (this.type == "radio") {
                                let prev = this.option.format[this.parentNode.tblfield].prev; if (prev) prev.parentNode.parentNode.tblrow[prev.parentNode.tblfield] = false;
                            }
                            this.parentNode.parentNode.tblrow[this.parentNode.tblfield] = this.checked; this.option.format[this.parentNode.tblfield].prev = this;
                        }
                    } else {
                        input.onchange = function () { this.parentNode.parentNode.tblrow[this.parentNode.tblfield] = this.value; }
                    }
                    cell.appendChild(input);
                } else {
                    cell.innerHTML = rdata[f];
                    if (fmt.tip) cell.title = rdata[f];
                }
            }
            if (fmt.nancenter && isNaN(rdata[f])) cell.style.textAlign = "center";
            cell.tblfield = f;
            row.appendChild(cell);
        }
        row.onmouseover = () => { if (this.option.select) row.classList.add("tbl_over"); }
        row.onmouseleave = () => { if (this.option.select) row.classList.remove("tbl_over"); }
        (<any>row).tbl = this;
        row.onclick = ()=>{
            if (this.option.select && !(event.target instanceof HTMLInputElement)) {
                if (this.option.select == 1) {
                    if ((<any>this._selects).last == this && !this.option.must_select) {
                        row.classList.remove("tbl_select");
                        delete (<any>this._selects).last;
                        this._selects = [];
                    } else {
                        if ((<any>this._selects).last) (<any>this._selects).last.classList.remove("tbl_select");
                        this._selects[0] = (<any>row).tblindex;
                        (<any>this._selects).last = row;
                        row.classList.toggle("tbl_select");
                    }
                } else {
                    if (this.remove_select((<any>row).tblindex))
                        row.classList.remove("tbl_select");
                    else {
                        this._selects.push((<any>row).tblindex);
                        row.classList.add("tbl_select");
                    }
                }
                if (this.option.select_change) {
                    (<any>event).source = (<any>row).tbl;
                    (<any>event).row_index = (<any>row).tblindex;
                    this.option.select_change((<any>row).tbl);
                }
            }
        }
        row.onmousedown = ()=>{
            if (this.option.select && !(event.target instanceof HTMLInputElement)) {
                row.classList.add("tbl_active");
                if (captureEvents) {
                    captureEvents((<any>Event).MOUSEUP);
                    (<any>window).tblCaptureObject = row;
                    row.onmouseup = ()=>{
                        (<any>window).tblCaptureObject.classList.remove("tbl_active");
                        delete (<any>window).tblCaptureObject;
                        releaseEvents();
                        row.onmouseup = null;
                    }
                }
            }
        }
        if (!captureEvents) row.onmouseup = ()=>{
            if (this.option.select) (<any>window).tblCaptureObject.classList.remove("tbl_active");
        }
        (<any>row).tblrow = rdata;
    }
    private visible(row) {
        return (row >= this.page * this.option.page_size && row < this.page * this.option.page_size + this.option.page_size);
    }
    private get_row(index) {
        if (this.search_result.length > 0) return;
        if (this.body.children.length == 0) return;
        if ((<any>this.body.firstChild).tblindex > index || (<any>this.body.lastChild).tblindex < index) return;// select only current page's row
        for (let i = 0; i < this.body.children.length; i++) {
            if ((<any>this.body.children[i]).tblindex == index) {
                return this.body.children[i];
            }
        }
    }
    private showpage() {
        var pointer = (<any>this.search_result).searching ? this.search_result : this._data;
        if (pointer.length > 0) {
            this.tbl_show(this.body); this.tbl_hide(this.nothing);
            var pagedata = this.pages[this.page];
            for (let i = this.body.children.length; i < pagedata.length; i++) {
                let row = document.createElement("div");
                row.className = "tbl_row";
                this.body.appendChild(row);
            }
            for (let i = 0, j = false; i < this.body.children.length; i++) {
                if (i > pagedata.length - 1) { this.tbl_hide(this.body.children[i]); continue; }
                let row = this.body.children[i] as any;
                var row_data = pagedata[i].data;
                row.tblindex = pagedata[i].row;
                this.tbl_show(row);
                if (Array.isArray(row_data)) {
                    this.set_row.call(this, row, row_data, j = !j);
                } else if (row_data instanceof Object) {// custom
                    if (row_data.draw && row_data.draw instanceof Function) {
                        row.innerHTML = ""; row.className = j?"tbl_rowx":"tbl_row";
                        row_data.draw.call(row_data, this, row, j);
                    }
                    j = !j;
                } else {// grouping
                    this.set_group(row, row_data); j = false;
                }
                for (let s of this._selects) {
                    if (s == pagedata[i].row) {
                        row.classList.add("tbl_select");
                        if (this.option.select == 1) (<any>this._selects).last = row;
                    }
                }
            }
            this.body.scrollTop = 0;
        } else {
            this.tbl_show(this.nothing); this.tbl_hide(this.body);
        }
        this.tidy_info();
    }
    get_related_rowid (dom:any) {
        if (dom) while (dom.parentNode) if (dom.parentNode.classList.contains("tbl_row") || dom.parentNode.classList.contains("tbl_rowx")) return dom.parentNode.tblindex; else dom = dom.parentNode;
    }
    add (arg:any) {
        this._data.push(arg);
        var effect = false;
        var isarr = Array.isArray(arg);
        if (isarr) this.count++;
        if (this.pages.length == 0) { this.pages.push([]); this.pages[0].count = 0; effect = true; this.tbl_show(this.body); this.tbl_hide(this.nothing); }
        else if (this.option.page_size == 0 || (this.page == this.pages.length - 1 && this.pages[this.page].count < this.option.page_size)) effect = true;
        if (effect) {
            var row;
            if (this.body.children.length <= this.pages[this.page].length) { row = document.createElement("div"); this.body.appendChild(row); }
            else { row = this.body.children[this.pages[this.page].length]; }
            row.tblindex = this._data.length - 1;
            this.tbl_show(row);
            if (isarr) {
                this.set_row.call(this, row, arg, row.previousSibling ? !row.previousSibling.classList.contains("tbl_rowx") : false);
            } else if (arg instanceof Object) {// custom
                if (arg.draw && arg.draw instanceof Function) {
                    var color = row.previousSibling ? !row.previousSibling.classList.contains("tbl_rowx") : false;
                    row.innerHTML = ""; row.className = color ? "tbl_rowx" : "tbl_row";
                    arg.draw.call(arg, this, row, color);
                }
            } else {
                this.set_group(row, arg);
            }
            if (this.option.must_select && this._selects.length == 0) {
                this._selects = [this._data.length - 1]; (<any>this._selects).last = row;
                row.classList.add("tbl_select");
                if (this.option.select_change) { (<any>event).source = this; (<any>event).row_index = row.tblindex; this.option.select_change(this); }
            }
        }
        if ((this.option.page_size != 0 && this.pages[this.pages.length - 1].count >= this.option.page_size)) {
            var t = [{ row: this._data.length - 1, data: arg }]; (<any>t).count = 0; this.pages.push(t);
        } else
            this.pages[this.pages.length - 1].push({ row: this._data.length - 1, data: arg });
        if (isarr) this.pages[this.pages.length - 1].count++;
        this.tidy_info();
        return this;
    }
    insert (arg, index) {
        this._data.splice(index, 0, arg);
        this.do_paging();
        if (this.option.must_select && this._data.length > 0) {
            if (this._selects[0] != undefined) {
                this._selects[0]++;
                if ((<any>this._selects).last && (<any>this._selects).last.nextSibling) (<any>this._selects).last = (<any>this._selects).last.nextSibling;
            }
        } else this._selects = [];
        this.showpage.call(this);
        return this;
    }
    bind (newdata) {
        this._data = newdata;
        if (this.option.must_select && this._data.length > 0) this._selects[0] = 0; else this._selects = [];
        this.search_result = [];
        this.page = 0;
        this.do_paging();
        this.showpage();
        this.tidy_info();
    }
    delete (index) {
        this._data.splice(index, 1);
        delete this._edits[index];
        if (this.option.must_select && this._data.length > 0) {
            if (this._selects[0] == index) this._selects[0] = 0; else if (this._selects[0] > index) { this._selects[0]--; (<any>this._selects).last = (<any>this._selects).last.previousSibling; }
            if ((<any>this._selects).last && (<any>this._selects).last.nextSibling) (<any>this._selects).last = (<any>this._selects).last.nextSibling;
        } else
            this.remove_select.call(this, index);
        this.do_paging();
        this.showpage.call(this);
        return this;
    }
    edit (index) {
        if (index != undefined) {
            this._edits[index] = true;
            var row = this.get_row.call(this, index);
            if (row) this.set_row(row, row.tblrow, row.classList.contains("tbl_row"));
        } else {
            this.option.editable = true;
        }
        return this;
    }
    cancel_edit (index) {
        if (index != undefined) {
            delete this._edits[index];
            var row = this.get_row.call(this, index);
            if (row) this.set_row(row, row.tblrow, row.classList.contains("tbl_row"));
        } else {
            this.option.editable = false;
            this._edits = [];
        }
        return this;
    }
    select (index) {
        if (this.option.select == 0) return;
        this.remove_select.call(this, index);
        this._selects.push(index);
        var row = this.get_row.call(this, index);
        if (row) {
            row.classList.add("tbl_select");
        }
        return this;
    }
    cancel_select (index) {
        if (this.option.select == 0) return;
        this.remove_select.call(this, index);
        var row = this.get_row.call(this, index);
        if (row) {
            row.classList.remove("tbl_select");
        }
        return this;
    }
    clear () {
        this.page = 0;
        this._selects = [];
        this.search_result = [];
        this._data = [];
        for (let i = 0; i < this.body.children.length; i++) this.tbl_hide(this.body.children[i]);
        this.do_paging();
        this.showpage();
        this.tidy_info();
        return this;
    }
    // for custom row
    create_cell () {
        var cell = document.createElement("div");
        cell.className = "tbl_cell";
        return cell;
    }
    private go() {
        var temp = Number(this.input_pagenumber.value) - 1;
        if (temp < 0 || temp > this.pages.length - 1) { this.input_pagenumber.value = String(this.page + 1); return; }
        this.page = temp;
        this.showpage.call(this);
    }
    select_change (func) {
        this.option.select_change = func;
        return this;
    }
    redraw () {
        this.showpage();
    }
    show () {
        this.div.style.display = "block";
    }
    hide () {
        this.div.style.display = "none";
    }
    init () {
        this.div.innerHTML = "";
        this.load_style();
        this.do_paging();
        if (this.option.format && !Array.isArray(this.option.format)) { console.error("option.format is not array"); throw "option.format is not array"; }
        // title
        this.title = document.createElement("div");
        this.title.className = "tbl_title";
        var title_text = document.createElement("div");
        title_text.className = "tbl_titletext";
        title_text.textContent = this.option.caption ? this.option.caption : "";
        this.title.appendChild(title_text);
        this.search = document.createElement("div");
        var input = document.createElement("input");
        input.setAttribute("type", "text");
        (<any>input).tbl = this;
        input.placeholder = "search";
        input.onchange = ()=> {
            this.search_result = [];
            if ((<any>event.target).value) {
                (<any>this.search_result).searching = true;
                for (let i in this._data) {
                    if (Array.isArray(this._data[i])) {
                        for (let f of this._data[i]) if (f.toString().indexOf((<any>event.target).value) > -1) {
                            this.search_result.push(<any>{ row: i, data: this._data[i] }); break;
                        }
                    } else if (this._data[i] instanceof Object) if (this._data[i].toString().indexOf((<any>event.target).value) > -1) {
                        this.search_result.push(<any>{ row: i, data: this._data[i] });
                    }
                }
                this.data_page = this.page; this.page = 0;
            } else
                this.page = this.data_page;
            this.do_paging();
            this.showpage();
        };
        var btn = document.createElement("button");
        btn.textContent = "🔎";
        this.search.className = "tbl_search";
        this.search.appendChild(input);
        //search.appendChild(btn);
        this.title.style.minHeight = "30px";
        this.title.appendChild(this.search);
        this.div.appendChild(this.title);
        // header
        this.header = document.createElement("div");
        this.header.className = "tbl_header";
        for (let item in this.option.format) {
            var field = document.createElement("div");
            field.className = "tbl_header_field";
            field.style.width = this.option.format[item].width;
            if (this.option.format[item].name) field.textContent = this.option.format[item].name;
            this.header.appendChild(field);
        }
        this.div.appendChild(this.header);
        // body
        this.body = document.createElement("div");
        this.body.className = "tbl_body tbl_hide";
        this.div.appendChild(this.body);
        this.nothing = document.createElement("div");
        this.nothing.className = "tbl_null";
        this.nothing.innerHTML = "<center><b>" + (this.option.null ? this.option.null : "no record") + "</b></center>";
        this.div.appendChild(this.nothing);
        // footer
        this.footer = document.createElement("div");
        this.footer.className = "tbl_footer";
        this.info = document.createElement("div");
        this.info.className = "tbl_info";
        this.footer.appendChild(this.info);
        this.paging = document.createElement("div");
        this.paging.className = "tbl_paging";
        this.ph = document.createElement("div");
        this.ph.textContent = "⇤";
        this.ph.onselectstart = ()=>{ return false; }
        (<any>this.ph).tbl = this;
        this.ph.onclick = ()=> { if (this.page != 0) { this.page = 0; this.showpage(); } }
        this.pp = document.createElement("div");
        this.pp.textContent = "«";
        this.pp.onselectstart = ()=>{ return false; }
        (<any>this.pp).tbl = this;
        this.pp.onclick = ()=> { if (this.page > 0) { this.page--; this.showpage(); } }
        this.pn = document.createElement("div");
        this.pn.textContent = "»";
        this.pn.onselectstart = ()=>{ return false; }
        (<any>this.pn).tbl = this;
        (<any>this.pn).onclick = () => { if (this.page < this.pages.length - 1) { this.page++; this.showpage(); } }
        this.pe = document.createElement("div");
        this.pe.textContent = "⇥";
        this.pe.onselectstart = ()=>{ return false; }
        (<any>this.pe).tbl = this;
        this.pe.onclick = () => { if (this.page != this.pages.length - 1) { this.page = this.pages.length - 1; this.showpage(); } }
        if (this.page == 0) { (<any>this.ph).disabled = "disabled"; (<any>this.pp).disabled = true; }
        if (this._data.length <= this.option.page_size) { (<any>this.pn).disabled = "disabled"; (<any>this.pe).disabled = true; }
        this.paging.appendChild(this.ph);
        this.paging.appendChild(this.pp);
        this.paging.appendChild(this.pn);
        this.paging.appendChild(this.pe);
        this.input_pagenumber = document.createElement("input");
        this.input_pagenumber.setAttribute("type", "number");
        this.input_pagenumber.setAttribute("min", "1");
        this.input_pagenumber.onkeypress = (e:KeyboardEvent)=>{ if (e.keyCode == 13) this.go(); }
        this.paging.appendChild(this.input_pagenumber);
        var gobtn = document.createElement("button");
        gobtn.textContent = "GO"; gobtn.onclick = this.go;
        this.paging.appendChild(gobtn);
        this.footer.style.minHeight = "30px";
        this.footer.appendChild(this.paging);
        this.div.appendChild(this.footer);
        if (this.option.max_height) {
            this.body.style.maxHeight = this.option.max_height;
            this.body.style.overflowY = "auto";
        }
        if (!this.option.title) this.tbl_hide(this.title);
        if (!this.option.search) this.tbl_hide(this.search);
        if (!this.option.header) this.tbl_hide(this.header);
        if (!this.option.footer) this.tbl_hide(this.footer);
        if (!this.option.info) this.tbl_hide(this.info);
        if (!this.option.paging) this.tbl_hide(this.paging);
        this.tidy_info();
        if (this.option.must_select && this._data.length > 0) this._selects[0] = 0; else this._selects = [];
        this.showpage();
    }
}