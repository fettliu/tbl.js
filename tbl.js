/* copyright fyter
    2017/1/8
    version 0.1beta
    website:http://fyter.cn, http://loonglang.com
    This is javascript implement of table that based div.
    Designed for Microsoft Edge / Google Chrome.

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
                    nancenter                             not a number center.
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


function tbl(div, option) {
    var div = div?div:document.createElement("div"), option = option;
    var header, title, search, body, nothing, booter, info, ph, pp, pn, pe, paging, input_pagenumber;
    if (!option) option = {};// else option = JSON.parse(JSON.stringify(option));// clone(slow but simple)
    var data = option.data ? option.data : [];
    var page = option.page ? option.page : 0;
    if (!option.format) option.format = [{ width: "100%" }];
    var data_page;// for search
    var selects = []; var search_result = []; var edits = [];
    var pages = [];
    var count = 0;
    delete option.data;
    Object.defineProperty(this, "selects", { get: function () { return selects; } });
    Object.defineProperty(this, "dom", { get: function () { return div; } });
    Object.defineProperty(this, "data", { get: function () { return data; } });
    Object.defineProperty(this, "edits", { get: function () { return edits; } });
    if (!option.page_size) option.page_size = 0;
    if (option.info==undefined) option.info = true;
    if (option.footer == undefined) if (option.format.length > 1) option.footer = true; else option.footer = false;
    if (option.header == undefined) if (option.format.length > 1) option.header = true; else option.header = false;
    if (option.title == undefined) option.title = true;
    if (option.paging == undefined) option.paging = true;
    if (option.search == undefined) option.search = true;
    if (option.select == undefined) option.select = 0;// 0 for disable select, 1 for single select, 2 for multiple select
    var load_style = function () {
        for (let s in document.styleSheets) {
            var styles = document.styleSheets[s];
            if (styles.title == "tbl_style"|| (styles.href && styles.href.lastIndexOf("tbl.css")!=-1)) return;
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
.tbl_booter{background-color:gray;border-bottom:1px solid black;border-left:1px solid black;border-right:1px solid black;box-sizing:border-box;padding:3px;}\
.tbl_info{color:white;float:left;font-size:-1pt;}\
.tbl_paging{color:black;float:right;height:20px;overflow:hidden;display:table}\
.tbl_paging div{float:left;vertical-align:middle;background-color:#dddddd;width:20px;height:20px;line-height:20px;text-align:center;cursor:default}\
.tbl_paging div:hover{background-color:#eeeeee;}\
.tbl_paging div:active{background-color:#ffffff;}\
.tbl_paging button{height:20px;padding:0px;float:left;border:0px}\
.tbl_paging input{height:20px;padding:0px;width:25px;box-sizing:border-box;border:0px;float:left}\
.tbl_cell{float:left;text-overflow:ellipsis;overflow:hidden;white-space:nowrap}\
.tbl_visible{display:normal}\
.tbl_hide{display:none}\
.tbl_row{background-color:#e5e5e5;border-bottom:1px solid black;box-sizing:border-box;padding:5px;min-height:30px;height:0px;}\
.tbl_rowx{background-color:#f5f5f5;border-bottom:1px solid black;box-sizing:border-box;padding:5px;min-height:30px;height:0px}\.tbl_row_edit{padding:3px!important}\
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
        if (style.styleSheet) {
            style.styleSheet.cssText = css;
        } else {
            var tn = document.createTextNode(css);
            style.appendChild(tn);
        }
        document.head.appendChild(style);
    }
    function tbl_hide(dom){dom.classList.add("tbl_hide");}
    function tbl_show(dom){dom.classList.remove("tbl_hide");}
    function tidy_info() {
        info.textContent = count ? ((page + 1) + "/" + pages.length + " total " + count) : "";
        if (page > 0) { ph.classList.remove("tbl_hide"); pp.classList.remove("tbl_hide");}
        if (page < pages.length) { pn.classList.remove("tbl_hide"); pe.classList.remove("tbl_hide"); }
    }
    function set_group(row, title) {
        row.innerHTML = title;
        row.className = "tbl_row tbl_group";
    }
    function do_paging() {
        pages = [];
        count = 0;
        var page = [];
        var curcnt = 0;
        var pointer = search_result.length>0?search_result:data;
        for (let i = 0; i < pointer.length; i++) {
            if (option.page_size > 0 && curcnt == option.page_size) { page.count = curcnt; pages.push(page); page = []; curcnt = 0; }
            if (Array.isArray(search_result.length>0?pointer[i].data:pointer[i])) { count++; curcnt++; }
            page.push(search_result.length > 0 ? pointer[i] : { row: i, data: pointer[i] });
        }
        if(page.length > 0){page.count=curcnt; pages.push(page);}
    }
    function remove_select(index) {
        for (let item in selects)if (selects[item] == index) {
            selects.splice(item, 1);
            return true;
        }
    }
    function set_row(row, rdata, colored) {
        row.innerHTML = "";
        row.className = (option.editable|| edits[row.tblindex])?(colored?"tbl_row_edit tbl_rowx":"tbl_row tbl_row_edit"):(colored?"tbl_rowx":"tbl_row");
        for (let f in option.format) {
            var cell = document.createElement("div");
            cell.className = "tbl_cell";
            var fmt = option.format[f];
            if (fmt.width) cell.style.width = fmt.width;
            if (fmt.editable || rdata[f] != undefined && rdata[f] != null) {
                if (fmt.editable || (!fmt.uneditable && (option.editable || edits[row.tblindex]))) {
                    var inputattrs = fmt.input, input;
                    if (inputattrs && inputattrs.type && inputattrs.type == "select") {
                        input = document.createElement("select");
                        for(let sel of inputattrs.options) { var op = document.createElement("option");op.text=sel; op.value = sel; input.add(op) };
                        input.value = rdata[f];
                    } else {
                        input = document.createElement("input");
                        if (!inputattrs) {
                            input.type = "text";
                        } else for (let attr in inputattrs) {
                            input[attr] = inputattrs[attr];
                        }
                        if (inputattrs && inputattrs.type && (inputattrs.type == "checkbox" || inputattrs.type == "radio")) {
                            input.checked = !!rdata[f]; if (inputattrs.type == "radio"){input.tbl=this;if(input.checked)fmt.prev = input;}
                        } else
                            if(rdata[f]!=undefined)input.value = rdata[f];
                    }
                    if (inputattrs && inputattrs.type && (inputattrs.type == "checkbox" || inputattrs.type == "radio")) {
                        input.onchange = function () {
                            if (this.type == "radio") {
                                let prev = option.format[this.parentNode.tblfield].prev; if (prev) prev.parentNode.parentNode.tblrow[prev.parentNode.tblfield] = false;
                            }
                            this.parentNode.parentNode.tblrow[this.parentNode.tblfield] = this.checked; option.format[this.parentNode.tblfield].prev = this;
                        }
                    } else {
                        input.onchange = function () { this.parentNode.parentNode.tblrow[this.parentNode.tblfield] = this.value; }
                    }
                    cell.appendChild(input);
                } else {
                    cell.innerHTML = rdata[f];
                }
            }
            if (fmt.nancenter && isNaN(rdata[f])) cell.style.textAlign = "center";
            cell.tblfield = f;
            row.appendChild(cell);
        }
        row.onmouseover = function () {if(option.select)this.classList.add("tbl_over");}
        row.onmouseleave = function () { if (option.select) this.classList.remove("tbl_over"); }
        row.tbl = this;
        row.onclick = function () {
            if (option.select && !(event.target instanceof HTMLInputElement)) {
                if (option.select == 1) {
                    if (selects.last == this && !option.must_select) {
                        this.classList.remove("tbl_select");
                        delete selects.last;
                        selects = [];
                    } else {
                        if (selects.last) selects.last.classList.remove("tbl_select");
                        selects[0] = this.tblindex;
                        selects.last = this;
                        this.classList.toggle("tbl_select");
                    }
                } else {
                    if(remove_select(this.tblindex))
                        this.classList.remove("tbl_select");
                    else{
                        selects.push(this.tblindex);
                        this.classList.add("tbl_select");
                    }
                }
                if (option.select_change) { event.source = this.tbl; event.row_index = this.tblindex; option.select_change(this.tbl); }
            }
        }
        row.onmousedown = function () {
            if (option.select && !(event.target instanceof HTMLInputElement)) {
                this.classList.add("tbl_active");
                if (captureEvents) {
                    captureEvents(Event.MOUSEUP);
                    captureObject = this;
                    onmouseup = function () {
                        this.captureObject.classList.remove("tbl_active");
                        delete this.captureObject;
                        releaseEvents();
                        this.onmouseup = null;
                    }
                }
            }
        }
        if (!captureEvents) row.onmouseup = function () {
            if(option.select) this.captureObject.classList.remove("tbl_active");
        }
        row.tblrow = rdata;
    }
    function visible(row) {
        return (row >= page * option.page_size && row < page * option.page_size + option.page_size);
    }
    function get_row(index) {
        if (search_result.length > 0) return;
        if (body.children.length == 0) return;
        if (body.firstChild.tblindex > index || body.lastChild.tblindex < index) return;// select only current page's row
        for (let i = 0; i < body.children.length; i++) {
            if (body.children[i].tblindex == index) {
                return body.children[i];
            }
        }
    }
    function showpage() {
        var pointer = search_result.searching?search_result:data;
        if (pointer.length > 0) {
            tbl_show(body); tbl_hide(nothing);
            var pagedata = pages[page];
            for (let i = body.children.length; i < pagedata.length; i++) {
                var row = document.createElement("div");
                row.className = "tbl_row";
                body.appendChild(row);
            }
            for (let i = 0, j = false; i < body.children.length; i++) {
                if (i > pagedata.length - 1) { tbl_hide(body.children[i]); continue; }
                var row = body.children[i]; row.tblindex = pagedata[i].row;
                if (!Array.isArray(pagedata[i].data)) {// grouping
                    set_group(row, pagedata[i].data); j = false;
                }
                else
                    set_row.call(this, row, pagedata[i].data, j = !j);
                for(let s of selects) {
                    if (s == pagedata[i].row) {
                        row.classList.add("tbl_select");
                        if (option.select == 1) selects.last = row;
                    }
                }
            }
            body.scrollTop = 0;
        } else {
            tbl_show(nothing); tbl_hide(body);
        }
        tidy_info();
    }
    this.get_related_rowid = function (dom) {
        if (dom) while (dom.parentNode) if (dom.parentNode.classList.contains("tbl_row") || dom.parentNode.classList.contains("tbl_rowx")) return dom.parentNode.tblindex; else dom = dom.parentNode;
    }
    this.add = function (arg) {
        data.push(arg);
        var effect = false;
        var isarr = Array.isArray(arg);
        if (isarr) count++;
        if (pages.length == 0) { pages.push([]); pages[0].count = 0; effect = true; tbl_show(body);tbl_hide(nothing);}
        else if (option.page_size == 0 || (page == pages.length - 1 && pages[page].count < option.page_size)) effect = true;
        if(effect){
            var row;
            if (body.children.length <= pages[page].length) { row = document.createElement("div"); body.appendChild(row); }
            else { row = body.children[pages[page].length]; }
            row.tblindex = data.length-1;
            if (isarr) {
                set_row.call(this, row, arg, row.previousSibling?!row.previousSibling.classList.contains("tbl_rowx"):false);
            } else
                set_group(row, arg);
        }
        if ((option.page_size !=0 && pages[pages.length - 1].count >= option.page_size)) {
            var t = [{ row: data.length - 1, data:arg}]; t.count = 0; pages.push(t);
        } else
            pages[pages.length - 1].push({row:data.length-1, data:arg });
        if (isarr) pages[pages.length - 1].count++;
        tidy_info();
        return this;
    }
    this.insert = function (arg, index) {
        data.splice(index, 0, arg);
        do_paging();
        if (option.must_select && data.length > 0) {
            if (selects[0] != undefined) {
                selects[0]++;
                if (selects.last && selects.last.nextSibling) selects.last = selects.last.nextSibling;
            }
        } else selects = [];
        showpage.call(this);
        return this;
    }
    this.bind = function (newdata) {
        data = newdata;
        if (option.must_select && data.length > 0) selects[0] = 0; else selects = [];
        search_result = [];
        page = 0;
        do_paging();
        showpage();
        tidy_info();
    }
    this.delete = function (index) {
        data.splice(index, 1);
        delete edits[index];
        if (option.must_select && data.length > 0) {
            if (selects[0] == index) selects[0] = 0; else if (selects[0] > index) { selects[0]--; selects.last = selects.last.previousSibling; }
            if (selects.last && selects.last.nextSibling) selects.last = selects.last.nextSibling;
        } else
            remove_select.call(this, index);
        do_paging();
        showpage.call(this);
        return this;
    }
    this.edit = function (index) {
        if (index != undefined) {
            edits[index] = true;
            var row = get_row.call(this, index);
            if (row)set_row(row, row.tblrow, row.classList.contains("tbl_row"));
        } else {
            option.editable = true;
        }
        return this;
    }
    this.cancel_edit = function (index) {
        if (index != undefined) {
            delete edits[index];
            var row = get_row.call(this, index);
            if (row)set_row(row, row.tblrow, row.classList.contains("tbl_row"));
        } else {
            option.editable = false;
            edits = [];
        }
        return this;
    }
    this.select = function (index) {
        if (option.select == 0) return;
        remove_select.call(this, index);
        selects.push(index);
        var row = get_row.call(this, index);
        if (row) {
            row.classList.add("tbl_select");
        }
        return this;
    }
    this.cancel_select = function (index) {
        if (option.select == 0) return;
        remove_select.call(this, index);
        var row = get_row.call(this, index);
        if (row) {
            row.classList.remove("tbl_select");
        }
        return this;
    }
    this.clear = function () {
        page = 0;
        selects = [];
        search_result = [];
        data = [];
        for (let i = 0; i < body.children.length;i++) tbl_hide(body.children[i]);
        do_paging();
        showpage();
        tidy_info();
        return this;
    }
    function go() {
        var temp = Number.parseInt(input_pagenumber.value) - 1;
        if (temp < 0 || temp > pages.length - 1) { input_pagenumber.value = page + 1; return; }
        page = temp;
        showpage.call(this);
    }
    this.select_change = function(func){
        option.select_change = func;
        return this;
    }
    this.init = function () {
        div.innerHTML = "";
        load_style();
        do_paging();
        if (option.format && !Array.isArray(option.format)) { console.error("option.format is not array"); throw "option.format is not array"; }
        // title
        title = document.createElement("div");
        title.className = "tbl_title";
        var title_text = document.createElement("div");
        title_text.className = "tbl_titletext";
        title_text.textContent = option.caption ? option.caption : "";
        title.appendChild(title_text);
        search = document.createElement("div");
        var input = document.createElement("input");
        input.setAttribute("type", "text");
        input.tbl = this;
        input.placeholder = "search";
        input.onchange = function () {
            search_result = [];
            if (this.value) {
                search_result.searching = true;
                for (let i in data) if (Array.isArray(data[i])) for(let f of data[i]) if (f.toString().indexOf(this.value) > -1) {
                search_result.push({ row: i, data: data[i] }); break;
            }
                data_page = page; page = 0;
            } else
                page = data_page;
            do_paging.call(this.tbl);
            showpage.call(this.tbl);
        };
        var btn = document.createElement("button");
        btn.textContent = "🔎";
        search.className = "tbl_search";
        search.appendChild(input);
        //search.appendChild(btn);
        title.style.minHeight = "30px";
        title.appendChild(search);
        div.appendChild(title);
        // header
        header = document.createElement("div");
        header.className = "tbl_header";
        for (let item in option.format) {
            var field = document.createElement("div");
            field.className = "tbl_header_field";
            field.style.width = option.format[item].width;
            if (option.format[item].name) field.textContent = option.format[item].name;
            header.appendChild(field);
        }
        div.appendChild(header);
        // body
        body = document.createElement("div");
        body.className = "tbl_body tbl_hide";
        div.appendChild(body);
        nothing = document.createElement("div");
        nothing.className = "tbl_null";
        nothing.innerHTML = "<center><b>" + (option.null ? option.null : "no record") + "</b></center>";
        div.appendChild(nothing);
        // footer
        footer = document.createElement("div");
        footer.className = "tbl_booter";
        info = document.createElement("div");
        info.className = "tbl_info";
        footer.appendChild(info);
        paging = document.createElement("div");
        paging.className = "tbl_paging";
        ph = document.createElement("div");
        ph.textContent = "⇤";
        ph.onselectstart = function () { return false; }
        ph.tbl = this;
        ph.onclick = function () { if (page != 0) { page = 0; showpage.call(this.tbl); } }
        pp = document.createElement("div");
        pp.textContent = "«";
        pp.onselectstart = function () { return false; }
        pp.tbl = this;
        pp.onclick = function () { if (page > 0) { page--; showpage.call(this.tbl); } }
        pn = document.createElement("div");
        pn.textContent = "»";
        pn.onselectstart = function () { return false; }
        pn.tbl = this;
        pn.onclick = function () { if (page < pages.length - 1) { page++; showpage.call(this.tbl); } }
        pe= document.createElement("div");
        pe.textContent = "⇥";
        pe.onselectstart = function () { return false; }
        pe.tbl = this;
        pe.onclick = function () { if (page != pages.length - 1) { page = pages.length - 1; showpage.call(this.tbl); } }
        if (page == 0) { ph.disabled = "disabled"; pp.disabled = true; }
        if(data.length <= option.page_size) { pn.disabled = "disabled"; pe.disabled = true; }
        paging.appendChild(ph);
        paging.appendChild(pp);
        paging.appendChild(pn);
        paging.appendChild(pe);
        input_pagenumber = document.createElement("input");
        input_pagenumber.setAttribute("type", "number");
        input_pagenumber.setAttribute("min", 1);
        input_pagenumber.onkeypress = function (e) {if (e.keyCode == 13) go();}
        paging.appendChild(input_pagenumber);
        var gobtn = document.createElement("button");
        gobtn.textContent = "GO"; gobtn.onclick = go;
        paging.appendChild(gobtn);
        footer.style.minHeight = "30px";
        footer.appendChild(paging);
        div.appendChild(footer);
        if (option.max_height) {
            body.style.maxHeight = option.max_height;
            body.style.overflowY = "auto";
        }
        if (!option.title) tbl_hide(title);
        if (!option.search) tbl_hide(search);
        if (!option.header) tbl_hide(header);
        if (!option.footer) tbl_hide(footer);
        if (!option.info) tbl_hide(info);
        if (!option.paging) tbl_hide(paging);
        tidy_info();
        if (option.must_select && data.length > 0) selects[0] = 0; else selects = [];
        showpage.call(this);
    }
    this.init();
}

tbl.single = 1;
tbl.multiselect = 2;