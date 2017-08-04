(function() {
  'use strict';

  angular
    .module('merrillOfficial')
    .service('uploadService', uploadService);

  /** @ngInject */
  uploadService.$inject = ['$q', '$timeout', '$http', 'CONTENTUPLOAD', 'COMMON' , 'javUser', 'CONTENTUPLOADAPI', 'authService'];
  function uploadService($q, $timeout, $http, CONTENTUPLOAD, COMMON , javUser, CONTENTUPLOADAPI, authService){
    var vm = this;
    vm.sendUpload = sendUpload;
    vm.sendMetadata = sendMetadata;
    vm.cancelFile = cancelFile;
    vm.cancelUploadStream = cancelUploadStream;
    vm.GetPermissionsForNode = GetPermissionsForNode;
    vm.SavePermissionsForNode = SavePermissionsForNode;
    vm.PendingUploadRequests = [];
    function cancelFile(cancelMetaDataId, projectId){
        // var dataObj = {
        //   cancelMetaDataId: cancelMetaDataId,
        //   projectId: projectId
        // };
        var deferred = $q.defer();
          $http({
              method: 'PUT',
              url: CONTENTUPLOADAPI.BASEAPIURL + (CONTENTUPLOADAPI.CANCEL_UPLOAD_API).format(projectId),
              //params: dataObj
              data: cancelMetaDataId
          }).success(function (data) {
              deferred.resolve({'data':data, 'status': status});
          }).error(function (msg) {
              deferred.reject(msg);
          })
          return deferred.promise;
    }
    function sendMetadata(projectId, parentId, json){
      var deferred = $q.defer();
      var ajaxUrl = CONTENTUPLOADAPI.BASEAPIURL + (CONTENTUPLOADAPI.SEND_METADATA_API).format(projectId);
      //ajaxUrl ='/sendMetadata';
      var dataObj = {
            projectId: projectId,
            userId: javUser.id,
            parentId: parentId,
            metadata: json,
            isstage : "true"
      };
        $http({
            method: 'POST',
            url: ajaxUrl,
            data: dataObj,
            ignoreProgress: true
        }).success(function (data, status, header) {
            deferred.resolve({'data':data, 'status': status});
        }).error(function (error) {
          deferred.reject(error);
        })
        return deferred.promise;
    }

    function cancelUploadStream(guid){
      angular.forEach(vm.PendingUploadRequests, function (guidObject, guidindex) {
        if(guidObject.guid === guid){
          guidObject.deferred.resolve({'data':'', 'status': '201'}); //guidObject.deferred.reject('');
          vm.PendingUploadRequests.splice(guidindex, 1);
        }
      });
    }

    function sendUpload(fd, guid, projectId,fileObj){
      var deferred = $q.defer();
      var ajaxUrl = CONTENTUPLOADAPI.BASEAPIURL + (CONTENTUPLOADAPI.BLOB_UPLOAD_API).format(projectId);
      //ajaxUrl = "/sendFiles";
      var pendingRequest = { deferred: deferred, guid: guid };
      function onloadCallback() {
          vm.PendingUploadRequests.splice(vm.PendingUploadRequests.indexOf(pendingRequest), 1);
      }
      function errorCB() {
          vm.PendingUploadRequests.splice(vm.PendingUploadRequests.indexOf(pendingRequest), 1);
           
      }
      var _blob = new uploadChunk(fileObj, deferred, onloadCallback,errorCB);
      //pendingRequest.blobToUpload = _blob;
      vm.PendingUploadRequests.push(pendingRequest);
      _blob.nextByte();
    //   var token = authService.getToken();
    //   var xhr = new XMLHttpRequest;
    //         xhr.upload.onprogress = function (e) {
    //             var TotalPercent = Math.round(e.loaded / e.total * 100);
    //             deferred.notify( TotalPercent>90 ? 90: TotalPercent);
    //         };
    //         xhr.onload = function (e) {
    //                 vm.PendingUploadRequests.splice(vm.PendingUploadRequests.indexOf(pendingRequest), 1);
    //                 deferred.resolve({'data':'', 'status': xhr.status});
    //         };
    //         xhr.onerror = function (e) {
    //             vm.PendingUploadRequests.splice(vm.PendingUploadRequests.indexOf(pendingRequest), 1);
    //             deferred.reject(e);
    //         };
    //         xhr.open('POST', CONTENTUPLOADAPI.BASEAPIURL + (CONTENTUPLOADAPI.BLOB_UPLOAD_API).format(projectId));
    //         xhr.setRequestHeader("Authorization", "Bearer " + token);
    //         xhr.timeout = deferred.promise;
    //         xhr.send(fd);
        return deferred.promise;
    }

    function GetPermissionsForNode(projectID, metadataID){
      var deferred = $q.defer();
      var ajaxUrl = CONTENTUPLOADAPI.BASEAPIURL + (CONTENTUPLOADAPI.GET_PERMISSIONS_API).format(projectID, metadataID);
        $http({
            method: 'GET',
            url: ajaxUrl,
            ignoreProgress: true
        }).success(function (data, status, header) {
            deferred.resolve({'data':data, 'status': status});
        }).error(function (error) {
            deferred.reject(error);
        })
        return deferred.promise;
    }

    function SavePermissionsForNode(projectID, selectedNodeID, groupId, Cags){
          var deferred = $q.defer();
          var ajaxUrl = CONTENTUPLOADAPI.BASEAPIURL + (CONTENTUPLOADAPI.SAVE_PERMISSIONS_API).format(projectID);
          var dataObj = {
                groupId: groupId,
                metadataId: selectedNodeID,
                cags: Cags
          };
          $http({
              method: 'POST',
              url: ajaxUrl,
              contentType:'application/json',
              ignoreProgress: true,
              data: dataObj
          }).success(function (data, status, header) {
              deferred.resolve({'data':data, 'status': status});
          }).error(function (error) {
              deferred.reject(error);
          })
          return deferred.promise;
    }
    /************************ chunk code Model  */
        function uploadChunk(blob,deferred,onloadCallback,errorCB) {
        var self = this;
        this.BYTES_PER_CHUNK;
        this.SIZE;
        this.isCompleted = false;
        this.NUM_CHUNKS
        this.start;
        this.end;
        this.isFailed;
        this.chunk;
        this.BYTES_PER_CHUNK = 2097152;//1048576; 1mb
        this.SIZE = blob.size;
        this.NUM_CHUNKS = Math.max(Math.ceil(this.SIZE / this.BYTES_PER_CHUNK), 1);
        this.start = 0;
        this.chunk = 0;
        this.end = this.BYTES_PER_CHUNK;
        this.name = blob.name;
        this.blob = blob;
        this.isFailed = false;
        this.deferred = deferred;
        this.onloadCallback = onloadCallback;
        this.errorCB = errorCB;
        this.failed = function () {
            self.isFailed = true;
            console.log("failed for chunk "+self.chunk + " of "+ self.name);
            alert("failed chunk");
        }
        this.onerror = function(e){
            self.errorCB && self.errorCB();
            deferred.reject(e);
        }
        this.nextByte = function nextByte() {
            if (self.start < self.SIZE) {
                if (!self.isFailed) {
                    console.log("file <" + self.name + " > :: sending " + self.chunk + " out of " + self.NUM_CHUNKS);
                    upload(self.blob.slice(self.start, self.end), self.NUM_CHUNKS, self.name, self.chunk++, self.failed, self.nextByte,self.onerror);
                    self.start = self.end;
                    self.end = self.start + self.BYTES_PER_CHUNK;
                } else {
                    alert(self.chunk + "failed");
                }
            } else {
                console.log("Completed file < " + self.name + " >");
                self.isCompleted = true;
                self.onloadCallback && self.onloadCallback();
                //self.deferred.notify(100);
                self.deferred.resolve({'data':'', 'status': "TODO"});
            }
        }
        //nextByte(true, SIZE, start);
            
    }
    function upload(blobOrFile, chunks, name, chunk, failed, nextByte,errorCB) {
        var fd = new FormData();
        var token = authService.getToken();
        fd.append("name", name);
        fd.append('chunk', chunk);
        fd.append('chunks', chunks);
        fd.append('file', blobOrFile);
        
        fd.append('time', new Date().getTime());
        fd.append('user', "temp");
        var xhr;
        xhr = new XMLHttpRequest();
        var url = 'http://test-blobupload-service.apps.javelinmc.com/api/blob/upload/file';
        xhr.setRequestHeader("Authorization", "Bearer " + token);
        xhr.timeout = deferred.promise;
        xhr.open('POST', url);
        xhr.upload.onprogress = function (e) {
            if (e.lengthComputable) {
                var TotalPercent = Math.round(e.loaded / e.total * 100);
                deferred.notify( TotalPercent> 90 ? 90: TotalPercent);
            }
        };
        xhr.onload = function () {
            // check if upload made itself through
            if (xhr.status >= 400) {
                failed();
                return;
            }
            console.log("file <" + name  + " > :: done sending " + chunk + " out of "+chunks);
            setTimeout(function () {
                nextByte(true);
            }, 1);
        }
        xhr.onloadend = function (e) {
            xhr = null;
        };
        xhr.onerror = function(e) {
            errorCB && errorCB(e);
            
        };
        xhr.send(fd);
    };
}
})();
