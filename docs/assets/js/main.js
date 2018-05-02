$(function() {

  $('.button-collapse').sideNav();

  var currentLocation = window.location.href;
  setActivePart(currentLocation);

});

/*
  helpers
 */

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
