(function () {
  'use strict';

  angular.module('exceptionless.project-filter', [
    'angular.filter',

    'exceptionless.auto-active',
    'exceptionless.organization',
    'exceptionless.project',
    'exceptionless.refresh',
    'exceptionless.show-on-hover-parent'
  ])
  .directive('projectFilter', [function () {
    return {
      restrict: 'E',
      replace: true,
      scope: true,
      templateUrl: 'components/project-filter/project-filter-directive.tpl.html',
      controller: ['$scope', '$state', '$stateParams', '$window', 'debounce', 'filterService', 'notificationService', 'organizationService', 'projectService', 'urlService', function ($scope, $state, $stateParams, $window, debounce, filterService, notificationService, organizationService, projectService, urlService) {
        function get() {
          return getOrganizations().then(getProjects);
        }

        function getAllProjectsUrl() {
          if (isOnSessionDashboard()) {
            return urlService.buildFilterUrl({ route: getStateName(), routePrefix: 'session' });
          }

          return urlService.buildFilterUrl({ route: getStateName(), type: $stateParams.type });
        }

        function getFilterName() {
          var organizationId = filterService.getOrganizationId();
          if (organizationId) {
            var organization = vm.organizations.filter(function(o) { return o.id === organizationId; })[0];
            if (organization) {
              return organization.name;
            }
          }

          var projectId = filterService.getProjectId();
          if (projectId) {
            var project = vm.projects.filter(function(p) { return p.id === projectId; })[0];
            if (project) {
              return project.name;
            }
          }

          return 'All Projects';
        }

        function getOrganizations() {
          function onSuccess(response) {
            vm.organizations = response.data.plain();

            if (filterService.getOrganizationId() && !vm.organizations.filter(function(o) { return o.id === filterService.getOrganizationId(); })) {
              filterService.setOrganizationId();
            }

            vm.filterName = getFilterName();
          }

          function onFailure() {
            notificationService.error('An error occurred while loading your organizations.');
          }

          return organizationService.getAll().then(onSuccess, onFailure);
        }

        function getOrganizationUrl(organization) {
          if (isOnSessionDashboard()) {
            return urlService.buildFilterUrl({ route: getStateName(), routePrefix: 'session', organizationId: organization.id });
          }

          return urlService.buildFilterUrl({ route: getStateName(), organizationId: organization.id, type: $stateParams.type });
        }

        function getProjects() {
          function onSuccess(response) {
            vm.projects = response.data.plain();

            if (filterService.getProjectId() && !vm.projects.filter(function(p) { return p.id === filterService.getProjectId(); })) {
              filterService.setProjectId();
            }

            vm.filterName = getFilterName();
          }

          function onFailure() {
            notificationService.error('An error occurred while loading your projects.');
          }

          return projectService.getAll().then(onSuccess, onFailure);
        }

        function getProjectsByOrganizationId(id) {
          return vm.projects.filter(function (project) { return project.organization_id === id; });
        }

        function getProjectUrl(project) {
          if (isOnSessionDashboard()) {
            return urlService.buildFilterUrl({ route: getStateName(), routePrefix: 'session', projectId: project.id });
          }

          return urlService.buildFilterUrl({ route: getStateName(), projectId: project.id, type: $stateParams.type });
        }

        function getStateName() {
          if ($state.current.name.endsWith('frequent')) {
            return 'frequent';
          }

          if ($state.current.name.endsWith('new')) {
            return 'new';
          }

          if ($state.current.name.endsWith('recent')) {
            return 'recent';
          }

          return 'dashboard';
        }

        function isOnSessionDashboard() {
          return $state.current.name.contains('session-') || $state.current.name === 'app.session.dashboard';
        }

        var updateFilterDropDownMaxHeight = debounce(function() {
          vm.filterDropDownMaxHeight = angular.element($window).height() - 52;
        }, 150);

        var window = angular.element($window);
        window.bind('resize', updateFilterDropDownMaxHeight);

        // NOTE: We need to watch on getFilterName because the filterChangedEvents might not be called depending on suspendNotifications option.
        var unbind = $scope.$watch(function() { return vm.getFilterName(); }, function (filterName) {
          vm.filterName = filterName;
        });

        $scope.$on('$destroy', function(e) {
          unbind();
          window.unbind('resize', updateFilterDropDownMaxHeight);
        });

        var vm = this;
        vm.filterName = 'Loading';
        vm.get = get;
        vm.getAllProjectsUrl = getAllProjectsUrl;
        vm.getFilterName = getFilterName;
        vm.getOrganizationUrl = getOrganizationUrl;
        vm.getProjectUrl = getProjectUrl;
        vm.getProjectsByOrganizationId = getProjectsByOrganizationId;
        vm.organizations = [];
        vm.projects = [];

        updateFilterDropDownMaxHeight();
        get();
      }],
      controllerAs: 'vm'
    };
  }]);
}());
