/* 
  --------------------------------------------
  User Interface (UI) Helper Library
  --------------------------------------------
  @author Justin Robert Evans
  @version 0.0.1
  
  Implements functionality for HTML5 elements, Client-Side GUI components, Client-Side
  Database Interface, Form extensions, etc.
  
  05/07/2015

  --------------------------------------------
  Base Modules:
  --------------------------------------------
  Forms - DOM/UX/UI/LocalStorage Functionality 
  --------------------------------------------
  DB  - To be implemented - Adapters and
        interfaces for Web SQL, IndexedDB and
        "localStorage" for support browers.

  --------------------------------------------
  Requirements (TODO: Define in Module Deps):
  --------------------------------------------
  * jQuery      v 1.10.2
  * Typeahead   v 0.10.5
  * Handlebars  v 3.0.1
  * TinyMCE     v 4.0.5
*/

/* UI Module */

var UI = (function($, H, t, B) 
{
  'use strict';

  /**
   * Merge two objects (generally configurations) together, overriding items from
   * the first to the second (if not in second, add to second)
   *
   * @this {function}
   * @return {object} Final, merged object
   */
  var _mergeObjects = function( cust, obj )
  {
    cust = cust || {};
    obj  = obj  || {};

    for(var opt in cust)
    {
      if( typeof cust[opt]  === 'object' )
        _mergeObjects(obj[opt], obj[opt]);
      else
        obj[opt] = cust[opt];
    }
    return obj;
  };

  /* Private Form Object */

  var _Forms = {};

  /**
   * Creates instance of _Forms.state
   * 
   * @constructor
   * @this {_Forms}
   * @param {$object} $form jQuery-Extended "form"
   * @param {string} key  
  */
  _Forms.state = function( $form, key )
  {
    this.$form = $form;
    this.key = key;
    this.data = {};
  };

  /** 
   * Set key "key" = string containing serialized Form Values 
   *
   * @this {_Forms.state}
   * @return {array} [Returns array of objects]
  */
  _Forms.state.prototype.set = function()
  {
    this.data = this.$form.serializeArray();

    localStorage.setItem(this.key, JSON.stringify(this.data));

    return this.data;
  };

  /** 
   * Get key "key" from localStorage (object of serialized Form Values)
   * 
   * @return {array} JSON Data representing Serialized Form
   */
  _Forms.state.prototype.get = function()
  {
    /* TODO: Update to check data integrity before retrieving - newest first */
    return JSON.parse(localStorage.getItem(this.key));
  };

  /**
   * Syncronize form stored in "_Forms.state" instance with data in "localStorage"
   *
   * @return {object} Returns the $form modified from "sync"
   */
  _Forms.state.prototype.sync = function()
  {
    /* TODO: Update to check data integrity before retrieving - newest first */
    var _data = this.get();

    for(var i=0; i<_data.length;++i)
    {
      this.$form[0][_data[i].name].value = _data[i].value;
    }

    return this.$form;
  };

  /**
   * Reset Form state, remove key/value from localStorage
   * 
   * @return {object} Returns the $form
   */
  _Forms.state.prototype.reset = function()
  {
    this.$form[0].reset();
    localStorage.removeItem(this.key);

    return this.$form;
  };

  /**
   * _Forms.toggleDisable Constructor
   * 
   * @constructor
   * @param  {$object} jQuery-extended "source" element
   * @param  {$object} jQuery-extended "target" element
   * @param  {string}  String denoting "event" type to listen for
   */
  _Forms.toggleDisable = function( $source, $target, ev )
  {
    this.$source = $source || $('.toggle-disable').find('.toggle-disable-source');
    this.$target = $target || $('.toggle-disable').find('.toggle-disable-target');
    this.ev = ev || 'click'; // 'click', 'change', etc.
  };

  /**
   * _Forms.toggleDisable initialization
   * 
   * @return {function} This context
   */
  _Forms.toggleDisable.prototype.init = function()
  {
    var _$target = this.$target;

    this.$source.on(this.ev, function(e) {
      if(_$target.attr('disabled'))
      {
        _$target.removeAttr('disabled');
      }
      else
      {
        _$target.attr('disabled', 'disabled');
      }
    });

    /* Return context */
    return this;
  };

  /**
   * _Forms.typeAheadSearch Constructor
   * 
   * @param  {$object}  $input    jQuery-extended input for search
   * @param  {object}   config    Object for storing typeahead Configuration
   * @param  {array}    templates Array of template references
   * @return {function}           This context
   */
  _Forms.typeAheadSearch = function( $input, config, templates )
  {
    try
    {
      if(typeof B !== 'function')
      {
        throw 'Missing Dependency: \'typeahead.bundle.js::Bloodhound()\' not found! ' +
              'Type-Ahead Search will be disabled.';
      }

      /* Input */
      this.$input = [].shift.apply(arguments) || $('.typeahead');

      /* Configuration */
      this.config = _mergeObjects( [].shift.apply(arguments), {
        name           : 'data',
        displayKey     : 'name',
        //url            : 'data/data.json',
        //remote         : 'data/queries/%QUERY.json',
        detailSelector : '.details',
        successClass   : '.success'
      });

      /* Handlebars Templates */
      this.templates = _mergeObjects( [].shift.apply(arguments), {
        suggestion : $('#search-suggestion-template').html(),
        notFound   : $('#search-not-found-template').html(),
        results    : $('#search-results-template').html()
      });

      /* JSON Data */
      this.localData = [].shift.apply(arguments) || [];

      /* Function reference for Callback */
      this.callback  = [].shift.apply(arguments) || null;

      /* Construct/Configure Bloodhound Suggestion Engine */
      this.engine = (typeof this.config.url !== 'undefined' && typeof this.config.remote !== 'undefined')
        ? new B({
            datumTokenizer: function(d) { return B.tokenizers.whitespace( d.tokens.join(' ') ); },
            queryTokenizer: B.tokenizers.whitespace,
            prefetch: {
              url : this.config.url
            },
            remote : this.config.remote
          })
        : new B({
            datumTokenizer: function(d) { return B.tokenizers.whitespace( d.tokens.join(' ') ); },
            queryTokenizer: B.tokenizers.whitespace,
            local: this.localData
        });
    }
    catch(error)
    {
      console.warn(error.toString());
    }
    finally
    {
      return this;
    }
  };

  /**
   * _Forms.typeAheadSearch Instance Initialization
   * 
   * @return {function} This context
   */
  _Forms.typeAheadSearch.prototype.init = function()
  {
    try
    {
      if(typeof this.engine === 'undefined')
      {
        throw 'Unable to initialize \'Bloodhound\' search engine.';
      }

      this.engine.initialize();
      this.engine.clearPrefetchCache();

      this.$input.typeahead(
      {
        hint : true,
        highlight : false,
        minLength : 1
      },
      {
        name : this.config.name,
        displayKey : this.config.displayKey,
        source : this.engine.ttAdapter(),
        templates : {
          empty : H.compile(this.templates.notFound),
          suggestion : H.compile(this.templates.suggestion)
        }
      });

      if(typeof this.callback === 'function' )
      {
        this.callback.call(this.callback, this);
      }
    }
    catch(error)
    {
      console.warn(error.toString());
    }
    finally
    {
      return this;
    }
  };

  /**
   * _Forms.chosenSelects( config )
   *
   * @param {object} config Object storing configurations indexed by CSS selectors
   * @return {function} This context
   */
  _Forms.chosenSelects = function( config )
  {
    this.config = _mergeObjects(config, {
      '.chosen-select' : {
        disable_search_threshold : 10,
        width : '100%'
      },
      '.chosen-select-deselect' : {
        allow_single_deselect : true
      },
      '.chosen-select-no-single' : {
        disable_search_threshold: 10
      },
      '.chosen-select-no-results': {
        no_results_text: 'Oops, nothing found!'
      },
      '.chosen-select-width' : {
        width:"50%"
      }
    });

    return this;
  };

  /* _Forms.chosenSelects Instance Methods */
  _Forms.chosenSelects.prototype.init = function()
  {
    try
    {
      if(typeof $.prototype.chosen !== 'function')
      {
        throw 'Missing Dependency: \'chosen.jquery.js\' plugin not found! Filterable drop-downs are disabled.';
      }

      for (var selector in this.config) 
      {
        var _$select = $(selector);

        /* 
          Fix for jQuery 'hidden' selects, i.e., those in "tabs" or hidden forms,
          to give them "layout" and thus render appropriately when called to .show()
        */
        _$select.css({
          position: 'absolute',
          visibility: 'hidden',
          display: 'block'
        });

        _$select.chosen(this.config[selector]);
      }

    }
    catch(error)
    {
      console.warn(error.toString());
    }
    finally
    {
      return this;
    }
  };

  /*  
    _Forms.RTE - Rich Text Editor Constructor using TinyMCE 
  */
  _Forms.RTE = function()
  {
    try
    {
      if(typeof t === 'undefined' || typeof t.init !== 'function')
      {
        /* Bail immediately if the plugin is not available! */
        throw 'Missing Dependency: \'tinymce.js\' not found! Rich-Text Editing disabled.';
      }

      /* Define TinyMCE defaults */
      this.config = {
        selector: 'textarea',
        plugins: [
          'advlist lists preview',
          'code fullscreen',
          'table paste'
        ],
        menubar: false,
        toolbar:  'cut copy pastetext | ' +
                  'bold italic | ' +
                  'alignleft aligncenter alignright alignjustify | ' +
                  'bullist numlist outdent indent | ' +
                  'styleselect table | ' +
                  'preview fullscreen code'
      };
    }
    catch (error)
    {
      // Missing plugin is not a fatal error; warning is sufficient!
      console.warn(error.toString());
    }
    finally
    {
      return this;
    }
  };

  // TinyMCE Initialization:
  _Forms.RTE.prototype.init = function( config )
  {
    this.config = _mergeObjects( config, this.config );

    return t.init( this.config );
  };

  /* Now that we've defined what these private methods can do, let's go public! */
  return {
    Forms : _Forms
  };

})(jQuery, Handlebars, tinymce, Bloodhound);

/* Another TODO: Finish JSDoc for existing code */
/* http://en.wikipedia.org/wiki/JSDoc */