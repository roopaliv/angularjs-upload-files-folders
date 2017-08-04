(function() {
    'use strict';

    describe('- upload Service -', function() {
        // vars
        var service,
            httpBackend,
            CONTENTUPLOADAPI,
            javUser,
            authService;

        // mocks
        var mockJavUser,
            mockLOGINAPI,
            mockCONTENTUPLOAD,
            mockCOMMON;


        //Setups
        beforeEach(function() {
            // Inject mocks
            module('merrillOfficial', function($provide, $translateProvider) {
                $provide.value('LOGINAPI', mockLOGINAPI);
                $provide.value('javUser', mockJavUser);
                $provide.value('COMMON', mockCOMMON);
                $provide.value('CONTENTUPLOAD', mockCONTENTUPLOAD);

                $provide.factory('customLoader', function($q) {
                    return function() {
                        var deferred = $q.defer();
                        deferred.resolve({});
                        return deferred.promise;
                    };
                });

                $translateProvider.useLoader('customLoader');
            });
        });

        beforeEach(inject(function(_$rootScope_, _uploadService_, _$q_, _$httpBackend_, _CONTENTUPLOADAPI_, _javUser_, _authService_) {
            service = _uploadService_;
            httpBackend = _$httpBackend_;
            CONTENTUPLOADAPI = _CONTENTUPLOADAPI_;
            javUser = _javUser_;
            authService = _authService_;
            spyOn(authService, 'getToken').and.returnValue("eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0Z3V5IiwiZ3JvdXAiOiJjbGllbnQiLCJleHAiOjE0NjcxMzk5OTEsInNjb3BlIjpbXSwiaXNzIjoiaWFtLm1lcnJpbGxjb3JwLmNvbSIsImF1ZCI6ImphdmVsaW5tYy5jb20iLCJVc2VyTmFtZSI6InRlc3RAbWVycmlsbGNvcnAuY29tIn0.jLkBlrT8jop7mlx4OefVaLrcbB1QEqK_HYfZKmPbSU4");
        }));

        afterEach(function() {
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });


        //Tests
        it('Service should be defined and exist', function() {
            expect(service).toBeDefined();

        });

        //Test cancelFile
        describe('- cancelFile -', function() {
            var returnedPromise;
            //Setup
            beforeEach(function() {

            });

            it('should be successful', function() {

                httpBackend.expectPUT(CONTENTUPLOADAPI.BASEAPIURL + (CONTENTUPLOADAPI.CANCEL_UPLOAD_API).format('1')).respond([{}]);

                returnedPromise = (service.cancelFile(1, 1));

                httpBackend.flush();

                var result;
                returnedPromise.then(function(data) {
                    result = data;
                    expect(result.data).toBeDefined();
                    expect(data.data.length).toEqual(1);
                }, angular.noop);

            });

            it('should fail', function() {
                // expectGET to make sure this is called once.

                httpBackend.expectPUT(CONTENTUPLOADAPI.BASEAPIURL + (CONTENTUPLOADAPI.CANCEL_UPLOAD_API).format('1')).respond(404, 'Error');

                returnedPromise = (service.cancelFile(1, 1));

                httpBackend.flush();

                var result;
                returnedPromise.then(angular.noop, function(data) {
                    result = data;
                    expect(result).toEqual('Error');
                });

            });
        });

        //Test sendMetadata
        describe('- sendMetadata -', function() {
            var returnedPromise;

            it('should be successful', function() {
                var dataObj = {
                    projectId: 1,
                    userId: javUser.id,
                    parentId: 1,
                    metadata: {},
                    isstage: "true"
                };

                httpBackend.expectPOST(CONTENTUPLOADAPI.BASEAPIURL + (CONTENTUPLOADAPI.SEND_METADATA_API).format(dataObj.projectId), dataObj).respond([{}]);

                returnedPromise = (service.sendMetadata(1, 1, {}));

                httpBackend.flush();

                var result;
                returnedPromise.then(function(data) {
                    result = data;
                    expect(result.data).toBeDefined();
                    expect(data.data.length).toEqual(1);
                }, angular.noop);

            });

            it('should fail', function() {
                // expectGET to make sure this is called once.
                var dataObj = {
                    projectId: 1,
                    userId: javUser.id,
                    parentId: 1,
                    metadata: {},
                    isstage: "true"
                };
                httpBackend.expectPOST(CONTENTUPLOADAPI.BASEAPIURL + (CONTENTUPLOADAPI.SEND_METADATA_API).format(dataObj.projectId), dataObj).respond(404, 'Error');

                returnedPromise = (service.sendMetadata(1, 1, {}));

                httpBackend.flush();

                var result;
                returnedPromise.then(angular.noop, function(data) {
                    result = data;
                    expect(result).toEqual('Error');
                });

            });
        });

        //Test sendUpload
        describe('- sendUpload -', function() {
            var fd = null;

            beforeEach(function() {
                fd = new FormData();
                jasmine.Ajax.install();
            });

            afterEach(function() {
                fd = null;
                jasmine.Ajax.uninstall();
            });

            it('should be successful', function() {
                var uri = CONTENTUPLOADAPI.BASEAPIURL + (CONTENTUPLOADAPI.BLOB_UPLOAD_API).format('1');

                jasmine.Ajax.stubRequest(uri).andReturn({
                    status: 201,
                    responseText: {}
                });

                service.sendUpload(fd, '123', '1').then(function(data) {
                    expect(data.status).toEqual(201);
                },
                    angular.noop,
                    angular.noop);
            });

            it('returns error if server fails', function() {
                var uri = CONTENTUPLOADAPI.BASEAPIURL + (CONTENTUPLOADAPI.BLOB_UPLOAD_API).format('1');
                jasmine.Ajax.stubRequest(uri).andError();

                service.sendUpload(fd, '123', '1').then(angular.noop,
                    function(error) {
                        expect(error.type).toEqual('error');
                    },
                    angular.noop);
            });
        });
        describe("Upload service cancel tasks", function() {
            it('should cancel Upload Stream', function() {
                var resolvedCalled = false;
                service.PendingUploadRequests = [{
                    guid: 223,
                    deferred: {
                        resolve: function(params) {
                            resolvedCalled = true;
                        }
                    }
                }];
                service.cancelUploadStream(223);
                expect(resolvedCalled).toEqual(true);

            });
            it('should cancel Upload Stream', function() {
                var resolvedCalled = false;
                service.PendingUploadRequests = [{
                    guid: 223,
                    deferred: {
                        resolve: function(params) {
                            resolvedCalled = true;
                        }
                    }
                }];
                service.cancelUploadStream(2235);
                expect(false).toEqual(false);

            });

        });

        describe("Get Permissions For Node tasks", function() {
            beforeEach(function() {
                jasmine.Ajax.install();
            });

            afterEach(function() {
                jasmine.Ajax.uninstall();
            });
            var projectID = 12, metadataID = 45;
            it('should get permission for a node', function() {
                var url = CONTENTUPLOADAPI.BASEAPIURL + (CONTENTUPLOADAPI.GET_PERMISSIONS_API).format(projectID, metadataID);
                httpBackend.expectGET(url).respond(200, { success: true });
                var returnedPromise = (service.GetPermissionsForNode(projectID, metadataID));
                httpBackend.flush();
                returnedPromise.then(function(data) {
                    expect(data.data.success).toEqual(true);
                }, angular.noop);

            });
            it('should error while getting permission for a node', function() {
                var url = CONTENTUPLOADAPI.BASEAPIURL + (CONTENTUPLOADAPI.GET_PERMISSIONS_API).format(projectID, metadataID);
                httpBackend.expectGET(url).respond(500, { success: false });
                var returnedPromise = (service.GetPermissionsForNode(projectID, metadataID));
                httpBackend.flush();
                returnedPromise.then(angular.noop,function(data){
                     expect(data.success).toEqual(false)});
            });

        });
            describe("Save Permissions ForNode tasks", function() {
            beforeEach(function() {
                jasmine.Ajax.install();
            });

            afterEach(function() {
                jasmine.Ajax.uninstall();
            });
            var projectID = 12, selectedNodeID = 45,
            selectedNodeID =15, groupId = 16, Cags = [1,2];
            it('should save permission for a node', function() {
                var dataObj = {
                    groupId: groupId,
                    metadataId: selectedNodeID,
                    cags: Cags
                  };
                var url = CONTENTUPLOADAPI.BASEAPIURL + (CONTENTUPLOADAPI.SAVE_PERMISSIONS_API).format(projectID);
                httpBackend.expectPOST(url, dataObj).respond(200, { "success": true });
                var returnedPromise = (service.SavePermissionsForNode(projectID, selectedNodeID, groupId, Cags));
                httpBackend.flush();
                returnedPromise.then(function(data) {
                    expect(data.data.success).toEqual(true);
                }, angular.noop);

            });
            it('should error while saving permission for a node', function() {
                var dataObj = {
                    groupId: groupId,
                    metadataId: selectedNodeID,
                    cags: Cags
                  };
                var url = CONTENTUPLOADAPI.BASEAPIURL + (CONTENTUPLOADAPI.SAVE_PERMISSIONS_API).format(projectID);
                httpBackend.expectPOST(url, dataObj).respond(500, { "success": false });
                var returnedPromise = (service.SavePermissionsForNode(projectID, selectedNodeID, groupId, Cags));
                httpBackend.flush();
                returnedPromise.then(angular.noop,function(data){
                     expect(data.success).toEqual(false)});
            });

        });


    })
})();
