(function() {
    'use strict';
    describe('Content Upload Controller', function() {
        var vm,
            $controller,
            $scope,
            mock_errorAlertService,
            mock_uploadService,
            spyuploadServicePromise,
            spyuploadServicePostUploadPromise,
            q,
            deferreduploadService,
            deferreduploadServicePostUpload,
            mock$uibModal,
            authService
            ;

        beforeEach(module('merrillOfficial', function($provide, $translateProvider) {
            $provide.factory('customLoader', function($q) {
                return function() {
                    var deferred = $q.defer();
                    deferred.resolve({});
                    return deferred.promise;
                };
            });

            $translateProvider.useLoader('customLoader');
        }));

        beforeEach(inject(function(_$controller_, _$timeout_, _toastr_, _$rootScope_,_$q_,_authService_) {
            $controller = _$controller_;
            $scope = _$rootScope_.$new();
            mock_errorAlertService = {
                openPopupModal: function() {

                }
            };
            q = _$q_;
            authService = _authService_;
            spyOn(authService, 'getToken').and.returnValue("eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0Z3V5IiwiZ3JvdXAiOiJjbGllbnQiLCJleHAiOjE0NjcxMzk5OTEsInNjb3BlIjpbXSwiaXNzIjoiaWFtLm1lcnJpbGxjb3JwLmNvbSIsImF1ZCI6ImphdmVsaW5tYy5jb20iLCJVc2VyTmFtZSI6InRlc3RAbWVycmlsbGNvcnAuY29tIn0.jLkBlrT8jop7mlx4OefVaLrcbB1QEqK_HYfZKmPbSU4");
            deferreduploadService = q.defer();
            deferreduploadServicePostUpload = q.defer();
            spyuploadServicePromise = deferreduploadService.promise;
            spyuploadServicePostUploadPromise = deferreduploadServicePostUpload.promise;
            mock_uploadService = jasmine.createSpyObj('mock_uploadService', ['cancelFile','GetPermissionsForNode','sendMetadata','SavePermissionsForNode','sendUpload']);
            mock_uploadService.cancelUploadStream = function(params) {
                
            }
            mock_uploadService.cancelFile.and.returnValue(spyuploadServicePromise);
            mock_uploadService.GetPermissionsForNode.and.returnValue(spyuploadServicePromise);
            mock_uploadService.sendMetadata.and.returnValue(spyuploadServicePromise);
            mock_uploadService.SavePermissionsForNode.and.returnValue(spyuploadServicePromise);
            mock_uploadService.sendUpload.and.returnValue(spyuploadServicePostUploadPromise);
            mock$uibModal = {
                open : function() {
                    
                },
                close:function () {
                    
                }
            }
            vm = $controller('ContentUploadController', {
                $scope: $scope,
                errorAlertService: mock_errorAlertService,
                uploadService:mock_uploadService,
                $uibModal : mock$uibModal
            });
        }));

        it('Controller should be defined and exist', function() {
            expect(vm).toBeDefined();
        });
        it('Should cancel permission', function() {
            vm.FinalPermissionsData = [{}, {}];
            vm.CancelPermissions();
            expect(vm.isEdit).toEqual(false);
            expect(angular.isArray(vm.PermissionsList)).toBeTruthy();
            expect(vm.PermissionsList.length).toEqual(2);
        });
        it('Should save permission', function() {
            vm.PermissionsList = [{}, {}, {}];
            vm.SavePermissions();
            expect(vm.isEdit).toEqual(false);
            expect(angular.isArray(vm.FinalPermissionsData)).toBeTruthy();
            expect(vm.FinalPermissionsData.length).toEqual(3);
        });
        it('Should Check For EmptyFolders', function() {
            vm.isEmptyFolder = true;
            spyOn(mock_errorAlertService, "openPopupModal").and.callThrough();
            vm.CheckForEmptyFolders();
            expect(mock_errorAlertService.openPopupModal).toHaveBeenCalled();
        });
        it('Should Check For EmptyFolders when no empty folder', function() {
            vm.isEmptyFolder = false;
            vm.CheckForEmptyFolders();
            expect(vm.isEmptyFolder).toEqual(false);
        });
        it('Should Hide Upload', function() {
            vm.Hidden = false;
            spyOn(document, 'getElementById').and.returnValue({ parentNode: { parentNode: { parentNode: { classList: {
                add:function(){
                },
                remove:function(){
                }
            } } } } });
            $scope.contentView = $scope.contentView || { TotalUploadsMinimized: 0 };
            var totalMinimized = $scope.contentView.TotalUploadsMinimized;
            vm.HideUnhideUpload();
            expect($scope.contentView.TotalUploadsMinimized).toEqual(++totalMinimized);
        });
        it('Should Show Upload', function() {
            vm.Hidden = true;
            spyOn(document, 'getElementById').and.returnValue({ parentNode: { parentNode: { parentNode: { classList: {
                add:function(){
                },
                remove:function(){
                }
            } } } } });
            $scope.contentView = $scope.contentView || { TotalUploadsMinimized: 0 };
            var totalMinimized = $scope.contentView.TotalUploadsMinimized;
            vm.HideUnhideUpload();
            expect($scope.contentView.TotalUploadsMinimized).toEqual(--totalMinimized);
        });
        
        it('Should Cancel Ongoing Upload', function() {
            $scope.modalInstance = { close:function(){} }
            $scope.contentView = $scope.contentView || {};
            $scope.contentView.RefreshData = function(){};
            $scope.contentView.TotalUploads = 1;
            var  totalUploads = $scope.contentView.TotalUploads;
            vm.filesArray = [{uStatus:"InProgress"},{uStatus:"NotInProgress"}];
            vm.CancelOngoingUpload();
            deferreduploadService.resolve({
                    data: {}
                });
            $scope.$apply();
            expect($scope.contentView.TotalUploads).toEqual(--totalUploads);
        });
        it('Should Cancel Upload', function() {
             mock$uibModal.open =function(data) {
                  var modalCtrl = new  data.controller[1](Object.create(mock$uibModal));
                  modalCtrl.CallCancelUpload();
                }
            $scope.contentUpload = {CancelOngoingUpload: function(){
            }}
            spyOn(mock$uibModal,"open").and.callThrough();
            vm.CancelUpload();
            expect(mock$uibModal.open).toHaveBeenCalled();
        });
        it('Should Close Upload', function() {
            $scope.contentView = $scope.contentView || {};
            $scope.contentView.TotalUploads = 2;
            vm.CloseUpload();
            expect($scope.contentView.TotalUploads).toEqual(1);
        });
        
        it('Should Goto permission backward', function() {
            vm.GoToPermissions(true);
            expect(vm.Stage).toEqual("before");
        });
        it('Should Goto permission forward', function() {
            vm.filesArray = [{uStatus:"InProgress",isViolatingFileTitle:true,isViolatingFileSize: true, file:{size:256 }},{uStatus:"NotInProgress", file:{size:256 }}];
            
            vm.GoToPermissions(false);
            deferreduploadService.resolve({
                    data: [1,2]
                });
            $scope.$apply();
            expect(vm.Stage).toEqual("permissions");
        });
          it('Should Goto permission forward with empty return values and one zip file', function() {
            vm.filesArray = [{uStatus:"InProgress",isViolatingFileTitle:true,isViolatingFileSize: true, file:{size:256 }},{uStatus:"NotInProgress", file:{size:256 }}];
            vm.TotalZipFiles = 1;
            vm.GoToPermissions(false);
            deferreduploadService.resolve({
                    data: []
                });
            $scope.$apply();
            expect(vm.Stage).toEqual("confirm");
            
        });
        it('Should Goto permission forward with empty return values and NO zip file', function() {
            vm.filesArray = [{uStatus:"InProgress",isViolatingFileTitle:true,isViolatingFileSize: true, file:{size:256 }},{uStatus:"NotInProgress", file:{size:256 }}];
            vm.TotalZipFiles = 0;
            vm.GoToPermissions(false);
            deferreduploadService.resolve({
                    data: []
                });
            $scope.$apply();
            expect(vm.Stage).toEqual("confirm");
            
        });
        it('Should Goto permission forward with no files', function() {
            vm.filesArray = [];
            spyOn(mock_errorAlertService,"openPopupModal").and.callThrough();
            vm.GoToPermissions(false);
            expect(mock_errorAlertService.openPopupModal).toHaveBeenCalled();
          
        });
        it('Should Goto Progress', function() {
            //TODO cover postUpload()
            vm.Stage = null;
            vm.filesArray = [{uStatus:"InProgress",isViolatingFileTitle:true,isViolatingFileSize: true, file:{size:256 }},{uStatus:"NotInProgress", file:{size:256 }}];
            $scope.contentView = { UploadsInProgress: 0 };
            console.log("calling GoToProgress");
            vm.GoToProgress();
            $scope.$apply();
        });
        it('Should call Upload Finished', function() {
            $scope.contentView = { TotalUploads: 1 };
            $scope.contentView.RefreshData = function(){
                
            };
            spyOn(vm,"UploadFinished").and.callThrough();
            vm.UploadFinished();
            expect(vm.UploadFinished).toHaveBeenCalled();
        });
        
        it('Should push a file to array', function() {
            vm.filesArray = [];
            var file = {
                name: "hello",
                size:33456
            };
            $scope.contentView = $scope.contentView || {};
            $scope.contentView.RefreshData = function(){
                
            };
            var path = "",index = 1,type ="F",parent = 0;
            vm.pushFileToArray(file, path, index, type, parent);
            expect(angular.isArray(vm.filesArray)).toBeTruthy();
            expect(vm.filesArray.length).toEqual(1);
        });
        it('Should push a file to array with extension', function() {
            vm.filesArray = [];
            var file = {
                name: "hello.byte",
                size:33456
            };
            $scope.contentView = $scope.contentView || {};
            $scope.contentView.RefreshData = function(){
                
            };
            var path = "",index = 1,type ="F",parent = 0;
            vm.pushFileToArray(file, path, index, type, parent);
            expect(angular.isArray(vm.filesArray)).toBeTruthy();
            expect(vm.filesArray.length).toEqual(1);
        });
        
         it('Should push a file to array with long name', function() {
            vm.filesArray = [];
            var file = {
                name: "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz.byte",
                size:33456
            };
            $scope.contentView = $scope.contentView || {};
            $scope.contentView.RefreshData = function(){
                
            };
            var path = "",index = 1,type ="F",parent = 0;
            vm.pushFileToArray(file, path, index, type, parent);
            expect(angular.isArray(vm.filesArray)).toBeTruthy();
            expect(vm.filesArray.length).toEqual(1);
        });
        it('Should push a file to array with large size with zip', function() {
            vm.filesArray = [];
            var file = {
                name: "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz.zip",
                size:1099511627776
            };
            $scope.contentView = $scope.contentView || {};
            $scope.contentView.RefreshData = function(){
                
            };
            var path = "",index = 1,type ="F",parent = 0;
            vm.pushFileToArray(file, path, index, type, parent);
            expect(angular.isArray(vm.filesArray)).toBeTruthy();
            expect(vm.filesArray.length).toEqual(1);
            expect(vm.TotalZipFiles).toEqual(1);
        });
        it('Should not push a file/directory to array with type D for directory', function() {
            vm.filesArray = [];
            var file = {
                name: "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz.zip",
                size:1099511627776
            };
            $scope.contentView = $scope.contentView || {};
            $scope.contentView.RefreshData = function(){
                
            };
            var path = "",index = 1,type ="D",parent = 0;
            vm.pushFileToArray(file, path, index, type, parent);
            expect(vm.filesArray.length).toEqual(0);
        });
        
        
       it('Should cancel Upload For File', function() {
             var file = {
                name: "cc.zip",
                size:1099511627776
            };
            vm.filesArray = [];
            $scope.contentView = {UploadsInProgress : 1};
            vm.FilesCancelled = 0;
           
            vm.filesArray.push(file);
            vm.cancelUploadForFile(file);
            deferreduploadService.resolve({
                    data: {}
                });
            $scope.$apply();
            expect(vm.FilesCancelled).toEqual(1);
           
        });
        it('Should cancel Upload For File with some files failed', function() {
             var file = {
                name: "cc.zip",
                size:1099511627776
            };
            vm.ItemsUploadError = 5;
            vm.filesArray = [];
            $scope.contentView = {UploadsInProgress : 1};
            vm.FilesCancelled = 0;
           
            vm.filesArray.push(file);
            vm.cancelUploadForFile(file);
            deferreduploadService.resolve({
                    data: {}
                });
            $scope.$apply();
            expect(vm.FilesCancelled).toEqual(1);
           
        });
        //deleteFromFileToArray
         it('Should delete File from Array zip file', function() {
            vm.filesArray = [];
            vm.TotalZipFiles = 1;
            var file = {
                
                isZip : true,
                file:{
                name: "a.zip",
                   size:1099511627776, 
                }
            };
            $scope.contentView = $scope.contentView || {};
            $scope.contentView.RefreshData = function(){
                
            };
            vm.filesArray.push(file);
            vm.deleteFromFileToArray(file);
            expect(vm.TotalZipFiles).toEqual(0);
            expect(vm.filesArray.length).toEqual(0);
        });
        it('Should delete File from Array non zip file', function() {
            vm.filesArray = [];
            vm.TotalZipFiles = 1;
            var file = {
                
                isZip : false,
                file:{
                name: "a.nozip",
                   size:1099511627776, 
                }
            };
            $scope.contentView = $scope.contentView || {};
            $scope.contentView.RefreshData = function(){
                
            };
            vm.filesArray.push(file);
            vm.deleteFromFileToArray(file);
            expect(vm.filesArray.length).toEqual(0);
        });
        it('Should change Root Number', function() {
            var rootNumber = 1;
            vm.changeRootNumber(rootNumber);
            expect(vm.rootNumber ).toEqual(rootNumber);
        });
        it('Should change Root Index', function() {
            var rootIndex = 1.0;
            vm.changeRootIndex(rootIndex);
            expect(vm.rootIndex ).toEqual(rootIndex);
        });
        it('Should change Drop Class', function() {
            var dropClass = "drop-effect";
            vm.changeDropClass(dropClass);
            expect(vm.dropClass ).toEqual(dropClass);
        });
        it('Should showUpload', function() {
            var dropClass = "drop-effect";
            vm.UploadId ="upload"
            spyOn(document, 'getElementById').and.returnValue({click:function(){
                
            }})
            vm.showUpload();
            expect(document.getElementById).toHaveBeenCalledWith("file_"+vm.UploadId);
        });
        it('Should call grid register callback on before grid', function() {
           var gridApi ={colDef:[{"name":"index"}]};
           spyOn(vm.BeforeGridOptions, 'onRegisterApi').and.callThrough();
           vm.BeforeGridOptions.onRegisterApi(gridApi);
           expect(vm.BeforeGridOptions.onRegisterApi).toHaveBeenCalledWith(gridApi);
        });
        //vm.ProgressGridOptions
       it('Should call grid register callback on process grid', function() {
           var gridApi ={colDef:[{"name":"index"}]};
           spyOn(vm.ProgressGridOptions, 'onRegisterApi').and.callThrough();
           vm.ProgressGridOptions.onRegisterApi(gridApi);
           expect(vm.ProgressGridOptions.onRegisterApi).toHaveBeenCalledWith(gridApi);
        });
       it('Should call post upload with TotalSpaceUsed > TotalUploadAllowed', function() {
            vm.TotalUploadAllowed = 5;
            $scope.contentView = $scope.contentView || { TotalUploadsMinimized: 0,UploadsInProgress:1 };
            vm.ArrayToBeSent =  [{uStatus:"InProgress"},{uStatus:"NotInProgress"}];
            vm.UploadCancelled = false;
            vm.TotalSpaceUsed = 7;
            spyOn(mock_errorAlertService, 'openPopupModal').and.callThrough();
            vm.postUpload();
            expect(mock_errorAlertService.openPopupModal).toHaveBeenCalled();
         });
         it('Should call post upload with zero file to send', function() {
            vm.TotalUploadAllowed = 5;
            $scope.contentView = $scope.contentView || { TotalUploadsMinimized: 0,UploadsInProgress:1 };
            vm.ArrayToBeSent =  [];
            vm.UploadCancelled = false;
            vm.TotalSpaceUsed = 2;
            vm.postUpload();
            expect($scope.contentView.UploadsInProgress).toEqual(-1);
         });
         it('Should call post upload', function() {
            vm.TotalUploadAllowed = 5;
            $scope.contentView = $scope.contentView || { TotalUploadsMinimized: 0,UploadsInProgress:1 };
            vm.ArrayToBeSent =   [{uStatus:"InProgress"},{uStatus:"NotInProgress"}];
            vm.filesArray = [{uStatus:"NoError",index:1},{uStatus:"Error",index:2}];
            vm.UploadCancelled = false;
            vm.TotalSpaceUsed = 2;
            deferreduploadService.resolve({
                    data: {
                        files:[{uStatus:"NoError",index:1 }]
                    },
                    status:201
                });
                
            vm.postUpload();
            $scope.$apply();
            expect(true).toEqual(true);
         });
         it('Should call post upload with error on post', function() {
            vm.TotalUploadAllowed = 5;
            $scope.contentView = $scope.contentView || { TotalUploadsMinimized: 0,UploadsInProgress:1 };
            vm.ArrayToBeSent =   [{uStatus:"InProgress"},{uStatus:"NotInProgress"}];
            vm.filesArray = [{uStatus:"NoError",index:1},{uStatus:"Error",index:2}];
            vm.UploadCancelled = false;
            vm.TotalSpaceUsed = 2;
            deferreduploadService.resolve({
                    data: {
                        files:[{uStatus:"NoError",index:1 }]
                    },
                    status:201
                });
                
            deferreduploadServicePostUpload.reject();   
            
            vm.postUpload();
            $scope.$apply();
            expect(true).toEqual(true);
         });
        
    });
    describe('Content Upload Popup Controller', function() {
        var vm,
            $controller,
            $scope,
            mock_errorAlertService,
            mock$uibModal,
            rootScope
            ;

        beforeEach(module('merrillOfficial', function($provide, $translateProvider) {
            $provide.factory('customLoader', function($q) {
                return function() {
                    var deferred = $q.defer();
                    deferred.resolve({});
                    return deferred.promise;
                };
            });

            $translateProvider.useLoader('customLoader');
        }));

        beforeEach(inject(function(_$controller_,_$rootScope_) {
            rootScope = _$rootScope_;
            $controller = _$controller_;
            $scope = _$rootScope_.$new();
            mock_errorAlertService = {
                openPopupModal: function() {

                }
            };
            mock$uibModal = {
                open : function() {
                    
                },
                close:function () {
                    
                }
            }
            vm = $controller('ContentUploadPopupController', {
                $scope: $scope,
                errorAlertService: mock_errorAlertService,
                $uibModal : mock$uibModal
            });
        }));

        it('Controller should be defined and exist', function() {
            expect(vm).toBeDefined();
        });
        it('Should not return a message when total uploads files are zero', function() {
           $scope.contentView = { TotalUploads: 0 };
           var returnVal = window.onbeforeunload({returnValue:""});
           expect(returnVal).toBeUndefined();
        });
        it('Should  return a message when total uploads files are not zero', function() {
           $scope.contentView = { TotalUploads: 5 };
           var returnVal = window.onbeforeunload({returnValue:""});
           expect(returnVal).toBeDefined();
        });
        it('Should  return a message when total uploads files are not zero and event undefined', function() {
           $scope.contentView = { TotalUploads: 5 };
           var returnVal = window.onbeforeunload();
           expect(returnVal).toBeDefined();
        });
        it('Should emit $locationChangeStart event with affirmative', function() {
           $scope.contentView = { TotalUploads: 5 };
           spyOn(window, 'confirm').and.returnValue(true);
           rootScope.$broadcast('$locationChangeStart', {
            preventDefault: function(){
            }
           });
           expect(window.confirm).toHaveBeenCalled();
        });
        it('Should emit $locationChangeStart event with neglation', function() {
           $scope.contentView = { TotalUploads: 5 };
           spyOn(window, 'confirm').and.returnValue(false);
           rootScope.$broadcast('$locationChangeStart', {
            preventDefault: function(){
            }
           });
           expect(window.confirm).toHaveBeenCalled();
        });
        it('Should do nothing if TotalUploads are zero', function() {
           $scope.contentView = { TotalUploads: 0 };
           spyOn(window, 'confirm').and.returnValue(false);
           rootScope.$broadcast('$locationChangeStart', {
           preventDefault: function(){
            }
           });
        })
           
        it('Should not show Upload pop up if TotalUploads are more than 5 ', function() {
           var selectedProjectID = 1,selectedNodeID = 2,selectedNode = {}; 
           $scope.contentView = { TotalUploads: 6 };
           spyOn(mock_errorAlertService, 'openPopupModal').and.callThrough();
           vm.ContentUploadPopUpFromView(selectedProjectID, selectedNodeID, selectedNode);
           expect(mock_errorAlertService.openPopupModal).toHaveBeenCalled();
        });
        it('Should not show Upload pop up if TotalUploads are less than 5 but selected node is null', function() {
           var selectedProjectID = 1,selectedNodeID = "",selectedNode = {}; 
           $scope.contentView = { TotalUploads: 2 };
           spyOn(mock_errorAlertService, 'openPopupModal').and.callThrough();
           vm.ContentUploadPopUpFromView(selectedProjectID, selectedNodeID, selectedNode);
           expect(mock_errorAlertService.openPopupModal).toHaveBeenCalled();
        });
        it('Should  show Upload pop up if TotalUploads are less than 5', function() {
           var selectedProjectID = 1,selectedNodeID = "2",selectedNode = {}; 
           $scope.contentView = { TotalUploads: 2 };
           spyOn(mock$uibModal, 'open').and.callThrough();
           vm.ContentUploadPopUpFromView(selectedProjectID, selectedNodeID, selectedNode);
           expect(mock$uibModal.open).toHaveBeenCalled();
        });
        //vm.BeforeGridOptions

    });
})();
