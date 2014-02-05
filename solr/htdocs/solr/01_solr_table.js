// Generated by CoffeeScript 1.5.0
(function() {
  var Source, Table, TableHolder, TableState, _clone_array;

  _clone_array = function(a) {
    return $.extend(true, [], a);
  };

  Source = (function() {

    function Source() {}

    return Source;

  })();

  TableState = (function() {

    function TableState(el, scols) {
      var c, _i, _len,
        _this = this;
      this._filter = [];
      this._order = [];
      this._colkey = {};
      for (_i = 0, _len = scols.length; _i < _len; _i++) {
        c = scols[_i];
        this._colkey[c.key] = c;
      }
      this._sortkey = {};
      this.el = $(el);
      this.el.data('columns', (function() {
        var _j, _len1, _results;
        _results = [];
        for (_j = 0, _len1 = scols.length; _j < _len1; _j++) {
          c = scols[_j];
          _results.push(c.key);
        }
        return _results;
      })());
      this.el.data('pagesize', 10);
      this.el.on('fix_widths', function() {
        var col, columns, i, perc_per_unit, total, units_used, _j, _k, _l, _len1, _len2, _len3, _m, _results;
        columns = _this.el.data('columns');
        for (_j = 0, _len1 = columns.length; _j < _len1; _j++) {
          c = columns[_j];
          if (_this._colkey[c].width === 0) {
            _this._colkey[c].width = 1;
          }
        }
        units_used = 0;
        for (_k = 0, _len2 = columns.length; _k < _len2; _k++) {
          c = columns[_k];
          units_used += _this._colkey[c].width;
        }
        perc_per_unit = 100 / units_used;
        total = 0;
        for (_l = 0, _len3 = columns.length; _l < _len3; _l++) {
          c = columns[_l];
          _this._colkey[c].total = _this._colkey[c].width * perc_per_unit + total;
          total += _this._colkey[c].width * perc_per_unit;
          _this._colkey[c].percent = 0;
        }
        col = 0;
        _results = [];
        for (i = _m = 0; _m <= 99; i = ++_m) {
          if (i > _this._colkey[columns[col]].total && col < columns.length) {
            col++;
          }
          _results.push(_this._colkey[columns[col]].percent++);
        }
        return _results;
      });
    }

    TableState.prototype.e = function() {
      return this.el;
    };

    TableState.prototype._update_sortkey = function() {
      var r, _i, _len, _ref, _results;
      this._sortkey = {};
      _ref = this._order;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        r = _ref[_i];
        _results.push(this._sortkey[r.column] = r.order);
      }
      return _results;
    };

    TableState.prototype.filter = function(f) {
      if (f != null) {
        this._filter = f;
      }
      return this._filter;
    };

    TableState.prototype.columns = function() {
      return this.el.data('columns');
    };

    TableState.prototype.order = function(r) {
      if (r != null) {
        this._order = r;
        this._update_sortkey();
      }
      return this._order;
    };

    TableState.prototype.page = function(p) {
      var _ref;
      if (p != null) {
        this.el.data('page', p);
      }
      return (_ref = this.el.data('page')) != null ? _ref : 1;
    };

    TableState.prototype.pagesize = function() {
      return this.el.data('pagesize');
    };

    TableState.prototype.start = function() {
      return (this.page() - 1) * this.pagesize();
    };

    TableState.prototype.coldata = function() {
      var k, _i, _len, _ref, _results;
      _ref = this.el.data('columns');
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        k = _ref[_i];
        _results.push(this._colkey[k]);
      }
      return _results;
    };

    TableState.prototype.sortkey = function(k) {
      return this._sortkey[k];
    };

    TableState.prototype.associate = function(table) {
      this.table = table;
    };

    return TableState;

  })();

  TableHolder = (function() {

    function TableHolder(templates, source, state, options) {
      this.templates = templates;
      this.source = source;
      this.state = state;
      this.options = options != null ? options : {};
      this.state.associate(this);
      if (this.options.chunk_size == null) {
        this.options.chunk_size = 1000;
      }
    }

    TableHolder.prototype.get_all_data = function() {
      var chunk_loop, num,
        _this = this;
      num = 100;
      chunk_loop = window.then_loop(function(_arg) {
        var acc, halt, start;
        acc = _arg[0], start = _arg[1], halt = _arg[2];
        console.log(acc, start, halt);
        if (halt) {
          return acc;
        } else {
          return _this.get_data(start, num).then(function(data) {
            if ((data.cols != null) && (acc.cols == null)) {
              acc.cols = data.cols;
            }
            if (data.rows.length === 0 || ((_this.max != null) && start + data.rows.length > _this.max)) {
              halt = 1;
            }
            acc.rows = acc.rows.concat(data.rows);
            return [acc, start + data.rows.length, halt];
          });
        }
      });
      return $.Deferred().resolve([
        {
          rows: []
        }, 0, 0
      ]).then(chunk_loop);
    };

    TableHolder.prototype.get_data = function(start, num) {
      return this.source.get(this.state.filter(), this.state.columns(), this.state.order(), start, num, true);
    };

    TableHolder.prototype.transmit_data = function(el, fn, data) {
      var $form, c, r, row, rows, _i, _j, _len, _len1, _ref, _ref1;
      rows = [];
      rows.push(data.cols);
      _ref = data.rows;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        r = _ref[_i];
        row = [];
        _ref1 = data.cols;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          c = _ref1[_j];
          if (c === 'id_with_url') {
            r[c] = r['id'];
          }
          row.push(r[c]);
        }
        rows.push(row);
      }
      $form = $('.t_download_export', el);
      $('.filename', $form).val(fn);
      $('.data', $form).val(JSON.stringify(rows));
      $('.expopts', $form).val(JSON.stringify((function() {
        var _k, _len2, _ref2, _results;
        _ref2 = data.cols;
        _results = [];
        for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
          c = _ref2[_k];
          _results.push({});
        }
        return _results;
      })()));
      return $form.trigger('submit');
    };

    TableHolder.prototype.generate_model = function(extra) {
      var _this = this;
      return {
        table_ready: function(el, data) {
          return _this.collect_view_model(el, data);
        },
        state: this.state,
        download_curpage: function(el, fn) {
          return _this.get_data(_this.state.start(), _this.state.pagesize()).done(function(data) {
            return _this.transmit_data(el, fn, data);
          });
        },
        download_all: function(el, fn) {
          return _this.get_all_data().done(function(data) {
            return _this.transmit_data(el, fn, data);
          });
        }
      };
    };

    TableHolder.prototype.collect_view_model = function(el, data) {
      return this.outer = el;
    };

    TableHolder.prototype.element = function() {
      return this.outer;
    };

    TableHolder.prototype.draw_table = function() {
      var table;
      table = new Table(this);
      return table.render();
    };

    TableHolder.prototype.xxx_table = function() {
      return new Table(this);
    };

    TableHolder.prototype.table_ready = function(html) {
      var d, table;
      d = new $.Deferred();
      table = $('.search_table_proper', this.outer);
      table.empty();
      table.append(html);
      return d.resolve(0);
    };

    TableHolder.prototype.data_actions = function(data) {
      if (this.options.update != null) {
        return this.options.update(this, data);
      }
    };

    return TableHolder;

  })();

  Table = (function() {
    var _idx;

    _idx = 0;

    function Table(holder) {
      var _ref;
      this.holder = holder;
      this.multisort = (_ref = this.holder.options.multisort) != null ? _ref : true;
    }

    Table.prototype.render_head = function(t_data, data, first) {
      var c, dir, state, _i, _len, _ref;
      t_data.headings = {};
      _ref = this.holder.state.coldata();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        c = _ref[_i];
        state = 'off';
        dir = this.holder.state.sortkey(c.key);
        if (dir != null) {
          state = (dir > 0 ? "asc" : "desc");
        }
        if (c.nosort) {
          state = '';
        }
        t_data.headings[c.key] = {
          text: c != null ? c.name : void 0,
          state: state,
          key: c.key,
          dir: dir
        };
      }
      return t_data.first = first;
    };

    Table.prototype.render_row = function(data) {
      this.stripe = !this.stripe;
      return {
        cols: data,
        stripe: this.stripe
      };
    };

    Table.prototype.render_data = function(data, first) {
      var c, r, t_data, t_main, table, widths, _i, _len, _ref;
      t_data = {
        table_row: [],
        rows: [],
        cols: data.cols
      };
      widths = (function() {
        var _i, _len, _ref, _results;
        _ref = this.holder.state.coldata();
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          c = _ref[_i];
          _results.push(c.percent);
        }
        return _results;
      }).call(this);
      t_data.widths = widths;
      this.render_head(t_data, data, first);
      _ref = data.rows;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        r = _ref[_i];
        t_data.rows.push(this.render_row(r));
      }
      t_main = this.holder.templates.generate('chunk', t_data);
      table = this;
      $('.search_table_sorter', t_main).on('click', function(e) {
        var dir, key, order, _j, _len1, _ref1;
        order = [];
        key = $(this).data('key');
        dir = $(this).data('dir');
        if (e.shiftKey && table.multisort) {
          _ref1 = this.holder.state.order();
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            e = _ref1[_j];
            if (e.column !== key) {
              order.push(e);
            }
          }
        }
        order.push({
          column: key,
          order: (dir > 0 ? -1 : 1)
        });
        table.holder.state.order(order);
        table.holder.state.set();
        return false;
      });
      return t_main;
    };

    Table.prototype.render_chunk = function(data, first) {
      var d, outer;
      d = $.Deferred();
      if (first) {
        this.holder.data_actions(data);
      }
      outer = this.render_data(data, first);
      outer.appendTo(this.container);
      return d.resolve(data);
    };

    Table.prototype.reset = function() {
      if (this.container != null) {
        this.container.remove();
      }
      this.container = $('<div/>').addClass('search_table');
      this.stripe = 1;
      return this.empty = 1;
    };

    Table.prototype.draw_top = function() {};

    Table.prototype.draw_rows = function(rows) {
      var d;
      d = this.render_chunk(rows, true);
      if (this.empty) {
        d = d.then(this.holder.table_ready(this.container));
      }
      this.empty = 0;
      return d;
    };

    Table.prototype.draw_bottom = function() {};

    Table.prototype.render = function() {
      var chunk, page, start;
      if (this.container != null) {
        this.container.remove();
      }
      this.container = $('<div/>').addClass('search_table');
      this.stripe = 1;
      start = this.holder.state.start();
      page = this.holder.state.pagesize();
      chunk = this.holder.options.chunk_size;
      return this.get_page(page, start, chunk);
    };

    return Table;

  })();

  window.TableSource = Source;

  window.TableState = TableState;

  window.search_table = TableHolder;

}).call(this);
