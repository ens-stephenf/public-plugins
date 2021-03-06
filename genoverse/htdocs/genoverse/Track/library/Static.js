Genoverse.Track.Controller.Static = Genoverse.Track.Controller.extend({
  constructor: function (properties) {
    this.base(properties);
    
    this.image = $('<img>').appendTo(this.imgContainer);
    this.container.toggleClass('track_container track_container_static').html(this.imgContainer);
  },
  
  reset: $.noop,
  
  setWidth: function (width) {
    this.base(width);
    this.image.width = width;
  },
  
  makeFirstImage: function () {
    this.base.apply(this, arguments);
    this.container.css('left', 0);
    this.imgContainer.show();
  },
  
  makeImage: function (params) {
    var features = this.view.positionFeatures(this.model.findFeatures(params.start, params.end), params);
    
    if (features) {
      var string = JSON.stringify(features);
      
      if (this.stringified !== string) {
        var height = this.prop('height');
        
        params.width         = this.width;
        params.featureHeight = height;
        
        this.render(features, this.image.data(params));
        this.imgContainer.children(':last').show();
        this.resize(height);
        
        this.stringified = string;
      }
    }
    
    return $.Deferred().resolve();
  }
});

Genoverse.Track.Model.Static = Genoverse.Track.Model.extend({
  url            : false,
  checkDataRange : function () { return true; }
});

Genoverse.Track.View.Static = Genoverse.Track.View.extend({
  featureMargin : { top: 0, right: 1, bottom: 0, left: 1 },
  
  positionFeature : $.noop,
  scaleFeatures   : function (features) { return features; },
  
  draw: function (features, featureContext, labelContext, scale) {
    for (var i = 0; i < features.length; i++) {
      this.drawFeature(features[i], featureContext, labelContext, scale);
    }
  }
});

Genoverse.Track.Static = Genoverse.Track.extend({
  controls   : 'off',
  resizable  : false,
  controller : Genoverse.Track.Controller.Static,
  model      : Genoverse.Track.Model.Static,
  view       : Genoverse.Track.View.Static
});
