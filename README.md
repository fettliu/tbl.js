# tbl.js
table implement use div.support list style, single/multiple select, full table or row edit, paging, full table search.

version:
2017/6/24 : Recode by TypeScript. 

# info
  2017/1/8
  version 0.1beta
  website:http://fyter.cn, http://loonglang.com
  This is javascript implement of table that based div.
  Support list style, single/multiple select, full table or row edit, paging, full table search.
  Designed for Microsoft Edge / Google Chrome.

# main features:
     not a number center.
     data bind.
     search and filter.
     paging.
     max length and scroll.
     full table edit, full row edit. text, boolean, enum, date, number, email, etc.
     single select, multiple select.

# doc:
##        dom struct:
     [title]
         [title text] [search]
     [header]
         [field] * n
     [body] or [nothing]
         [row] * n
             [cell] * n
     [footer]
         [info] [paging]

##        api:     new tbl([dom], [option])          create tbl. dom is html container node. option is tbl propertys.
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
     tbl::select_change(func)           set select changed event.

###            readonly property:
     tbl::selects                                get array of selected row indexes.
     tbl::data                                   get related data of tbl.
     tbl::dom                                    get dom node of tbl.
     tbl::edits                                  get array of edit row indexes.

###            option:
     max_height                          max height.
     page_size                             page size. default 0 for no paging.
     data                                      bind data.
     header                                  whether show header.
     footer                                   whether show footer. include info and paging.
     info                                       whether show info of table.
     paging                                  whether show paging bar.
     title                                  whether show title bar. include title text and search box.
     caption                                       title text.
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
##        tip:
     select and edit can be cross page.

#    warning:
     input[type=radio] can't cross tbl with same name in same form or no form.
     search would lost row edit state.

#    example(need include tbl.js):
##        example 1 use exist div node and init data:
     html:<html><body><div></div></body></html>
     new tbl(document.body.children[0],{data:[["row1"],["row2"]]});

##        example 2 use DOM node and bind data:
     var tb = new tbl();
     with (document.body) { insertBefore(tb.dom, firstChild) };
     tb.bind([["row1"],["row2"]]);

##        example 3 multple field:
     var tb = new tbl(undefined, {format:[{width:"20%"},{width:"20%"},{width:"20%"},{width:"20%"},{width:"20%"}]});
     with (document.body) { insertBefore(tb.dom, firstChild) };
     tb.bind([["row1","data","data","data","data"],["row2","data","data","data","data"]]);

##        example 4 list style, no header, no search, no title, no footer, no paging bar. delete row, button in row, nancenter:
     html:<html><body><div></div></body></html>
     var tb = new tbl(document.body.children[0], {
     editable: false, maxheight: "300px", header: false, title: false, footer: false, data: [[1], [2, "remove"], ["nan - not a number", "del"], [4, "del"], [5, "del"]], page_size: 100,
     format: [
         { width: "90%", nancenter: true, input: {type:"text"}},
         { width: "10%", editable:true, input: { type: "button", value:"del", onclick: function () { tb.delete(tb.get_related_rowid(this));}}}
         ]
     });

##        example 5 paging, full table edit, multiple field:
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
