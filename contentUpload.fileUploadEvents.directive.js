
(function() {
  'use strict';

  angular
    .module('merrillOfficial')
    .directive('fileDropEvents', fileDropEvents)
    .directive('fileUploadEvents', fileUploadEvents);
function fileDropEvents(){
              var directive = {
              restrict: 'EA',
              controllerAs: 'vm',
              controller: 'ContentUploadController',
              bindToController: {vm: '='} ,
              scope: true,
              replace: true,
              link: function (scope, element, attrs) {
                  element.bind('dragover', function (e) {
                      scope.$apply(function () { scope.contentUpload.changeDropClass("dropzone dragover"); });
                      e.stopPropagation();
                      e.preventDefault();
                  });
                  element.bind('dragleave', function (e) {
                      scope.$apply(function () { scope.contentUpload.changeDropClass("dropzone"); });
                      e.stopPropagation();
                      e.preventDefault();
                  });
                  element.bind('drop', function (e) {
                      scope.$apply(function () { scope.contentUpload.changeDropClass("dropzone"); });
                      e.stopPropagation();
                      e.preventDefault();
                      traverseFiles(e.dataTransfer.files, e.dataTransfer.items, false, scope);
                  });
              }
                    }

          return directive;
        }
        function fileUploadEvents(){
                    var directive = {
                    restrict: 'EA',
                    controllerAs: 'vm',
                    scope: true,
                    controller: 'ContentUploadController',
                    bindToController: {
                      vm: '='
                    } ,
                      replace: true,
                      link: function (scope, element, attrs) {
                        element.bind('change', function () {
                          scope.$apply(function () {scope.contentUpload.ShowBrowseSpinner = true;});
                          setTimeout(function(){
                            try{
                              traverseFiles(element[0].files, null, true, scope);
                              scope.$apply(function () {scope.contentUpload.ShowBrowseSpinner = false;});
                              this.value = '';
                            }
                            catch(err){
                              scope.$apply(function () {scope.contentUpload.ShowBrowseSpinner = false;});
                              this.value = '';
                            }
                              
                          }, 100);
                          
                        });
                      }
                  }
                  return directive;
                }
                var pathsArray = [];
                var indexArray = [];
                var numberArray = [];
                var currentNumber = 0;
                var currentIndex ="0.0";
                var currentPath ="";
                var currentArrayPosition = 0;
                function traverseFileTreeForChrome(item, path, scope, isLastEntry) {
                                path = path || "";
                                if (item.isFile) {
                                  scope.$apply(function () {scope.contentUpload.isEmptyFolder = false;});
                                    item.file(function (file) {
                                    if(file.name.toLowerCase() !== 'thumbs.db')
                                    {
                                        switch(path){
                                            case "":
                                            scope.$apply(function () {
                                                scope.vm.rootNumber = scope.vm.rootNumber +1;
                                                scope.contentUpload.changeRootNumber(scope.vm.rootNumber +1);
                                                scope.contentUpload.pushFileToArray(file, path, (scope.vm.rootIndex).toString()+ "."+ (scope.vm.rootNumber).toString(), 'F', scope.vm.rootIndex);
                                                });
                                            break;
                                            case currentPath:
                                            numberArray[currentArrayPosition] = ++currentNumber;
                                            scope.$apply(function () { scope.contentUpload.pushFileToArray(file, path, currentIndex.toString() + "."+ (currentNumber).toString(), 'F', currentIndex); });
                                            break;
                                            default:
                                            currentArrayPosition = pathsArray.indexOf(path);
                                            currentPath = path;
                                            currentIndex = indexArray[currentArrayPosition];
                                            currentNumber= ++numberArray[currentArrayPosition];
                                            scope.$apply(function () { scope.contentUpload.pushFileToArray(file, path, currentIndex.toString()+ "."+ (currentNumber).toString(), 'F', currentIndex); });
                                            break;
                                        }
                                    }
                                   });
                                } else if (item.isDirectory) {
                                  var thisDirIndex = "";
                                  switch(path){
                                    case "":
                                      scope.$apply(function () {scope.vm.rootNumber = scope.vm.rootNumber +1; scope.contentUpload.changeRootNumber(scope.vm.rootNumber +1);  });
                                      thisDirIndex = (scope.vm.rootIndex).toString()+ "."+ (scope.vm.rootNumber).toString();
                                      scope.$apply(function () {scope.contentUpload.pushFileToArray(item, path, thisDirIndex, 'D',scope.vm.rootIndex); });
                                      break;
                                    case currentPath:
                                      numberArray[currentArrayPosition] = ++currentNumber;
                                      thisDirIndex = currentIndex.toString() + "."+ (currentNumber).toString();
                                      scope.$apply(function () { scope.contentUpload.pushFileToArray(item, path, thisDirIndex, 'D',currentIndex); });
                                      break;
                                    default:
                                      currentArrayPosition = pathsArray.indexOf(path);
                                      currentPath = path;
                                      currentIndex = indexArray[currentArrayPosition];
                                      currentNumber= ++numberArray[currentArrayPosition];
                                      thisDirIndex = currentIndex.toString() + "."+ (currentNumber).toString();
                                      scope.$apply(function () { scope.contentUpload.pushFileToArray(item, path, thisDirIndex, 'D',currentIndex); });
                                      break;

                                  }
                                    // Add this directory in the array
                                    currentIndex = thisDirIndex; indexArray.push(thisDirIndex);
                                    currentNumber = 0; numberArray.push(0);
                                    currentPath = path + item.name+ "/" ;pathsArray.push(path + item.name+ "/");
                                    currentArrayPosition = indexArray.indexOf(thisDirIndex);
                                    var dirReader = item.createReader();
                                    dirReader.readEntries(function (entries) {
                                        if(entries.length === 0 && isLastEntry)
                                                scope.contentUpload.CheckForEmptyFolders();

                                        for (var i = 0; i < entries.length; i++) {
                                            traverseFileTreeForChrome(entries[i], path + item.name + "/", scope, (isLastEntry && i === entries.length - 1) ? true : false);
                                        }
                                    });
                                }

                            }
                function traverseFiles(files, items, viaControl, scope){
                        var is_chrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
                        if (is_chrome && !viaControl)
                        {
                          scope.$apply(function () {scope.contentUpload.isEmptyFolder = true;});
                          for (var i = 0; i < items.length; i++) {
                              var item = items[i].webkitGetAsEntry();
                              if (item) {
                                  traverseFileTreeForChrome(item, '', scope,items.length - 1 === i ? true : false);
                              }
                          }
                        }
                        else {
                          if(viaControl)
                          {
                            angular.forEach(files, function (file) {
                            if(file.name.toLowerCase() !== 'thumbs.db')
                            {
                                var phase = scope.$root.$$phase;
                                if(phase === '$apply' || phase === '$digest') {
                                        scope.vm.rootNumber = scope.vm.rootNumber +1;
                                        scope.contentUpload.changeRootNumber(scope.vm.rootNumber +1);
                                        scope.contentUpload.pushFileToArray(file, '',(scope.vm.rootIndex).toString()+ "."+ (scope.vm.rootNumber).toString(), 'F',scope.vm.rootIndex);
                                }
                                else{
                                    scope.$apply(function () {
                                        scope.vm.rootNumber = scope.vm.rootNumber +1;
                                        scope.contentUpload.changeRootNumber(scope.vm.rootNumber +1);
                                        scope.contentUpload.pushFileToArray(file, '',(scope.vm.rootIndex).toString()+ "."+ (scope.vm.rootNumber).toString(), 'F',scope.vm.rootIndex);
                                        });
                                }
                            }
                            })
                          }
                          else{
                            angular.forEach(files, function (file) {
                            if(file.name.toLowerCase() !== 'thumbs.db')
                            {
                              if (file.type !== "" || file.size%4096 !== 0)
                              {
                                scope.$apply(function () {
                                    scope.vm.rootNumber = scope.vm.rootNumber +1;
                                    scope.contentUpload.changeRootNumber(scope.vm.rootNumber +1);
                                    scope.contentUpload.pushFileToArray(file, '',(scope.vm.rootIndex).toString()+ "."+ (scope.vm.rootNumber).toString(), 'F',scope.vm.rootIndex);
                                    });
                              }
                            }
                           })

                          }

                        }
                  }
})();
