(function() {
  'use strict';
        angular
          .module('merrillOfficial')
          .controller('ContentUploadPopupController', ContentUploadPopupController);
          ContentUploadPopupController.$inject = [ '$uibModal', '$scope', 'errorAlertService','$translate'];
          function ContentUploadPopupController($uibModal, $scope, errorAlertService,$translate) {
            window.onbeforeunload = function (event) {
              if($scope.contentView.TotalUploads>0)
              {
                var message = $translate.instant("contentUpload_confirmMessage");
                if (typeof event == 'undefined') {
                event = window.event;
                }
                if (event) {
                event.returnValue = message;
                }
                return message;
              }
            }
            $scope.$on('$locationChangeStart', function( event ) {
              if($scope.contentView.TotalUploads>0)
              {
                var answer = confirm($translate.instant("contentUpload_confirmMessage"))
                if (!answer) {
                event.preventDefault();
                }
              }
            });
            var vm = this;
            vm.ContentUploadPopUpFromView = ContentUploadPopUpFromView;
            vm.i = 0;
            function ContentUploadPopUpFromView(selectedProjectID, selectedNodeID, selectedNode) {
              if(selectedNodeID != '')
              {
                if($scope.contentView.TotalUploads < 5)
                {

                $scope.contentView.TotalUploads++;
                var modalScope = $scope.$parent.$new();
                modalScope.selectedProjectID = selectedProjectID;
                modalScope.selectedNodeID = selectedNodeID;
                modalScope.selectedNode = selectedNode;
                vm.i++;
                modalScope.UploadId = "upload"+ vm.i;
                modalScope.modalInstance =
                $uibModal.open({
                    templateUrl: 'app/contentUpload/contentUpload.html',
                    backdrop: 'static',
                    keyboard: false,
                    controller: ContentUploadController ,
                    scope:modalScope
                });
               }
               else{
                errorAlertService.openPopupModal($translate.instant("contentUpload_maxUploadSessions"));
               }

            }
            else {
              errorAlertService.openPopupModal($translate.instant("contentUpload_selectFileRoomToUpload"));
            }
           }
          }

      angular
        .module('merrillOfficial')
        .controller('ContentUploadController', ContentUploadController);
      /** @ngInject */
      ContentUploadController.$inject = ['$http','uploadService','$uibModal', '$scope', 'errorAlertService', 'CONTENTUPLOAD', 'COMMON', '$translate'];
      function ContentUploadController( $http, uploadService ,$uibModal, $scope, errorAlertService, CONTENTUPLOAD, COMMON, $translate) {
        var vm = this;
        vm.postUpload = postUpload;
        vm.dropClass = "dropzone";
        vm.filesArray = [];
        vm.guidFiles = [];
        vm.showUploadWidget = false;
        vm.showUpload = showUpload;
        vm.changeDropClass = changeDropClass;
        vm.pushFileToArray = pushFileToArray;
        vm.rootIndex = 1;
        vm.rootNumber = 0;
        vm.changeRootIndex = changeRootIndex;
        vm.changeRootNumber = changeRootNumber;
        vm.ArrayToBeSent = [];
        vm.TreeArrayToBeSent = [];
        vm.TotalUploadAllowed = CONTENTUPLOAD.MAXIMUM_UPLOAD_SIZE;
        vm.TotalSpaceUsed =0.0;
        vm.FilesViolatingSize = [];
        vm.FilesViolatingTitle = [];
        vm.TotalZipFiles = 0;
        vm.Stage="before";
        vm.GoToPermissions=GoToPermissions;
        vm.GoToConfirm=GoToConfirm;
        vm.GoToProgress=GoToProgress;
        vm.ItemsUploadedSuccessfully = 0;
        vm.ItemsUploadError = 0;
        vm.deleteFromFileToArray = deleteFromFileToArray;
        vm.selectedProjectID = "";
        vm.selectedNodeID = "";
        vm.selectedNode = "";
        vm.UploadFinished = UploadFinished;
        vm.ClearFiles = ClearFiles;
        vm.UploadCancelled = false;
        vm.CancelUpload = CancelUpload;
        vm.CancelOngoingUpload = CancelOngoingUpload;
        vm.cancelUploadForFile = cancelUploadForFile;
        vm.FilesCancelled = 0;
        vm.Hidden = false;
        vm.isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
        vm.isEmptyFolder = false;
        vm.CheckForEmptyFolders = CheckForEmptyFolders;
        vm.selectedProjectID = $scope.selectedProjectID;
        vm.selectedNodeID = $scope.selectedNodeID;
        vm.selectedNode = $scope.selectedNode;
        vm.UploadId = $scope.UploadId
        vm.HideUnhideUpload = HideUnhideUpload;
        vm.CloseUpload = CloseUpload;
        vm.PermissionsList = [];
        vm.FinalPermissionsData = [];
        vm.SavePermissions = SavePermissions;
        vm.CancelPermissions = CancelPermissions;
        vm.ShowBrowseSpinner = false;
        angular.element( document.querySelector('#UploadWrapper') ).append(angular.element( document.querySelector('.modal')));
        angular.element( document.querySelector('#UploadWrapper') ).append(angular.element( document.querySelector('#UploadProgressCountDiv')));
        vm.BeforeGridOptions = {
          data: vm.filesArray,
          columnDefs: [
            { field:'fileNameWoExt', headerCellClass: 'hideShortingbtn', cellClass:'documentName', displayName:'uploadviewGrid_fileName', cellTemplate: '<span class="ui-grid-cell-contents" ng-show="row.entity.isZip != true" ><i class="fa fa-file-o"></i>{{  COL_FIELD }}</span><span ng-show="row.entity.isZip == true"  class="zipName ui-grid-cell-contents"><i class="fa fa-folder"></i>{{  COL_FIELD }}</span>',headerCellFilter : 'translate' },
              { field:'isZip', headerCellClass: 'hideShortingbtn', cellClass:'fileExt', displayName:'uploadviewGrid_folderAction', width: 200, cellTemplate: '<span class="ui-grid-cell-contents" ng-model="row.entity.zipAction"   ng-show="row.entity.isZip == true" class="ui-grid-cell-contents"><select ng-model="row.entity.zipAction" class="form-control input-sm">  <option value="2" selected>Maintain Folder Structure</option><option value="1">Files only</option>  <option value="0">Keep as Zip</option></select></span>' , headerCellFilter : 'translate' },
            { field:'file.size', headerCellClass: 'hideShortingbtn', displayName:'uploadviewGrid_fileSize', width:100, cellClass:'fileExt', cellTemplate: '<span class="ui-grid-cell-contents">{{ (COL_FIELD/1024<6) ? 0.01 :( COL_FIELD / (1024*1024) ) | number:2}} MB</span>' ,  headerCellFilter : 'translate'},
            { field:'extension', headerCellClass: 'hideShortingbtn', cellClass:'fileExt filetype', width:70, displayName:'uploadviewGrid_fileType' ,  headerCellFilter : 'translate' },
            { field:'uStatus', headerCellClass: 'hideShortingbtn', displayName:'', width:50, cellTemplate: '<span class="ui-grid-cell-contents text-center"><a class="deleteLinkicon" ng-click="grid.appScope.contentUpload.deleteFromFileToArray(row.entity)"><i class="fa fa-trash"></i></a></span>' ,  headerCellFilter : 'translate' }
          ],
          multiSelect: false,
          enableRowSelection: true,
          enableRowHeaderSelection: false,
          enableColumnResizing: true,
          modifierKeysToMultiSelect: false,
          enableSorting: false,
          enableFiltering: false,
          enableSelectAll: true,
          showGridFooter: false,
          enableColumnMenus: false,
          enableFullRowSelection: false,
          selectWithCheckboxOnly: false,
          enableHorizontalScrollbar:0,
          onRegisterApi: function(gridApi){
    				vm.gridApi = gridApi;
    			}
        };
        vm.ConfirmGridOptions = {
          data: vm.filesArray,
          columnDefs: [
            { field:'fileNameWoExt', headerCellClass: 'hideShortingbtn', cellClass:'documentName', displayName:'confirmGridGrid_fileName', cellTemplate: '<span class="ui-grid-cell-contents" ng-show="row.entity.isZip != true" ><i class="fa fa-file-o"></i>{{  COL_FIELD }}</span><span ng-show="row.entity.isZip == true"  class="zipName ui-grid-cell-contents"><i class="fa fa-folder"></i>{{  COL_FIELD }}</span>' , headerCellFilter : 'translate' },
            { field:'file.size', headerCellClass: 'hideShortingbtn', cellClass:'fileExt', displayName:'confirmGrid_fileSize', width:120 , headerCellFilter : 'translate', cellTemplate: '<span class="ui-grid-cell-contents">{{ (COL_FIELD/1024<6) ? 0.01 :( COL_FIELD / (1024*1024) ) | number:2}} MB</span>'},
            { field:'extension', headerCellClass: 'hideShortingbtn', cellClass:'fileExt filetype', width:100, displayName:'confirmGrid_fileType' , headerCellFilter : 'translate'}
          ],
          multiSelect: false,
          enableRowSelection: false,
          enableRowHeaderSelection: false,
          enableColumnResizing: true,
          modifierKeysToMultiSelect: false,
          enableSorting: false,
          enableFiltering: false,
          enableSelectAll: false,
          showGridFooter: false,
          enableColumnMenus: false,
          enableFullRowSelection: false,
          selectWithCheckboxOnly: false,
          enableHorizontalScrollbar:0
        };
        vm.ProgressGridOptions = {
          data: vm.filesArray,
          columnDefs: [
            { field:'fileNameWoExt', headerCellClass: 'hideShortingbtn', cellClass:'documentName', displayName:'progressGrid_fileName', cellTemplate: '<span class="ui-grid-cell-contents" ng-show="row.entity.isZip != true" ><i class="fa fa-file-o"></i>{{  COL_FIELD }}</span><span ng-show="row.entity.isZip == true"  class="zipName ui-grid-cell-contents"><i class="fa fa-folder"></i>{{  COL_FIELD }}</span>' , headerCellFilter : 'translate'},
            { field:'percentCompleted', headerCellClass: 'hideShortingbtn', width: 200, displayName:'progressGrid_status', cellTemplate: ' <div class="ui-grid-cell-contents text-center" ng-show="row.entity.cancelled != true"> <uib-progressbar class="progress-striped active" max="100" value="row.entity.percentCompleted" type="success"> &nbsp;  </uib-progressbar></div> <span class="ui-grid-cell-contents text-center" ng-show="row.entity.cancelled">Cancelled</span>' , headerCellFilter : 'translate' },
            { field:'file.size', displayName:'progressGrid_fileSize', headerCellClass: 'hideShortingbtn', cellClass:'fileExt', width:100, cellTemplate: '<span class="ui-grid-cell-contents">{{ (COL_FIELD/1024<6) ? 0.01 :( COL_FIELD / (1024*1024) ) | number:2}} MB</span>' , headerCellFilter : 'translate'},
            { field:'extension', width:70, headerCellClass: 'hideShortingbtn', cellClass:'fileExt filetype', displayName:'progressGrid_fileType' , headerCellFilter : 'translate' },
            { field:'uStatus', cellClass:'fileExt', displayName:' ', width:100, cellTemplate: '<span class="ui-grid-cell-contents text-center"><a class="cancleLink" ng-show="row.entity.cancelled != true && (row.entity.uStatus == \'Ready\' || row.entity.uStatus == \'InProgress\')" ng-click="grid.appScope.contentUpload.cancelUploadForFile(row.entity)">CANCEL</a></span>' , headerCellFilter : 'translate' }
          ],
          multiSelect: false,
          virtualizationThreshold: 250,
          enableRowSelection: true,
          enableRowHeaderSelection: false,
          enableColumnResizing: true,
          modifierKeysToMultiSelect: false,
          enableSorting: false,
          enableFiltering: false,
          enableSelectAll: true,
          showGridFooter: false,
          enableColumnMenus: false,
          enableFullRowSelection: false,
          selectWithCheckboxOnly: false,
          enableHorizontalScrollbar:0,
          onRegisterApi: function(gridApi){
    				vm.gridApi = gridApi;
    			}
        };
        vm.SummaryGridOptions = {
          data: vm.filesArray,
          columnDefs: [
            { field:'fileNameWoExt', headerCellClass: 'hideShortingbtn', cellClass:'documentName', displayName:'summaryGrid_fileName', cellTemplate: '<span class="ui-grid-cell-contents" ng-show="row.entity.isZip != true" ng-class="{\'errorColor\': row.entity.uStatus == \'Error\' && row.entity.cancelled != true}"><i class="fa fa-file-o"></i>{{  COL_FIELD }}</span><span ng-show="row.entity.isZip == true" class="zipName ui-grid-cell-contents" ng-class="{\'errorColor\': row.entity.uStatus == \'Error\' && row.entity.cancelled != true}"><i class="fa fa-folder"></i>{{  COL_FIELD }}</span>',  headerCellFilter : 'translate' },
            { field:'uStatus', displayName:'summaryGrid_status', headerCellClass: 'hideShortingbtn', width:125, cellTemplate:'<span class="ui-grid-cell-contents text-center" ng-show="row.entity.uStatus != \'Error\' && row.entity.cancelled != true"  ><i class="successColor fa fa-check"></i></span><span class="ui-grid-cell-contents text-center"  title="{{ row.entity.errMsg }}" ng-show="row.entity.uStatus == \'Error\' && row.entity.cancelled != true"  ><i class="errorColor fa fa fa-close"></i></span><span class="ui-grid-cell-contents text-center" title="{{ row.entity.errMsg }}" ng-show="row.entity.cancelled == true"  >Cancelled</span>' ,  headerCellFilter : 'translate'},
            { field:'file.size', displayName:'summaryGrid_fileSize', headerCellClass: 'hideShortingbtn', cellClass:'fileExt', width:120, cellTemplate: '<span class="ui-grid-cell-contents" ng-show="row.entity.uStatus != \'Error\'" >{{ (COL_FIELD/1024<6) ? 0.01 :( COL_FIELD / (1024*1024) ) | number:2}} MB</span><span class="ui-grid-cell-contents" ng-show="row.entity.uStatus == \'Error\'"  class="errorColor">{{ (COL_FIELD/1024<6) ? 0.01 :( COL_FIELD / (1024*1024) ) | number:2}} MB</span>' ,  headerCellFilter : 'translate'},
            { field:'extension', width:100, headerCellClass: 'hideShortingbtn', cellClass:'fileExt filetype', displayName:'summaryGrid_fileType', cellTemplate: '<span class="ui-grid-cell-contents" ng-show="row.entity.uStatus != \'Error\'" >{{  COL_FIELD }}</span><span class="ui-grid-cell-contents" ng-show="row.entity.uStatus == \'Error\'"  class="errorColor">{{  COL_FIELD }}</span>' , headerCellFilter : 'translate'}
          ],
          multiSelect: false,
          enableRowSelection: false,
          enableRowHeaderSelection: false,
          enableColumnResizing: true,
          modifierKeysToMultiSelect: false,
          enableSorting: false,
          enableFiltering: false,
          enableSelectAll: false,
          showGridFooter: false,
          enableColumnMenus: false,
          enableFullRowSelection: false,
          selectWithCheckboxOnly: false,
          enableHorizontalScrollbar:0
        };
        function CancelPermissions() {
          vm.isEdit = false;
          vm.PermissionsList = angular.copy(vm.FinalPermissionsData);
        }
        function SavePermissions() {
          vm.isEdit = false;
          vm.FinalPermissionsData = angular.copy(vm.PermissionsList);
        }
        function CheckForEmptyFolders(){
          if(vm.isEmptyFolder)
           errorAlertService.openPopupModal($translate.instant("contentView_appErrorMsg"));
        }
        function HideUnhideUpload(){
         vm.Hidden = !(vm.Hidden);
         if(vm.Hidden)
         {
            (((document.getElementById(vm.UploadId).parentNode).parentNode).parentNode).classList.add('UploadPopupMinimized');
            $scope.contentView.TotalUploadsMinimized++;
         }
         else{
            (((document.getElementById(vm.UploadId).parentNode).parentNode).parentNode).classList.remove('UploadPopupMinimized');
            $scope.contentView.TotalUploadsMinimized--;
         }
        }
        function CancelOngoingUpload(){
          vm.UploadCancelled = true;
          angular.forEach(vm.filesArray, function (fileObject, guidindex) {
            if(fileObject.uStatus == 'InProgress')
               fileObject.cancelled = true;
          });
          filesCancelled();
          vm.Stage = "before";
          ClearFiles();
          $scope.contentView.TotalUploads--;
          $scope.modalInstance.close("");
        }
        function CancelUpload(){
          $uibModal.open({
            templateUrl: 'CancelUpload.html',
            backdrop: 'static',
            controller: ['$uibModalInstance',  addCancelUploadController],
            controllerAs: 'cancelConfirm',
            scope: $scope,
            resolve: {            }
          });
        }
        function CloseUpload(){
          vm.ClearFiles();
          $scope.contentView.TotalUploads--;
        }
        function addCancelUploadController($uibModalInstance){
            var pop = this;
            pop.CallCancelUpload = CallCancelUpload;
            function CallCancelUpload()
            {
              $scope.contentUpload.CancelOngoingUpload();
              $uibModalInstance.close();
            }
          }

        function GoToPermissions(isBackStep){
        if(isBackStep){
                    vm.Stage = 'before';
        }
        else{
          vm.ArrayToBeSent = [];
          if(vm.filesArray.length >0)
          {
               angular.forEach(vm.filesArray, function (fileObject, guidindex) {
                if(!fileObject.isViolatingFileSize  && !fileObject.isViolatingFileTitle)
                vm.ArrayToBeSent.push({ name: fileObject.fileNameProcessed, index: fileObject.index, isplaceholder: "0", type:fileObject.type, parent: (parent==vm.rootIndex? '0' : parent), fileSize: fileObject.file.size, fileOperation: fileObject.zipAction});
               });
                uploadService.GetPermissionsForNode(vm.selectedProjectID, vm.selectedNodeID).then(function(returnedVals) {
                   if(returnedVals.data.length > 0){
                        vm.PermissionsList = angular.copy(returnedVals.data);
                        vm.FinalPermissionsData =  angular.copy(returnedVals.data);
                        vm.Stage="permissions";
                   }
                   else {
                        GoToConfirm();
                   }
            });
              }
          else {
            errorAlertService.openPopupModal($translate.instant("contentUpload_selectFileToUpload"));
          }
         }
        }
        function GoToConfirm(){
          vm.Stage="confirm";
          vm.ConfirmGridOptions.data = vm.filesArray;
          if(vm.TotalZipFiles != 0){
          vm.ConfirmGridOptions = {
          data: vm.filesArray,
         // { field:'isZip', headerCellClass: 'hideShortingbtn', cellClass:'fileExt', displayName:'uploadviewGrid_folderAction', width: 200, cellTemplate: '<span class="ui-grid-cell-contents" ng-model="row.entity.zipAction"   ng-show="row.entity.isZip == true" class="ui-grid-cell-contents"><select ng-model="row.entity.zipAction" class="form-control input-sm">  <option value="2" selected>Maintain Folder Structure</option><option value="1">Files only</option>  <option value="0">Keep as Zip</option></select></span>' , headerCellFilter : 'translate' },
          columnDefs: [
            { field:'fileNameWoExt', displayName:'FILE NAME', headerCellClass: 'hideShortingbtn', cellClass:'documentName', cellTemplate: '<span class="ui-grid-cell-contents" ng-show="row.entity.isZip != true" ><i class="fa fa-file-o"></i>{{  COL_FIELD }}</span><span ng-show="row.entity.isZip == true"  class="zipName ui-grid-cell-contents"><i class="fa fa-folder"></i>{{  COL_FIELD }}</span>' },
            { field:'zipAction', headerCellClass: 'hideShortingbtn', width: 200, cellClass:'fileExt', displayName:'COMPRESSED FOLDER ACTION',
            cellTemplate: '<span class="ui-grid-cell-contents" ng-switch on="row.entity.zipAction"><span ng-switch-when = "2">Maintain Folder Structure</span><span ng-switch-when = "1">Files only</span><span ng-switch-when = "0">Keep as Zip</span></span>'},
            { field:'file.size', displayName:'SIZE', width:100, cellClass:'fileExt', cellTemplate: '<span class="ui-grid-cell-contents">{{ (COL_FIELD/1024<6) ? 0.01 :( COL_FIELD / (1024*1024) ) | number:2}} MB</span>'},
            { field:'extension', headerCellClass: 'hideShortingbtn', width:90, cellClass:'fileExt filetype', displayName:'FILE TYPE' }
          ],
          multiSelect: false,
          enableRowSelection: false,
          enableRowHeaderSelection: false,
          enableColumnResizing: true,
          modifierKeysToMultiSelect: false,
          enableSorting: false,
          enableFiltering: false,
          enableSelectAll: false,
          showGridFooter: false,
          enableColumnMenus: false,
          enableFullRowSelection: false,
          selectWithCheckboxOnly: false,
          enableHorizontalScrollbar:0
        };
          }
        }
        function GoToProgress(){
          $scope.contentView.UploadsInProgress++;
          vm.Stage="progress";
          vm.ProgressGridOptions.data = vm.filesArray;
          postUpload();
        }
        function GoToSummary(){
            $scope.contentView.UploadsInProgress--;
            if(!(vm.Hidden)){
                vm.Stage= "summary";
                vm.SummaryGridOptions.data = vm.filesArray;
            }
            else{
                $scope.contentView.TotalUploadsMinimized--;
                $scope.modalInstance.close("");
                UploadFinished();
            }
        }
        function ClearFiles(){
            vm.ArrayToBeSent = [];
            vm.filesArray = [];
            vm.ItemsUploadedSuccessfully = 0;
            vm.ItemsUploadError = 0;
            vm.TotalSpaceUsed = 0;
        }
        function UploadFinished(){
          ClearFiles();
          $scope.contentView.TotalUploads--;
          $scope.contentView.RefreshData(vm.selectedProjectID, vm.selectedNodeID, vm.selectedNode);
        }
        function pushFileToArray(file, path, index, type, parent) {
          var isZip= false;
          var zipAction = "";
          var isViolatingFileSize= false;
          var isViolatingFileTitle= false;
          var uStatus = "Ready";
          var errMsg = "";
          var extension = "";
          var fileName = file.name;
          var fileNameProcessed = file.name;
          zipAction = '0';
          if(fileName.indexOf(".") != -1)
          {
            var extArray = fileName.split('.');
            extension = extArray.pop().toLowerCase();
            fileName = extArray.join('.');
          }
          if(type!= 'D')
          {
            vm.TotalSpaceUsed = vm.TotalSpaceUsed + (file.size / (1024*1024*1024));
            if((fileName.length)> 100)
            {
              fileName = fileName.substring(0, 100);
              fileNameProcessed = fileName + '.'+ extension;
            }
            if((file.size/ (1024*1024) )> 1024)
            {
              isViolatingFileSize = true;
              uStatus = "Error";
              vm.ItemsUploadError++;
              errMsg = fileNameProcessed +  " " + $translate.instant("contentUpload_fileSizeLimit");
            }
            if(extension == '7z' || extension == 'zip' || extension == 'rar'  || extension == 'gz' || extension == 'bz2' || extension == 'tar')
            {
              isZip = true;
              zipAction = '2';//$translate.instant("contentView_maintainFolderStructure");
              vm.TotalZipFiles = vm.TotalZipFiles + 1;
            }
            angular.element(document.querySelector('#'+'dropzone_' + vm.UploadId)).addClass('upload-minbox');
            vm.filesArray.push( {file:file, path:path,  type: type, index: index, isZip: isZip,
            zipAction: zipAction, guid: "", mongoId:"", cancelled: false, chunksUploaded: 0, totalChunks: 1, percentCompleted: 0,
            uStatus : uStatus, errMsg : errMsg, fileNameProcessed: fileNameProcessed, fileNameWoExt: fileName,
            isViolatingFileSize:isViolatingFileSize, isViolatingFileTitle:isViolatingFileTitle,   extension:extension,
            parent: (parent==vm.rootIndex? null : parent)});
            vm.BeforeGridOptions.data = vm.filesArray;
          }

        }

        function cancelUploadForFile(file) {
          var index = vm.filesArray.indexOf(file);
          vm.filesArray[index].cancelled = true;
          vm.FilesCancelled++;
          if(vm.ItemsUploadError + vm.ItemsUploadedSuccessfully == (vm.filesArray.length-vm.FilesCancelled))
            GoToSummary();
          var cancelMetaDataId = [];
           cancelMetaDataId.push(file.mongoId);
           uploadService.cancelUploadStream(file.guid);
           uploadService.cancelFile(cancelMetaDataId, vm.selectedProjectID).then(function(returnedVals) {
          });
        }
        function deleteFromFileToArray(file) {
          vm.filesArray.splice(vm.filesArray.indexOf(file), 1);
          vm.TotalSpaceUsed =  (vm.TotalSpaceUsed - (file.file.size / (1024*1024*1024)));
          if(file.isZip)
            vm.TotalZipFiles--;
        }
        function changeRootNumber(changedVal) {
          vm.rootNumber = changedVal;
        }
        function changeRootIndex(changedVal) {
          vm.rootIndex = changedVal;
        }
        function changeDropClass(changedVal) {
          vm.dropClass = changedVal;
        }
        function showUpload() {
          document.getElementById('file_' + vm.UploadId).click();
        }

        function filesCancelled(){
          var cancelMetaDataId = [];
          angular.forEach(vm.filesArray, function (fileObject, fileindex) {
            if(fileObject.uStatus != "Error" && fileObject.cancelled)
            {
                  cancelMetaDataId.push(fileObject.mongoId);
                  uploadService.cancelUploadStream(fileObject.guid);
            }
           });
           if(cancelMetaDataId.length != 0)
           {
           uploadService.cancelFile(cancelMetaDataId, vm.selectedProjectID).then(function(returnedVals) {
             $scope.contentView.RefreshData(vm.selectedProjectID, vm.selectedNodeID, vm.selectedNode);
           });
         }

        }

        function postUpload() {
            if(vm.TotalSpaceUsed > vm.TotalUploadAllowed)
            {
              var msg = $translate.instant("contentUpload_fileSelectedSizeLimit");
              errorAlertService.openPopupModal(msg.format(vm.TotalUploadAllowed));
            }
            else{
              if(vm.ArrayToBeSent.length !=0)
              {
              uploadService.sendMetadata(vm.selectedProjectID, vm.selectedNodeID, vm.ArrayToBeSent).then(function(returnedVals)
              {
                if(returnedVals.status == 201)
                {
                  uploadService.SavePermissionsForNode(vm.selectedProjectID, vm.selectedNodeID, returnedVals.data.groupId, vm.FinalPermissionsData).then(function(returnedVals){
                  });
                  vm.guidFiles = returnedVals.data.files;
                  angular.forEach(vm.filesArray, function (fileObject, fileindex) {
                  if(vm.UploadCancelled == false && !fileObject.cancelled)
                  {
                    if(fileObject.uStatus != "Error")
                    {
                       fileObject.uStatus = "InProgress";
                       var fd = new FormData();
                       angular.forEach(vm.guidFiles, function (guidObject, guidindex) {
                         if(guidObject.index == fileObject.index)
                         {
                            fileObject.guid = guidObject.docId;
                            fileObject.mongoId = guidObject.id;
                         }
                       });
                      fd.append('filestream', fileObject.file);   fd.append('docId', fileObject.guid);   fd.append('projectId', vm.selectedProjectID);  fd.append('groupId', returnedVals.data.groupId); fd.append('metadataId', fileObject.mongoId);
                      uploadService.sendUpload(fd, fileObject.guid, vm.selectedProjectID,fileObject).then(function(returnedVals) {
                      if(returnedVals.status == 201)
                      {
                        if(!fileObject.cancelled)
                        {
                           fileObject.percentCompleted = 100;
                           fileObject.uStatus = "Completed";
                           vm.ItemsUploadedSuccessfully++;
                        }
                      }
                      else{
                        fileObject.uStatus = "Error";
                        fileObject.erMsg = $translate.instant("appErrorMsg");
                        vm.ItemsUploadError++;
                        var cancelMetaData = [];
                        cancelMetaData.push(fileObject.mongoId);
                        uploadService.cancelFile(cancelMetaData, vm.selectedProjectID).then(function(returnedVals) {
                        });
                      }
                      if(vm.ItemsUploadError + vm.ItemsUploadedSuccessfully == (vm.filesArray.length-vm.FilesCancelled))
                      {
                        GoToSummary();
                      }
                    }, function (error) {
                        fileObject.uStatus = "Error";
                        fileObject.erMsg = $translate.instant("appErrorMsg");
                        vm.ItemsUploadError++;
                        var cancelMetaData = [];
                        cancelMetaData.push(fileObject.mongoId);
                        uploadService.cancelFile(cancelMetaData, vm.selectedProjectID).then(function(returnedVals) {
                        });
                        if(vm.ItemsUploadError + vm.ItemsUploadedSuccessfully == (vm.filesArray.length-vm.FilesCancelled))
                        {
                            GoToSummary();
                        }
                      }, function(progress){
                          fileObject.percentCompleted = progress;
                      }
                    );
                  }
                }
                else{
                  return;
                }
                   });
                }
                else{
                errorAlertService.openPopupModal($translate.instant("appErrorMsg"));
                }
            }, function (error) {
                errorAlertService.openPopupModal($translate.instant("appErrorMsg"));
              }
            );
          }
          else {
            GoToSummary();
          }
           }
           if(vm.ItemsUploadError + vm.ItemsUploadedSuccessfully == (vm.filesArray.length-vm.FilesCancelled))
             GoToSummary();
          }
        // Unused block  
        //   function guid() {
        //         function s4() {
        //           return Math.floor((1 + Math.random()) * 0x10000)
        //             .toString(16)
        //             .substring(1);
        //         }
        //         return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        //           s4() + '-' + s4() + s4() + s4();
        //       }
          }


})();
