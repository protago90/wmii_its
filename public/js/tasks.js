app.controller('Tasks', [ '$http', function($http) {
    console.log('Kontroler Tasks wystartował')
    let ctrl = this

    /* dane {
        total: całkowita liczba rekordów w bazie,
        filtered: liczba rekordów odfiltrowanych searchem,
        records: rekordy do wyświetlenia
    } */
    ctrl.data = { total: 0, filtered: 0, records: [] }

    // edycja
    ctrl.record = {}
    ctrl.selected = -1
    let clearRecord = function() {
        ctrl.record.name = ''
        ctrl.record.project = ''
        ctrl.record.date = new Date(Date.now())
    }
    clearRecord()

    // relacja
    ctrl.projects_pool = []

    // filtrowanie
    ctrl.search = ''
    ctrl.skip = 0
    ctrl.pageLimit = 10
    ctrl.limit = ctrl.pageLimit

    ctrl.create = function() {
        $http.post('/task', ctrl.record).then(
            function(res) {
                ctrl.getAllData()
                clearRecord()
            }, function(err) {}
        )
    }

    ctrl.getAllData = function() {
        $http.get('/task?search=' + ctrl.search + '&skip=' + ctrl.skip + '&limit=' + ctrl.limit).then(
            function(res) {
                ctrl.data = res.data
                ctrl.selected = -1
                clearForm()
            },
            function(err) {}
        )
    }

    ctrl.getProjectData = function() {
        $http.get('/project').then(
            function(res) {
                let records = res.data.records
                for(let id in records) ctrl.projects_pool.push( records[id].project )
            },
            function(err) {}
        )
    }

    ctrl.assertProject = function() {
        return ctrl.projects_pool.includes(ctrl.record.project)
    }

    ctrl.searchChanged = function() {
        ctrl.skip = 0
        ctrl.getAllData()
    }

    ctrl.getAllData()
    ctrl.getProjectData()
    ctrl.assertProject()

    ctrl.select = function(index) {
        ctrl.record.name = ctrl.data.records[index].name
        ctrl.record.project = ctrl.data.records[index].project
        ctrl.record.date = new Date(ctrl.data.records[index].date)
        ctrl.selected = index
    }

    let clearForm = function() {
        clearRecord()
    }

    ctrl.update = function() {
        let recordToUpdate = { _id: ctrl.data.records[ctrl.selected]._id }
        for(let key in ctrl.record) recordToUpdate[key] = ctrl.record[key]
        $http.put('/task', recordToUpdate).then(
            function(res) {
                ctrl.getAllData()
                clearForm()
            }, function(err) {}
        )
    }

    ctrl.delete = function() {
        $http.delete('/task?_id=' + ctrl.data.records[ctrl.selected]._id).then(
            function(res) {
                if(ctrl.selected == 0 && ctrl.skip >= ctrl.pageLimit && ctrl.skip == ctrl.data.filtered - 1) {
                    ctrl.skip -= ctrl.pageLimit
                }
                ctrl.getAllData()
                clearForm()
            }, function(err) {}
        )
    }

    ctrl.cancel = function() {
        ctrl.selected = -1
        clearForm()
    }
   
    ctrl.prevPage = function() {
        ctrl.skip -= ctrl.pageLimit
        ctrl.getAllData()
    }

    ctrl.nextPage = function() {
        ctrl.skip += ctrl.pageLimit
        ctrl.getAllData()
    }
}])