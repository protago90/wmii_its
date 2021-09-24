app.controller('Home', [ '$http', 'common', function($http, common) {
    console.log('Kontroler Home wystartował')
    let ctrl = this
    
    ctrl.session = common.session
    ctrl.credentials = { login: '', password: '' }

    ctrl.login = function() {
        $http.post('/auth', ctrl.credentials).then(
            function(res) {
                common.session.login = res.data.login
                common.session.role = res.data.role
                common.rebuildMenu()
                common.alert.type = 'alert-success'
                common.alert.text = 'Witaj, ' + res.data.login
            },
            function(err) {
                common.alert.type = 'alert-danger'
                common.alert.text = 'Logowanie nieudane'
            }
        )
    }

    ctrl.logout = function() {
        $http.delete('/auth').then(
            function(res) {
                var login = common.session.login
                common.session.login = res.data.login
                delete common.session.role
                common.rebuildMenu()
                common.alert.type = 'alert-danger'
                common.alert.text = 'Żegnaj, ' + login
            },
            function(err) {}
        )
    }
}])