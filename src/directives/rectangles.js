angular.module('ngMaps')
  .directive('rectangles', ['MapObjects', '$rootScope', function(MapObjects, $rootScope) {
  return {
      restrict: 'E',
      scope: {
        geometries: '=',
        events: '=',
        visible: '=',
        options: '=',
        opacity: '=',
        decimals: '='
      },
      require: '^map',
      link: function($scope, $element, $attrs, parent) {

        $scope.$watch(function() {
          parent.getMap();
        }, function() {

          // Set map
          var map = parent.getMap();

          // List of circles
          var rectangles = [];

          var decimals = $scope.decimals;

          var round = function(val) {
            if (decimals || decimals === 0) {
              return Math.round(Math.pow(10, decimals) * val) / Math.pow(10, decimals);
            } else {
              return val;
            }
          };

          // Watch for changes in visibility
          $scope.$watch('visible', function() {
            angular.forEach(rectangles, function(r) {
              r.setVisible($scope.visible)
            })
          })

          // Watch for changes in options
          $scope.$watch('options', function() {
            angular.forEach(rectangles, function(r, i) {
              r.setOptions($scope.options(r, map, i, MapObjects));
            })
          })

          // Watch for changes in data
          $scope.$watch('geometries', function() {
            newData();
          })

          // Watch for changes in opacity
          $scope.$watch('opacity', function() {
            if ($scope.opacity) {
              angular.forEach(rectangles, function(r) {
                r.setOptions({fillOpacity: $scope.opacity / 100});
              });
            }
          });

          // Make a new collection of circles
          var newData = function() {

            // Remove each object from map
            angular.forEach(rectangles, function(r){
              r.setMap(null);
            })

            // Delete objects
            rectangles = [];

            // Create new objects
            angular.forEach($scope.geometries, function(r, i) {

              var SW = new google.maps.LatLng(r[0][0], r[0][1]);
              var NE = new google.maps.LatLng(r[1][0], r[1][1]);

              var opts = $scope.options ? $scope.options(r, map, i, MapObjects) : {};
              // Bounds are constructed at SW and NE corners
              opts.bounds = new google.maps.LatLngBounds(SW,NE);  
              opts.map = map;

              var rect = new google.maps.Rectangle(opts);
              rectangles.push(rect)

              angular.forEach($scope.events, function(val, key) {
                google.maps.event.addListener(rect, key, function(e) {
                  val(e, this, i, MapObjects, rectangles);
                });
              });

              // If editable, apply bound changes to rootscope when the rectangle is edited
              google.maps.event.addListener(rect, 'bounds_changed', function() {
                var b = rect.getBounds();
                var SW = b.getSouthWest();
                var NE = b.getNorthEast();
                $scope.geometries[i] = [[round(SW.k),round(SW.B)],[round(NE.k),round(NE.B)]];
                $rootScope.$apply()
              })

            })
          }

          

          

        });

      }
    };
}]);