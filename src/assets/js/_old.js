$(function() {

  /*
    side bar - set position
   */
  var $obj = $('#toc-block');
  var $top = $obj.offset().top;

  setSideBarDisplay($obj, $top);

  // $(window).scroll(function (event) {
  //   setSideBarDisplay($obj, $top);
  // });

  /*
    side bar - set active
   */

  var currentLocation = window.location.href;

  setActivePart(currentLocation);

});

/*
  helpers
 */

function setSideBarDisplay(obj, top) {
  var y = $(window).scrollTop();
  if (y >= top - 51) {
    obj.css('position', 'fixed').css('top', '45px').css('max-width', '150px');
  } else {
    obj.css('position', 'static').css('top', '0px');
  }
}

function setActivePart(url) {
  var active = url.split('-')[1];
  if (active) {
    if (active === 'one') {
      $('h5[data-part="1"]').addClass('active');
    }
    if (active === 'two') {
      $('h5[data-part="2"]').addClass('active');
    }
    if (active === 'three') {
      $('h5[data-part="3"]').addClass('active');
    }
  }
}
