// Generated by CoffeeScript 1.5.0
(function() {
  var Hub, Renderer, Request, SearchTableState, all_requests, code_select, dispatch_all_requests, dispatch_facet_request, dispatch_main_requests, double_trap, each_block, generate_block_list, main_currency, rate_limiter, remote_log, xhr_idx, _clone_array, _clone_object, _kv_copy,
    __slice = [].slice,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  code_select = function() {
    return $('#solr_config').length > 0;
  };

  _kv_copy = function(old) {
    var k, out, v;
    out = {};
    for (k in old) {
      v = old[k];
      out[k] = v;
    }
    return out;
  };

  _clone_array = function(a) {
    return $.extend(true, [], a);
  };

  _clone_object = function(a) {
    return $.extend(true, {}, a);
  };

  Hub = (function() {
    var _params_used, _section_keys, _style_map;

    Hub.prototype._pair = /([^;&=]+)=?([^;&]*)/g;

    Hub.prototype._decode = function(s) {
      return decodeURIComponent(s.replace(/\+/g, " "));
    };

    Hub.prototype._encode = function(s) {
      return encodeURIComponent(s).replace(/\ /g, "+");
    };

    _params_used = {
      q: ['results'],
      page: ['results'],
      perpage: ['results'],
      sort: ['results'],
      species: ['results'],
      facet: ['results', 'species'],
      columns: ['results'],
      style: ['style']
    };

    _section_keys = {
      facet: /^facet_(.*)/,
      fall: /^fall_(.*)/
    };

    _style_map = {
      'standard': ['page', 'fixes', 'table', 'google', 'pedestrian', 'rhs'],
      'table': ['page', 'fixes', 'table', 'pedestrian', 'rhs']
    };

    function Hub(more) {
      var config_url,
        _this = this;
      config_url = "" + ($('#species_path').val()) + "/Ajax/config";
      $.when($.solr_config({
        url: config_url
      }), $.getScript('/pure/pure.js')).done(function() {
        _this.params = {};
        _this.sections = {};
        _this.interest = {};
        _this.first_service = 1;
        _this.source = new Request(_this);
        _this.renderer = new Renderer(_this, _this.source);
        $(window).bind('popstate', (function(e) {
          return _this.service();
        }));
        $(document).ajaxError(function() {
          return _this.fail();
        });
        _this.spin = 0;
        _this.leaving = 0;
        $(window).unload(function() {
          return this.leaving = 1;
        });
        $(document).on('force_state_change', function() {
          return $(document).trigger('state_change', [_this.params]);
        });
        return more(_this);
      });
    }

    Hub.prototype.code_select = function() {
      return code_select;
    };

    Hub.prototype.spin_up = function() {
      if (this.spin === 0) {
        $('.hub_fail').hide();
        $('.hub_spinner').show();
      }
      return this.spin += 1;
    };

    Hub.prototype.spin_down = function() {
      if (this.spin > 0) {
        this.spin -= 1;
      }
      if (this.spin === 0) {
        return $('.hub_spinner').hide();
      }
    };

    Hub.prototype.fail = function() {
      if (this.leaving) {
        return;
      }
      return $('.hub_spinner').hide();
    };

    Hub.prototype.unfail = function() {
      $('.hub_fail').hide();
      if (this.spin) {
        return $('.hub_spinner').show();
      }
    };

    Hub.prototype.register_interest = function(key, fn) {
      var _base, _ref;
      if ((_ref = (_base = this.interest)[key]) == null) {
        _base[key] = [];
      }
      return this.interest[key].push(fn);
    };

    Hub.prototype.activate_interest = function(key, value) {
      var w, _i, _len, _ref, _ref1, _results;
      _ref1 = (_ref = this.interest[key]) != null ? _ref : [];
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        w = _ref1[_i];
        _results.push(w.call(this, key));
      }
      return _results;
    };

    Hub.prototype.render_stage = function(more) {
      this.set_templates(this.layout());
      if (this.useless_browser()) {
        $('#solr_content').addClass('solr_useless_browser');
      }
      return this.renderer.render_stage(more);
    };

    Hub.prototype._add_changed = function(changed, k) {
      var a, _i, _len, _ref;
      if (_params_used[k]) {
        _ref = _params_used[k];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          a = _ref[_i];
          changed[a] = 1;
        }
      }
      return changed[k] = 1;
    };

    Hub.prototype.set_templates = function(style) {
      var k, src;
      this.cstyle = style;
      src = _style_map[style];
      return this.tmpl = new window.Templates((function() {
        var _i, _len, _ref, _results;
        _results = [];
        for (_i = 0, _len = src.length; _i < _len; _i++) {
          k = src[_i];
          _results.push((_ref = window[k + "_templates"]) != null ? _ref : window[k]);
        }
        return _results;
      })());
    };

    Hub.prototype.templates = function() {
      return this.tmpl;
    };

    Hub.prototype.add_implicit_params = function() {
      var any, hub;
      hub = this;
      any = 0;
      $('#solr_context span').each(function() {
        var j;
        j = $(this);
        if (j.text() && (hub.params[this.id] == null)) {
          hub.params[this.id] = j.text();
          any = 1;
        }
        return j.remove();
      });
      return any;
    };

    Hub.prototype.refresh_params = function() {
      var a, b, changed, k, m, match, old_params, old_sections, p, param_source, section, v, x, _ref, _ref1, _ref2;
      changed = {};
      old_params = _kv_copy(this.params);
      old_sections = {};
      for (x in this.sections) {
        old_sections[x] = _kv_copy(this.sections[x]);
      }
      this.params = {};
      this.sections = {};
      this._pair.lastIndex = 0;
      if (window.location.hash.indexOf('=') !== -1) {
        param_source = window.location.hash.substring(1);
      } else {
        param_source = window.location.search.substring(1);
      }
      while (m = this._pair.exec(param_source)) {
        this.params[this._decode(m[1])] = this._decode(m[2]);
      }
      if (this.add_implicit_params()) {
        this.replace_url({});
      }
      this.ddg_style_search();
      for (section in _section_keys) {
        match = _section_keys[section];
        match.lastIndex = 0;
        this.sections[section] = {};
        for (p in this.params) {
          if (m = match.exec(p)) {
            this.sections[section][m[1]] = this.params[p];
          }
        }
      }
      for (k in old_params) {
        v = old_params[k];
        if (this.params[k] !== old_params[k]) {
          this._add_changed(changed, k);
        }
      }
      _ref = this.params;
      for (k in _ref) {
        v = _ref[k];
        if (this.params[k] !== old_params[k]) {
          this._add_changed(changed, k);
        }
      }
      for (section in _section_keys) {
        a = (_ref1 = this.sections[section]) != null ? _ref1 : {};
        b = (_ref2 = old_sections[section]) != null ? _ref2 : {};
        for (k in a) {
          v = a[k];
          if (a[k] !== b[k]) {
            this._add_changed(changed, section);
          }
        }
        for (k in b) {
          v = b[k];
          if (a[k] !== b[k]) {
            this._add_changed(changed, section);
          }
        }
      }
      return changed;
    };

    Hub.prototype.remove_unused_params = function() {
      var changed, k, v, _i, _len, _ref;
      changed = {};
      _ref = ['species', 'idx'];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        k = _ref[_i];
        if (this.params[k] != null) {
          changed[k] = void 0;
        }
      }
      if (((function() {
        var _results;
        _results = [];
        for (k in changed) {
          v = changed[k];
          _results.push(k);
        }
        return _results;
      })()).length) {
        return this.replace_url(changed);
      }
    };

    Hub.prototype.layout = function() {
      var _ref;
      return (_ref = this.params.style) != null ? _ref : 'standard';
    };

    Hub.prototype.query = function() {
      return this.params['q'];
    };

    Hub.prototype.species = function() {
      var _ref;
      return (_ref = this.params['species']) != null ? _ref : '';
    };

    Hub.prototype.sort = function() {
      return this.params['sort'];
    };

    Hub.prototype.page = function() {
      if (this.params['page'] != null) {
        return parseInt(this.params['page']);
      } else {
        return 1;
      }
    };

    Hub.prototype.per_page = function() {
      var _ref;
      return parseInt((_ref = this.params['perpage']) != null ? _ref : $.solr_config('static.ui.per_page'));
    };

    Hub.prototype.fall = function(type) {
      return this.sections['fall'][type] != null;
    };

    Hub.prototype.base = function() {
      return this.config('base')['url'];
    };

    Hub.prototype.columns = function() {
      if (this.params['columns']) {
        return this.params['columns'].split('*');
      } else {
        return $.solr_config('static.ui.columns');
      }
    };

    Hub.prototype.fix_species_url = function(url, actions) {
      var base, main, parts, pos, repl;
      base = '';
      main = url.replace(/^(https?\:\/\/[^/]+)/, (function(g0, g1) {
        base = g1;
        return '';
      }));
      if (main.length === 0 || main.charAt(0) !== '/') {
        return url;
      }
      parts = main.split('/');
      for (pos in actions) {
        repl = actions[pos];
        parts[parseInt(pos) + 1] = repl;
      }
      main = parts.join('/');
      return base + main;
    };

    Hub.prototype.make_url = function(qps) {
      var a, b, url, _ref;
      url = window.location.href.replace(/\?.*$/, "") + "?";
      url += ((function() {
        var _results;
        _results = [];
        for (a in qps) {
          b = qps[a];
          _results.push("" + (this._encode(a)) + "=" + (this._encode(b)));
        }
        return _results;
      }).call(this)).join(';');
      url = this.fix_species_url(url, {
        0: (_ref = qps['facet_species']) != null ? _ref : 'Multi'
      });
      return url;
    };

    Hub.prototype.fake_history = function() {
      return !(window.history && window.history.pushState);
    };

    Hub.prototype.set_hash = function(v) {
      var w;
      w = window.location;
      if (v.length) {
        return w.hash = v;
      } else {
        return w.href = w.href.substr(0, w.href.indexOf('#') + 1);
      }
    };

    Hub.prototype.fake_history_onload = function() {
      if (this.fake_history()) {
        this.set_hash(window.location.search.substring(1));
        if (!(window.location.search.length > 1)) {
          return window.location.search = 'p=1';
        }
      } else if (window.location.href.indexOf('#') !== -1) {
        return this.set_hash('');
      }
    };

    Hub.prototype.update_url = function(changes, service) {
      var k, qps, url, v;
      if (service == null) {
        service = 1;
      }
      qps = _kv_copy(this.params);
      if ((qps.perpage != null) && parseInt(qps.perpage) === 0) {
        qps.perpage = $.solr_config('static.ui.pagesizes')[0];
      }
      for (k in changes) {
        v = changes[k];
        if (v != null) {
          qps[k] = v;
        }
      }
      for (k in changes) {
        v = changes[k];
        if (!v) {
          delete qps[k];
        }
      }
      url = this.make_url(qps);
      if (this.really_useless_browser()) {
        window.location.hash = url.substring(url.indexOf('?') + 1);
      } else {
        if (this.fake_history()) {
          window.location.hash = url.substring(url.indexOf('?') + 1);
        } else {
          window.history.pushState({}, '', url);
        }
      }
      if (service) {
        this.service();
      }
      return url;
    };

    Hub.prototype.replace_url = function(changes) {
      var k, qps, url, v;
      qps = _kv_copy(this.params);
      for (k in changes) {
        v = changes[k];
        if (v != null) {
          qps[k] = v;
        }
      }
      for (k in changes) {
        v = changes[k];
        if (!v) {
          delete qps[k];
        }
      }
      url = this.make_url(qps);
      if (this.really_useless_browser()) {
        window.location.hash = url.substring(url.indexOf('?') + 1);
      } else {
        if (this.fake_history()) {
          window.location.hash = url.substring(url.indexOf('?') + 1);
        } else {
          window.history.replaceState({}, '', url);
        }
      }
      return url;
    };

    Hub.prototype.ajax_url = function() {
      return "" + ($('#species_path').val()) + "/Ajax/search";
    };

    Hub.prototype.sidebar_div = function() {
      return $('#solr_sidebar');
    };

    Hub.prototype.useless_browser = function() {
      if ((document.documentMode != null) && document.documentMode < 9) {
        return true;
      }
      return this.really_useless_browser();
    };

    Hub.prototype.really_useless_browser = function() {
      if ($('body').hasClass('ie67')) {
        return true;
      }
      return false;
    };

    Hub.prototype.configs = {};

    Hub.prototype.config = function(key) {
      var _ref;
      if (this.configs[key] == null) {
        this.configs[key] = $.parseJSON((_ref = $("#solr_config span." + key).text()) != null ? _ref : '{}');
      }
      return this.configs[key];
    };

    Hub.prototype.request = function() {
      return this.source;
    };

    Hub.prototype.current_facets = function() {
      var k, out, v, _ref;
      out = {};
      _ref = this.sections['facet'];
      for (k in _ref) {
        v = _ref[k];
        if (v) {
          out[k] = v;
        }
      }
      return out;
    };

    Hub.prototype.ddg_style_search = function() {
      var code, ddg, key, map, _ref, _results;
      if (this.params.species) {
        delete this.params.species;
        ddg = [];
        this.params.q = this.params.q.replace(/!([a-z]+)/g, function(g0, g1) {
          ddg.push(g1);
          return '';
        });
        _ref = $.solr_config('static.ui.ddg_codes');
        _results = [];
        for (key in _ref) {
          map = _ref[key];
          _results.push((function() {
            var _i, _len, _results1;
            _results1 = [];
            for (_i = 0, _len = ddg.length; _i < _len; _i++) {
              code = ddg[_i];
              if (map[code] != null) {
                _results1.push(this.params[key] = map[code]);
              } else {
                _results1.push(void 0);
              }
            }
            return _results1;
          }).call(this));
        }
        return _results;
      }
    };

    Hub.prototype.service = function() {
      var changed, request,
        _this = this;
      if (this.first_service) {
        if (document.documentMode && document.documentMode < 8) {
          $('body').addClass('ie67');
        }
        this.fake_history_onload();
      }
      changed = this.refresh_params();
      this.ddg_style_search();
      this.remove_unused_params();
      request = this.request();
      if (this.first_service) {
        if (parseInt(this.params.perpage) === 0) {
          this.replace_url({
            perpage: 10
          });
          this.params.perpage = $.solr_config('static.ui.pagesizes')[0];
        }
        this.render_stage(function() {
          return _this.actions(request, changed);
        });
        return this.first_service = 0;
      } else {
        return this.actions(request, changed);
      }
    };

    Hub.prototype.actions = function(request, changed) {
      var k, v;
      if (changed['results']) {
        this.renderer.render_results();
      }
      if (changed['style']) {
        if (this.cstyle !== this.params.style) {
          window.location.href = this.make_url(this.params);
        }
      }
      this.fix_species_search();
      for (k in changed) {
        v = changed[k];
        this.activate_interest(k);
      }
      $(document).trigger('state_change', [this.params]);
      return $(window).scrollTop(0);
    };

    Hub.prototype.fix_species_search = function() {
      var $menu, $spec,
        _this = this;
      if (!$.solr_config('static.ui.topright_fix')) {
        return;
      }
      if (this.params.facet_species) {
        if (!$('.site_menu .ensembl').length) {
          $menu = $('.site_menu');
          $menu.prepend($menu.find('.ensembl_all').clone(true).addClass('ensembl').removeClass('ensembl_all'));
        }
        $spec = $('.site_menu .ensembl');
        return window.sp_names(this.params.facet_species, function(names) {
          var $img, $input;
          $img = $('img', $spec).attr("src", "/i/species/16/" + names.url + ".png");
          $input = $('input', $spec).val("Search " + _this.params.facet_species + "…");
          $spec.empty().append($img).append("Search " + _this.params.facet_species).append($input);
          $spec.trigger('click');
          return $spec.parents('form').attr('action', "/" + _this.params.facet_species + "/psychic");
        });
      } else {
        $('.site_menu .ensembl').remove();
        $('.site_menu .ensembl_all').trigger('click');
        return $('.site_menu').parents('form').attr('action', "/Multi/psychic");
      }
    };

    return Hub;

  })();

  each_block = function(num, fn) {
    var i, requests, _i;
    requests = [];
    for (i = _i = 0; 0 <= num ? _i < num : _i > num; i = 0 <= num ? ++_i : --_i) {
      requests.push(fn(i));
    }
    return $.when.apply($, requests).then(function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return Array.prototype.slice.call(args);
    });
  };

  dispatch_main_requests = function(request, cols, query, start, rows) {
    var extras, favs, ret, rigid,
      _this = this;
    rigid = [];
    favs = $.solr_config('user.favs.species');
    if (favs.length) {
      rigid.push(['species', [favs], 100]);
    }
    extras = generate_block_list(rigid);
    ret = each_block(extras.length, function(i) {
      return request.request_results(query, cols, extras[i], 0, 10).then(function(data) {
        return data.num;
      });
    });
    return ret.then(function(sizes) {
      var i, local_offset, offset, requests, results, rows_left, _i, _ref;
      requests = [];
      offset = 0;
      rows_left = rows;
      for (i = _i = 0, _ref = extras.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        if (start < offset + sizes[i] && start + rows > offset) {
          local_offset = start - offset;
          if (local_offset < 0) {
            local_offset = 0;
          }
          requests.push([local_offset, offset, rows_left]);
          rows_left -= sizes[i] - local_offset;
        } else {
          requests.push([-1, -1, -1]);
        }
        offset += sizes[i];
      }
      results = each_block(extras.length, function(i) {
        if (requests[i][0] !== -1) {
          return request.request_results(query, cols, extras[i], requests[i][0], requests[i][2]);
        }
      });
      return results.then(function(docs_frags) {
        var docs, _j, _ref1, _ref2, _ref3;
        docs = [];
        for (i = _j = 0, _ref1 = docs_frags.length; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
          if (requests[i][0] !== -1) {
            [].splice.apply(docs, [(_ref2 = requests[i][1]), (requests[i][1] + docs_frags[i].num) - _ref2 + 1].concat(_ref3 = docs_frags[i].rows)), _ref3;
          }
        }
        return {
          rows: docs,
          num: offset,
          cols: cols
        };
      });
    });
  };

  dispatch_facet_request = function(request, cols, query, start, rows) {
    var fq, k, params,
      _this = this;
    fq = query.fq.join(' AND ');
    params = {
      q: query.q,
      fq: fq,
      rows: 1,
      'facet.field': (function() {
        var _i, _len, _ref, _results;
        _ref = $.solr_config('static.ui.facets');
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          k = _ref[_i];
          _results.push(k.key);
        }
        return _results;
      })(),
      'facet.mincount': 1,
      facet: true
    };
    return request.raw_ajax(params).then(function(data) {
      var _ref, _ref1;
      return (_ref = data.result) != null ? (_ref1 = _ref.facet_counts) != null ? _ref1.facet_fields : void 0 : void 0;
    });
  };

  generate_block_list = function(rigid) {
    var expand_criteria, remainder_criteria;
    expand_criteria = function(criteria, remainder) {
      var all, boost, h, head, out, r, rec, s, sets, type, _i, _j, _len, _len1, _ref;
      if (criteria.length === 0) {
        return [[]];
      }
      _ref = criteria[0], type = _ref[0], sets = _ref[1], boost = _ref[2];
      head = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = sets.length; _i < _len; _i++) {
          s = sets[_i];
          _results.push([type, false, s, boost]);
        }
        return _results;
      })();
      head.push([type, true, remainder[type]]);
      rec = expand_criteria(criteria.slice(1), remainder);
      all = [];
      for (_i = 0, _len = rec.length; _i < _len; _i++) {
        r = rec[_i];
        for (_j = 0, _len1 = head.length; _j < _len1; _j++) {
          h = head[_j];
          out = _clone_array(r);
          out.push(h);
          all.push(out);
        }
      }
      return all;
    };
    remainder_criteria = function(criteria) {
      var out, s, sets, type, _i, _j, _len, _len1, _ref;
      out = {};
      for (_i = 0, _len = criteria.length; _i < _len; _i++) {
        _ref = criteria[_i], type = _ref[0], sets = _ref[1];
        out[type] = [];
        for (_j = 0, _len1 = sets.length; _j < _len1; _j++) {
          s = sets[_j];
          out[type] = out[type].concat(s);
        }
      }
      return out;
    };
    return expand_criteria(rigid, remainder_criteria(rigid));
  };

  all_requests = {
    main: dispatch_main_requests,
    faceter: dispatch_facet_request
  };

  dispatch_all_requests = function(request, start, rows, cols, filter, order) {
    var all_facets, c, facets, fc, fr, input, k, plugin_actions, plugin_list, q, sort, v, _i, _j, _k, _len, _len1, _len2, _ref,
      _this = this;
    request.abort_ajax();
    all_facets = (function() {
      var _i, _len, _ref, _results;
      _ref = $.solr_config('static.ui.facets');
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        k = _ref[_i];
        _results.push(k.key);
      }
      return _results;
    })();
    facets = {};
    for (_i = 0, _len = filter.length; _i < _len; _i++) {
      fr = filter[_i];
      _ref = fr.columns;
      for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
        c = _ref[_j];
        if (c === 'q') {
          q = fr.value;
        }
        for (_k = 0, _len2 = all_facets.length; _k < _len2; _k++) {
          fc = all_facets[_k];
          if (fc === c) {
            facets[c] = fr.value;
          }
        }
      }
    }
    if (q != null) {
      request.some_query();
    } else {
      request.no_query();
      return $.Deferred().reject();
    }
    if (order.length) {
      sort = order[0].column + " " + (order[0].order > 0 ? 'asc' : 'desc');
    }
    input = {
      q: q,
      rows: rows,
      start: start,
      sort: sort,
      fq: (function() {
        var _results;
        _results = [];
        for (k in facets) {
          v = facets[k];
          _results.push("" + k + ":\"" + v + "\"");
        }
        return _results;
      })(),
      hl: 'true',
      'hl.fl': $.solr_config('static.ui.highlights').join(' '),
      'hl.fragsize': 500
    };
    plugin_list = [];
    plugin_actions = [];
    $.each(all_requests, function(k, v) {
      plugin_list.push(k);
      return plugin_actions.push(v(request, cols, input, start, rows));
    });
    return $.when.apply(this, plugin_actions).then(function() {
      var i, out, results, _l, _ref1;
      results = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      out = {};
      for (i = _l = 0, _ref1 = results.length; 0 <= _ref1 ? _l < _ref1 : _l > _ref1; i = 0 <= _ref1 ? ++_l : --_l) {
        out[plugin_list[i]] = results[i];
      }
      out.main.faceter = out.faceter;
      return out;
    });
  };

  rate_limiter = window.rate_limiter(1000, 2000);

  main_currency = window.ensure_currency();

  xhr_idx = 1;

  Request = (function(_super) {

    __extends(Request, _super);

    function Request(hub) {
      this.hub = hub;
      this.xhrs = {};
    }

    Request.prototype.req_outstanding = function() {
      var k, v;
      return ((function() {
        var _ref, _results;
        _ref = this.xhrs;
        _results = [];
        for (k in _ref) {
          v = _ref[k];
          _results.push(k);
        }
        return _results;
      }).call(this)).length;
    };

    Request.prototype.get = function(filter, cols, order, start, rows, force) {
      var current_filter,
        _this = this;
      if (force) {
        return this.dispatch(filter, cols, order, start, rows).then(function(data) {
          return data.main;
        });
      } else {
        current_filter = main_currency();
        return rate_limiter({
          filter: filter,
          cols: cols,
          order: order,
          start: start,
          rows: rows
        }).then(function(data) {
          filter = data.filter, cols = data.cols, order = data.order, start = data.start, rows = data.rows;
          return _this.dispatch(filter, cols, order, start, rows).then(current_filter).then(function(data) {
            return data.main;
          });
        });
      }
    };

    Request.prototype.dispatch = function(filter, cols, order, start, rows) {
      return dispatch_all_requests(this, start, rows, cols, filter, order);
    };

    Request.prototype.abort_ajax = function() {
      var k, x, _ref;
      _ref = this.xhrs;
      for (k in _ref) {
        x = _ref[k];
        x.abort();
      }
      if (this.req_outstanding()) {
        this.hub.spin_down();
      }
      return this.xhrs = {};
    };

    Request.prototype.raw_ajax = function(params) {
      var idx, xhr,
        _this = this;
      idx = (xhr_idx += 1);
      xhr = $.ajax({
        url: this.hub.ajax_url(),
        data: params,
        traditional: true,
        dataType: 'json'
      });
      this.xhrs[idx] = xhr;
      if (!this.req_outstanding()) {
        this.hub.spin_up();
      }
      xhr.then(function(data) {
        delete _this.xhrs[idx];
        if (!_this.req_outstanding()) {
          _this.hub.spin_down();
        }
        if (data.error) {
          _this.hub.fail();
          $('.searchdown-box').css('display', 'block');
          return $.Deferred().reject().promise();
        } else {
          _this.hub.unfail();
          return data;
        }
      });
      return xhr;
    };

    Request.prototype.substitute_highlighted = function(input, output) {
      var doc, h, snippet, _i, _len, _ref, _ref1, _ref2, _results;
      _ref = output.rows;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        doc = _ref[_i];
        snippet = (_ref1 = input.result) != null ? (_ref2 = _ref1.highlighting) != null ? _ref2[doc.uid] : void 0 : void 0;
        if (snippet != null) {
          _results.push((function() {
            var _j, _len1, _ref3, _results1;
            _ref3 = $.solr_config('static.ui.highlights');
            _results1 = [];
            for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
              h = _ref3[_j];
              if (doc[h] && snippet[h]) {
                _results1.push(doc[h] = snippet[h].join(' ... '));
              } else {
                _results1.push(void 0);
              }
            }
            return _results1;
          })());
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    Request.prototype.request_results = function(params, cols, extra, start, rows) {
      var boost, bq, field, i, input, invert, q, s, str, v, values, x, _i, _j, _len, _len1, _ref,
        _this = this;
      input = _clone_object(params);
      input.start = start;
      input.rows = rows;
      q = [input.q];
      for (_i = 0, _len = extra.length; _i < _len; _i++) {
        _ref = extra[_i], field = _ref[0], invert = _ref[1], values = _ref[2], boost = _ref[3];
        str = ((function() {
          var _j, _len1, _results;
          _results = [];
          for (_j = 0, _len1 = values.length; _j < _len1; _j++) {
            s = values[_j];
            _results.push(field + ':"' + s + '"');
          }
          return _results;
        })()).join(" OR ");
        str = (invert ? "(NOT ( " + str + " ))" : "( " + str + " )");
        input.fq.push(str);
        bq = [];
        if (boost != null) {
          for (i = _j = 0, _len1 = values.length; _j < _len1; i = ++_j) {
            s = values[i];
            v = Math.floor(boost * (values.length - i - 1) / (values.length - 1));
            bq.push(field + ':"' + s + '"' + (v ? "^" + v : ""));
          }
          q.push("( " + bq.join(" OR ") + " )");
        }
      }
      if (q.length > 1) {
        input.q = ((function() {
          var _k, _len2, _results;
          _results = [];
          for (_k = 0, _len2 = q.length; _k < _len2; _k++) {
            x = q[_k];
            _results.push("( " + x + " )");
          }
          return _results;
        })()).join(" AND ");
      }
      return this.raw_ajax(input).then(function(data) {
        var c, d, docs, num, obj, out, table, _k, _l, _len2, _len3, _ref1, _ref2, _ref3, _ref4, _ref5;
        num = (_ref1 = data.result) != null ? (_ref2 = _ref1.response) != null ? _ref2.numFound : void 0 : void 0;
        docs = (_ref3 = data.result) != null ? (_ref4 = _ref3.response) != null ? _ref4.docs : void 0 : void 0;
        table = {
          rows: docs,
          hub: _this.hub
        };
        _this.substitute_highlighted(data, table);
        out = [];
        _ref5 = table.rows;
        for (_k = 0, _len2 = _ref5.length; _k < _len2; _k++) {
          d = _ref5[_k];
          obj = [];
          for (_l = 0, _len3 = cols.length; _l < _len3; _l++) {
            c = cols[_l];
            obj.push(d[c]);
          }
          out.push(obj);
        }
        return {
          docs: out,
          num: num,
          rows: table.rows,
          cols: cols
        };
      });
    };

    Request.prototype.some_query = function() {
      $('.page_some_query').show();
      return $('.page_no_query').hide();
    };

    Request.prototype.no_query = function() {
      $('.page_some_query').hide();
      return $('.page_no_query').show();
    };

    return Request;

  })(window.TableSource);

  Renderer = (function() {

    function Renderer(hub, source) {
      this.hub = hub;
      this.source = source;
    }

    Renderer.prototype.page = function(results) {
      var page;
      page = parseInt(this.hub.page());
      if (page < 1 || page > results.num_pages()) {
        return 1;
      } else {
        return page;
      }
    };

    Renderer.prototype.render_stage = function(more) {
      var main,
        _this = this;
      $('.nav-heading').hide();
      main = $('#solr_content').empty();
      this.state = new SearchTableState(this.hub, $('#solr_content'), $.solr_config('static.ui.all_columns'));
      $(document).data('templates', this.hub.templates());
      this.table = new window.search_table(this.hub.templates(), this.source, this.state, {
        multisort: 0,
        filter_col: 'q',
        chunk_size: 100,
        update: function(table, data) {
          var all_facets, c, facets, fc, fr, k, q, query, _i, _j, _k, _len, _len1, _len2, _ref, _ref1;
          all_facets = (function() {
            var _i, _len, _ref, _results;
            _ref = $.solr_config('static.ui.facets');
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              k = _ref[_i];
              _results.push(k.key);
            }
            return _results;
          })();
          facets = {};
          _ref = _this.state.filter();
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            fr = _ref[_i];
            _ref1 = fr.columns;
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
              c = _ref1[_j];
              if (c === 'q') {
                q = fr.value;
              }
              for (_k = 0, _len2 = all_facets.length; _k < _len2; _k++) {
                fc = all_facets[_k];
                if (fc === c) {
                  facets[c] = fr.value;
                }
              }
            }
          }
          query = {
            q: q,
            facets: facets
          };
          $(document).trigger('first_result', [query, data, _this.state]);
          return $(document).on('update_state', function(e, qps) {
            return _this.hub.update_url(qps);
          });
        }
      });
      this.render_style(main, this.table);
      return more();
    };

    Renderer.prototype.render_results = function() {
      var chunk, page, start;
      this.state.update();
      $('.preview_holder').trigger('preview_close');
      this.t = this.table.xxx_table();
      this.t.reset();
      start = this.table.state.start();
      page = this.table.state.pagesize();
      chunk = this.table.options.chunk_size;
      return this.get_page(page, start, chunk);
    };

    Renderer.prototype.get_page = function(total, start, maxchunksize) {
      var chunk_loop, first,
        _this = this;
      first = true;
      chunk_loop = window.then_loop(function(got) {
        var chunksize;
        if (total - got <= 0) {
          return null;
        }
        chunksize = total - got;
        if (chunksize > maxchunksize) {
          chunksize = maxchunksize;
        }
        return _this.get_data(start + got, chunksize).then(function(data) {
          got += data.rows.length;
          return _this.t.draw_rows(data, first);
        }).then(function(data) {
          first = false;
          return got;
        });
      });
      return $.Deferred().resolve(0).then(chunk_loop);
    };

    Renderer.prototype.get_data = function(start, num) {
      return this.table.source.get(this.table.state.filter(), this.table.state.columns(), this.table.state.order(), start, num);
    };

    Renderer.prototype.render_style = function(root, table) {
      var clayout, page,
        _this = this;
      clayout = this.hub.layout();
      page = {
        layouts: {
          entries: [
            {
              label: 'Standard',
              key: 'standard'
            }, {
              label: 'Table',
              key: 'table'
            }
          ],
          title: 'Layout:',
          select: (function(k) {
            return _this.hub.update_url({
              style: k
            });
          })
        },
        table: table.generate_model()
      };
      this.hub.templates().generate('page', page, function(out) {
        return root.append(out);
      });
      if (page.layouts.set_fn != null) {
        return page.layouts.set_fn(clayout);
      }
    };

    return Renderer;

  })();

  SearchTableState = (function(_super) {

    __extends(SearchTableState, _super);

    function SearchTableState(hub, source, element, columns) {
      this.hub = hub;
      SearchTableState.__super__.constructor.call(this, source, element, columns);
    }

    SearchTableState.prototype.update = function() {
      var dir, filter, k, parts, v, _ref;
      if (this.hub.sort()) {
        parts = this.hub.sort().split('-', 2);
        if (parts[0] === 'asc') {
          dir = 1;
        } else if (parts[0] === 'desc') {
          dir = -1;
        }
        if (dir) {
          this.order([
            {
              column: parts[1],
              order: dir
            }
          ]);
        }
      }
      this.page(this.hub.page());
      this.e().data('pagesize', this.hub.per_page());
      this.e().data('columns', this.hub.columns());
      this.e().trigger('fix_widths');
      filter = [
        {
          columns: ['q'],
          value: this.hub.query()
        }
      ];
      _ref = this.hub.current_facets();
      for (k in _ref) {
        v = _ref[k];
        filter.push({
          columns: [k],
          value: v
        });
      }
      return this.filter(filter);
    };

    SearchTableState.prototype._is_default_cols = function(columns) {
      var count, k, v, _i, _j, _len, _len1, _ref;
      count = {};
      _ref = $.solr_config('static.ui.columns');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        k = _ref[_i];
        count[k] = 1;
      }
      for (_j = 0, _len1 = columns.length; _j < _len1; _j++) {
        k = columns[_j];
        count[k]++;
      }
      for (k in count) {
        v = count[k];
        if (v !== 2) {
          return false;
        }
      }
      return true;
    };

    SearchTableState.prototype._extract_filter = function(col) {
      var c, f, val, _i, _j, _len, _len1, _ref, _ref1;
      _ref = this.filter();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        f = _ref[_i];
        _ref1 = f.columns;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          c = _ref1[_j];
          if (c === col) {
            val = f.value;
          }
        }
      }
      return val;
    };

    SearchTableState.prototype.set = function() {
      var columns, dir, state;
      state = {};
      if (this.order().length) {
        dir = (this.order()[0].order > 0 ? 'asc' : 'desc');
        state.sort = dir + "-" + this.order()[0].column;
      }
      state.page = this.page();
      state.perpage = this.pagesize();
      if (state.perpage !== this.hub.per_page()) {
        state.page = 1;
      }
      columns = this.columns();
      if (this._is_default_cols(columns)) {
        state.columns = '';
      } else {
        state.columns = columns.join("*");
      }
      state.q = this._extract_filter('q');
      return this.hub.update_url(state);
    };

    return SearchTableState;

  })(window.TableState);

  $(function() {
    if (code_select()) {
      return window.hub = new Hub(function(hub) {
        hub.service();
        return $(window).on('statechange', function(e) {
          return hub.service();
        });
      });
    }
  });

  remote_log = function(msg) {
    return $.post('/Ajax/report_error', {
      msg: msg,
      type: 'remote log',
      support: JSON.stringify($.support)
    });
  };

  double_trap = 0;

  window.onerror = function(msg, url, line) {
    if (double_trap) {
      return;
    }
    double_trap = 1;
    $.post('/Ajax/report_error', {
      msg: msg,
      url: url,
      line: line,
      type: 'onerror catch',
      support: JSON.stringify($.support)
    });
    return false;
  };

}).call(this);
