app.controller('Persons', [ '$http', 'common', function($http, common) {
    console.log('Kontroler Persons wystartował')
    let ctrl = this

    ctrl.session = common.session
    
    /* dane {
        total: całkowita liczba rekordów w bazie,
        filtered: liczba rekordów odfiltrowanych searchem,
        records: rekordy do wyświetlenia
    } */
    ctrl.data = { total: 0, filtered: 0, records: [] }

    // edycja
    ctrl.record = {}
    ctrl.selected = -1
    ctrl.tmp_selected_val = ''
    let clearRecord = function() {
        ctrl.tmp_selected_val = ''
        ctrl.record.name = ''
        ctrl.record.projects = []
        ctrl.record.value = 0
    }
    clearRecord()

    // relacje
    ctrl.persons_pool = ['']
    ctrl.persons_used = ['']
    ctrl.projects_pool = ['']
    ctrl.projects_related = {}

    // filtrowanie
    ctrl.search = ''
    ctrl.skip = 0
    ctrl.pageLimit = 10
    ctrl.limit = ctrl.pageLimit
    ctrl.order = 'NA'

    ctrl.create = function() {
        $http.post('/person', ctrl.record).then(
            function(res) {
                ctrl.getAllData()
                clearRecord()
                common.alert.text = 'Utworzono'
                common.alert.type = 'alert-success'            
            }, function(err) {}
        )
    }

    let clearForm = function() {
        clearRecord()
    }

    ctrl.getAllData = function() {
        $http.get('/person?order=' + ctrl.order + '&search=' + ctrl.search + '&skip=' + ctrl.skip + '&limit=' + ctrl.limit).then(
            function(res) {
                ctrl.data = res.data
                ctrl.selected = -1
                clearForm()
            },
            function(err) {}
        )
    }

    ctrl.getPersonData = function() {
        $http.get('/person').then(
            function(res) {
                let records = res.data.records
                for(let id in records) ctrl.persons_pool.push( records[id].name)
                ctrl.persons_pool = [...new Set(ctrl.persons_pool) ]
            },
            function(err) {}
        )
    }

    ctrl.getProjectData = function() {
        $http.get('/project').then(
            function(res) {
                let records = res.data.records
                for(let id in records) ctrl.projects_pool.push( records[id].project )
                ctrl.projects_pool = [...new Set(ctrl.projects_pool) ]
            },
            function(err) {}
        )
    }

    ctrl.getUsedPersonData = function() {
        $http.get('/project').then(
            function(res) {
                let records = res.data.records
                for(let id in records) ctrl.persons_used.push( records[id].lead)
                ctrl.persons_used = [...new Set(ctrl.persons_used) ]
            },
            function(err) {}
        )
    }

    ctrl.getRelatedProjectData = function() {
        $http.get('/project').then(
            function(res) {
                let records = res.data.records
                // for(let i in ctrl.persons_pool) {
                //     ctrl.projects_related[ctrl.persons_pool[i]] = []
                // }
                for(let i in records) {
                    let project = records[i].project
                    let person = records[i].lead
                    if(!ctrl.projects_related[person]) ctrl.projects_related[person] = []
                    ctrl.projects_related[person].push( project )
                }
            },
            function(err) {}
        )
    }

    ctrl.searchChanged = function() {
        ctrl.skip = 0
        ctrl.getAllData()
    }

    ctrl.isPerson = function() {
        return ctrl.persons_pool.includes(ctrl.record.name)
    }

    ctrl.isPersonUsed = function() {
        return ctrl.persons_used.includes(ctrl.tmp_selected_val)
    }

    ctrl.isPersonFixable = function() {
        return ctrl.isPersonUsed() && ctrl.tmp_selected_val != ctrl.record.name
    }

    ctrl.getAllData()
    ctrl.getPersonData()
    ctrl.getProjectData()
    ctrl.getUsedPersonData()
    ctrl.getRelatedProjectData()

    ctrl.select = function(index) {
        ctrl.tmp_selected_val = ctrl.data.records[index].name
        ctrl.record.name = ctrl.data.records[index].name
        ctrl.record.value = ctrl.data.records[index].value
        ctrl.selected = index
    }

    ctrl.update = function() {
        let recordToUpdate = { _id: ctrl.data.records[ctrl.selected]._id }
        for(let key in ctrl.record) recordToUpdate[key] = ctrl.record[key]
        $http.put('/person', recordToUpdate).then(
            function(res) {
                ctrl.getAllData()
                clearForm()
                common.alert.text = 'Dane zmienione'
                common.alert.type = 'alert-success'
            }, function(err) {}
        )
    }

    ctrl.delete = function() {
        $http.delete('/person?_id=' + ctrl.data.records[ctrl.selected]._id).then(
            function(res) {
                if(ctrl.selected == 0 && ctrl.skip >= ctrl.pageLimit && ctrl.skip == ctrl.data.filtered - 1) {
                    ctrl.skip -= ctrl.pageLimit
                }
                ctrl.getAllData()
                clearForm()
                common.alert.text = 'Skasowano'
                common.alert.type = 'alert-success'            
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

    ctrl.sort = function(arg) {
        ctrl.order = arg
        ctrl.getAllData()
    }
}])