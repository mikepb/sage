$(function() {

  // tooltips

  $('a[rel=tooltip]').tooltip({
    'placement': 'bottom'
  });

  // smooth scroll

  function filterPath(string) {
  return string
    .replace(/^\//,'')
    .replace(/(index|default).[a-zA-Z]{3,4}$/,'')
    .replace(/\/$/,'');
  }
  var locationPath = filterPath(location.pathname);
  var $scrollElem = $('html, body');

  $('a[href^=#]').each(function() {
    var thisPath = filterPath(this.pathname) || locationPath;
    if (  locationPath == thisPath
    && (location.hostname == this.hostname || !this.hostname)
    && this.hash.replace(/#/,'') ) {
      var target = this.hash, $target;
      if (target && ($target = $(this.hash)).length) $(this).click(function(event) {
        event.preventDefault();
        $scrollElem.animate({ scrollTop: $target.offset().top }, 400, function() {
          location.hash = target;
        });
      });
    }
  });

});
