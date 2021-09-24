let app = angular.module('its2021z', [ 'ngRoute', 'ngSanitize', 'ngAnimate', 'ui.bootstrap' ])

app.constant('routes', [
	{ route: '/', templateUrl: 'home.html', controller: 'Home', controllerAs: 'ctrl', title: '<i class="fa fa-lg fa-home"></i>' },
	{ route: '/persons', templateUrl: 'persons.html', controller: 'Persons', controllerAs: 'ctrl', title: 'Osoby', role: 2 },
	{ route: '/projects', templateUrl: 'projects.html', controller: 'Projects', controllerAs: 'ctrl', title: 'Projekty' },
	{ route: '/tasks', templateUrl: 'tasks.html', controller: 'Tasks', controllerAs: 'ctrl', title: 'Zadania' }
])

// instalacja routera
app.config(['$routeProvider', '$locationProvider', 'routes', function($routeProvider, $locationProvider, routes) {
    $locationProvider.hashPrefix('')
	for(var i in routes) {
		$routeProvider.when(routes[i].route, routes[i])
	}
	$routeProvider.otherwise({ redirectTo: '/' })
}])

app.controller('Index', [ '$location', '$scope', 'routes', 'common', function($location, $scope, routes, common) {
    let ctrl = this
	console.log('Kontroler Index wystartował')
	
	ctrl.alert = common.alert
	ctrl.closeAlert = common.closeAlert

	ctrl.menu = common.menu

    ctrl.navClass = function(page) {
        return page === $location.path() ? 'active' : ''
    }

	ctrl.isCollapsed = true
    $scope.$on('$routeChangeSuccess', function () {
        ctrl.isCollapsed = true
    })

}])

app.service('common', [ '$http', 'routes', function($http, routes) {
	console.log('Usługa common startuje')
	var common = this

	common.test = function() { console.log('Test') }

	common.alert = { type: 'alert-default', text: '' }
	common.closeAlert = function() { common.alert.text = '' }

	common.session = {}

	common.menu = []

    common.rebuildMenu = function() {
		common.menu.length = 0
		for(var i in routes) {
			if(!routes[i].role || routes[i].role == common.session.role) {
				common.menu.push({ route: routes[i].route, title: routes[i].title })
			}
		}
    }

	$http.get('/auth').then(
		function(res) {
			common.session.login = res.data.login
			if(res.data.role) {
				common.session.role = res.data.role
			}
			common.rebuildMenu()
		},
		function(err) {}
	)
}])