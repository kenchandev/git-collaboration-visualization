window.addEvent('load', function () {
  $$('body').fade('hide').set('morph', {
      duration: 3000
  }).morph({
      'opacity': '1'
  });
});