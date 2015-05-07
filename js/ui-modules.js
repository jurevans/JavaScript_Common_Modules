/* 
  --------------------------------------------
  User Interface (UI) Helper Library v 0.0.1
  --------------------------------------------
  @author: Justin Robert Evans
  @description: Implements functionality for HTML5 elements, Client-Side GUI components, Client-Side
  Database Interface, Form extensions, etc.
  @date: 05/05/2015
  
  [ NOTE: This is a work in progress! ]

  --------------------------------------------
  Base Modules:
  --------------------------------------------
  UI
   - UI.Util
   - UI.Forms
  --------------------------------------------
  DB  - To be implemented - Adapters and
        interfaces for Web SQL, IndexedDB and
        "localStorage" for support browers.
        See UI.Forms.state() for basic 
        "localStorage" implementation - this is
        currently used to persist Form
        information prior to submission and
        provides offline access

  --------------------------------------------
  Requirements:
  --------------------------------------------
  * jQuery      v 1.10.2
  * Typeahead   v 0.10.5
  * Handlebars  v 3.0.1
  * TinyMCE     v 4.0.5
*/

/* UI Module */

var UI = (function($, B, H, T, UI) 
{
  'use  strict';

  /* Define general (and useful) static UI "utility" methods */
  UI.Util = UI.Util || {
    /*  mergeObjects(custom, default): Take two objects and apply key/value pairs defined in "cust", 
        to those defined in "obj", overriding only key/val pairs from "cust" */
    mergeObjects : function( cust, obj )
    {
      cust = cust || {};
      obj  = obj  || {};

      for(var opt in cust)
      {
        if( typeof cust[opt]  === 'object' )
          this.mergeObjects(obj[opt], obj[opt]);
        else
          obj[opt] = cust[opt];
      }

      return obj;
    }
  };

  /* Form UI Methods */

  UI.Forms = UI.Forms || {};

  /* 
    UI.Forms.state preserves and retrieves a given Form state from Local Storage 
  */

  /* Constructor */
  UI.Forms.state = function( $form, key )
  {
    this.$form = $form;
    this.key = key;
    this.data = new Object();
  };

  /* Set key "key" = string containing serialized Form Values */
  UI.Forms.state.prototype.set = function()
  {
    this.data = this.$form.serializeArray();

    localStorage.setItem(this.key, JSON.stringify(this.data));

    return this.data;
  };

  /* Get key "key" from localStorage (object of serialized Form Values) */
  UI.Forms.state.prototype.get = function()
  {
    /* Update to check data integrity before retrieving - newest first */

    return JSON.parse(localStorage.getItem(this.key));
  };

  UI.Forms.state.prototype.sync = function()
  {
    /* Update to check data integrity before retrieving - newest first */
    var _data = this.get();

    for(var i=0; i<_data.length;++i)
    {
      this.$form[0][_data[i].name].value = _data[i].value;
    }
  };

  /* Reset Form state, remove key/value from localStorage */
  UI.Forms.state.prototype.reset = function()
  {
    this.$form[0].reset();
    localStorage.removeItem(this.key);
  };

  /* UI.Forms.toggleDisable Constructor */
  UI.Forms.toggleDisable = function( $source, $target, ev )
  {
    /*
      Usage:

      HTML -

      <div class="toggle-disable">
        <input class="toggle-disable-target" id="example" name="example" type="text" disabled="disabled" />
        <label for="enablesExample">
          <input class="toggle-disable-source" type="checkbox" id="enablesExample" name="enablesExample" type="checkbox"/>
          Enable Input
        </label>
      </div>

      JavaScript -

      var toggleDisable = new UI.Forms.toggleDisable();
      (var toggleInstance = ) toggleDisable.init();

      Same as:

      UI.Forms.toggleDisable($('#enablesExample'), $('#example'), 'click');
    */

    /* Defaults */
    this.$source = $source || $('.toggle-disable').find('.toggle-disable-source');
    this.$target = $target || $('.toggle-disable').find('.toggle-disable-target');
    this.ev = ev || 'click'; // 'click', 'change', etc.
  };

  /* UI.Forms.toggleDisable Instance Methods */
  UI.Forms.toggleDisable.prototype.init = function()
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

  /* UI.Forms.typeAheadSearch Constructor */
  UI.Forms.typeAheadSearch = function( $input, config, templates )
  {
    /*
      Usage:
      var typeAheadSearch = UI.Forms.typeAheadSearch(); // (Call constructor, using defaults)
      typeAheadSearch.init(); // Initialize

      Override Defaults, types:
      UI.Forms.typeAheadSearch( jQuery(input_selector), config, templates, data, callback )

      NOTE: typeAheadSearch.init() returns it's instance:
      var typeAheadSearch = UI.Forms.typeAheadSearch();
      var typeAheadInstance = typeAheadSearch.init();
      console.dir(typeAheadInstance); // Context of instance "typeAheadInstance"
    */

    try
    {
      if(typeof Bloodhound !== 'function')
      {
        throw 'Missing Dependency: \'typeahead.bundle.js::Bloodhound()\' not found! ' +
              'Type-Ahead Search will be disabled.';
      }

      /* Input */
      this.$input = [].shift.apply(arguments) || $('.typeahead');

      /* Configuration */
      this.config = UI.Util.mergeObjects( [].shift.apply(arguments), {
        name           : 'data',
        displayKey     : 'name',
        //url            : 'data/data.json',
        //remote         : 'data/queries/%QUERY.json',
        detailSelector : '.details',
        successClass   : '.success'
      });

      /* Handlebars Templates */
      this.templates = UI.Util.mergeObjects( [].shift.apply(arguments), {
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
      /* Return context */
      return this;
    }
  };

  /* UI.Forms.typeAheadSearch Instance Initialization */
  UI.Forms.typeAheadSearch.prototype.init = function()
  {
    try
    {
      if(typeof this.engine === 'undefined')
      {
        throw 'Unable to initialize \'Bloodhound\' search engine.';
      }

      /* Initialize 'local' and 'prefetch' (url/remote query) data sources */
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

      /*  The following passes this method's instance, with updated instance variables (after
          merging defaults) to a supplied callback, "called" here: */
      if(typeof this.callback === 'function' )
      {
        this.callback.call(this.callback, this); // ( functionReference, context )
      }

    }
    catch(error)
    {
      console.warn(error.toString());
    }
    finally
    {
      /* Return context */
      return this;
    }
  };


  /* 
    UI.Forms.chosenSelects( config )

    Default usage:
    var selects = new UI.Forms.chosenSelects();
    selects.init();

    Override default configuration by specifying options during instantiation:
    var selects = new UI.Forms.chosenSelects( {'.chosen-select' : { disable_search_threshold : 15 } } );
    selects.init();
  */
  UI.Forms.chosenSelects = function( config )
  {
    this.config = UI.Util.mergeObjects(config, {
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
  };

  /* UI.Forms.chosenSelects Instance Methods */

  /* Initialize instance */
  UI.Forms.chosenSelects.prototype.init = function()
  {
    try
    {
      if(typeof $.prototype.chosen !== 'function')
      {
        /* Bail immediately if the plugin is not available! */
        throw 'Missing Dependency: \'chosen.jquery.js\' plugin not found! Filterable drop-downs are disabled.';
      }

      for (var selector in this.config) 
      {
        /* Cache jQuery-extended "select" element */
        var _$select = $(selector);

        /* 
          Fix for jQuery 'hidden' selects, i.e., those in "tabs" or hidden forms,
          to give them "layout" and thus render appropriately when "show"n
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
      // Missing plugin is not a fatal error. A warning will suffice.
      console.warn(error.toString());
    }
    finally
    {
      /* Return context */
      return this;
    }
  };

  /*  
    UI.Forms.RTE - Rich Text Editor Constructor using TinyMCE (NOTE: May update to support CKEditor).
    Returns instance with method to "init" or "invoke" multiple TinyMCE/RTE Editors
  */
  UI.Forms.RTE = function()
  {
    try
    {
      if(typeof T === 'undefined' || typeof T.init !== 'function')
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
      // Missing plugin is not a fatal error; warning is sufficient.
      console.warn(error.toString());
    }
    finally
    {
      return this;
    }
  };

  // TinyMCE Initialization:
  UI.Forms.RTE.prototype.init = function( config )
  {
    this.config = UI.Util.mergeObjects( config, this.config );

    return tinymce.init( this.config );
  };

  /* Now that we've defined what UI is and can do, let's return it for use! */
  return UI;

})(jQuery, Bloodhound, Handlebars, tinymce, UI || {});

/* ===================================================================================== */
/* EXAMPLES ============================================================================ */
/* ===================================================================================== */

$(document).ready(function(){
  'use strict';

  /* Initialize Form "chosen" Selects */

  var selects = new UI.Forms.chosenSelects();
  selects.init();

  /* Initialize Form RTEs (TinyMCE) */
  var rte = new UI.Forms.RTE();

  rte.init({'selector': 'textarea.commentEdit'});

  /* Initialize "form disable" toggles using defaults */
  var toggleDisable = new UI.Forms.toggleDisable();
  toggleDisable.init();

  /* Initialize Type-Ahead engine for Contact Search */
  var typeAhead = new UI.Forms.typeAheadSearch( 
    // Input
    $('.contact-lookup'), 
    // Config
    {
      name : 'contacts',
      displayKey : 'name',
      successClass : 'success',
      resultsSelector : '#details'
    },
    // Templates
    {
      suggestion : $('#contactSuggestion').html(),
      notFound : $('#contactNotFound').html(),
      results : $('#contactDetail').html()
    }, 
    // Local Data
    [],
    // Register Callbacks
    function( context )
    {
      /* Display area showing "results" for selected item */
      var $results = $(context.config.resultsSelector);

      /* Update Result Details based on action, if DOM exists for Results: */
      if( $results )
      {
        context.$input.on('typeahead:selected', function(e, data, name) 
        {
          var template = Handlebars.compile(context._templates.results);
          $results.html(template(data));
          context.$input.addClass(context._config.successClass);
        }).keypress(function(e) 
        {
          if(e.which == 13 && $(e.target).val() === '')
          {
            $results.html('');
            context.$input.removeClass(context._config.successClass);
          }
        }).focusout(function(e) 
        {
          if( $(e.target).val() === '' )
          {
            $results.html('');
            context.$input.removeClass(context._config.successClass);
          }
        });
      }
      return context;
    }
  );
  
  typeAhead.init();
});
